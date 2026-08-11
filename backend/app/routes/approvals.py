"""
Q — Approvals API (HITL)
Manage human-in-the-loop approval workflows for governed AI agents.
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from typing import List, Optional, Any
import asyncio
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel

from app.database import get_db
from app.models.approval import ApprovalRequest
from app.models.agent import Agent
from app.routes.auth import get_current_user
from app.websocket.manager import manager

router = APIRouter(prefix="/approvals", tags=["Approvals"])

# --- Schemas ---

class ApprovalCreate(BaseModel):
    agent_id: str
    action_description: str
    reason: str
    context: dict[str, Any] = {}
    timeout_seconds: int = 300

class ApprovalResponse(BaseModel):
    id: str
    agent_id: str
    action_description: str
    reason: str
    context: dict[str, Any]
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class ApprovalAction(BaseModel):
    action: str  # approve, reject

# --- Endpoints ---

# In-memory store for pending requests so the /request endpoint can block
pending_approvals_events = {}

@router.post("/request")
async def request_approval(
    req: ApprovalCreate,
    db: Session = Depends(get_db)
):
    """SDK calls this to request permission before executing a high-risk tool."""
    # State Exhaustion Protection
    pending_count = db.execute(
        select(func.count()).where(
            ApprovalRequest.agent_id == req.agent_id,
            ApprovalRequest.status == "pending"
        )
    ).scalar()
    if pending_count >= 5:
        raise HTTPException(status_code=429, detail="Too many pending approvals for this agent")

    # Note: In prod, auth the agent
    approval = ApprovalRequest(
        agent_id=req.agent_id,
        action_description=req.action_description,
        context=req.context,
        reason=req.reason,
        status="pending",
        expires_at=datetime.now(timezone.utc) + timedelta(seconds=req.timeout_seconds)
    )
    db.add(approval)
    db.commit()
    db.refresh(approval)
    
    # Setup the event for blocking
    wait_event = asyncio.Event()
    pending_approvals_events[approval.id] = wait_event

    # Broadcast to dashboard
    await manager.broadcast({
        "type": "approval_request",
        "data": {
            "id": approval.id,
            "agent_id": approval.agent_id,
            "action_description": approval.action_description,
            "reason": approval.reason
        }
    }, channel="global")
    
    # Wait for the human to review or timeout
    try:
        await asyncio.wait_for(wait_event.wait(), timeout=req.timeout_seconds)
    except asyncio.TimeoutError:
        approval.status = "expired"
        db.commit()
    finally:
        pending_approvals_events.pop(approval.id, None)
        
    db.refresh(approval)
    
    # Return the format the SDK expects
    return {
        "approved": approval.status == "approved",
        "review_notes": approval.review_notes,
        "reviewed_by": approval.reviewed_by,
        "approved_context": approval.context if approval.status == "approved" else None
    }

@router.get("/{approval_id}/status")
def get_approval_status(approval_id: str, db: Session = Depends(get_db)):
    """SDK polls this to see if the human has approved/rejected it."""
    approval = db.execute(select(ApprovalRequest).where(ApprovalRequest.id == approval_id)).scalars().first()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found")
        
    return {"status": approval.status, "reason": approval.reason}

@router.get("/", response_model=List[ApprovalResponse])
def get_pending_approvals(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Dashboard calls this to list all pending approvals."""
    agents = db.execute(select(Agent.id).where(Agent.owner_id == current_user.id)).scalars().all()
    if not agents:
        return []
        
    approvals = db.execute(
        select(ApprovalRequest).where(
            ApprovalRequest.agent_id.in_(agents),
            ApprovalRequest.status == "pending"
        ).order_by(ApprovalRequest.created_at.desc())
    ).scalars().all()
    
    return approvals

@router.post("/{approval_id}/review")
async def review_approval(
    approval_id: str,
    action_data: ApprovalAction,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Admin calls this from the dashboard to approve or reject."""
    approval = db.execute(select(ApprovalRequest).where(ApprovalRequest.id == approval_id)).scalars().first()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found")
        
    agent = db.execute(select(Agent).where(Agent.id == approval.agent_id)).scalars().first()
    if not agent or agent.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    if action_data.action == "approve":
        approval.status = "approved"
    elif action_data.action == "reject":
        approval.status = "rejected"
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
        
    approval.reviewed_by = current_user.id
    approval.reviewed_at = datetime.now(timezone.utc)
    db.commit()
    
    # Trigger the event to unblock the waiting /request endpoint
    if approval.id in pending_approvals_events:
        pending_approvals_events[approval.id].set()
    
    # Let the agent know immediately if it's connected via websocket (optional)
    await manager.broadcast({
        "type": "approval_result",
        "data": {
            "id": approval.id,
            "status": approval.status
        }
    }, channel=approval.agent_id)
    
    return {"message": f"Request {approval.status}"}
