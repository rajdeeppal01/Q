"""
Q — Approvals API (HITL)
Manage human-in-the-loop approval workflows for governed AI agents.
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List, Optional, Any
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
    tool_name: str
    input_data: Optional[dict[str, Any]] = None
    reason: str
    risk_level: str = "high"

class ApprovalResponse(BaseModel):
    id: str
    agent_id: str
    tool_name: str
    input_data: Optional[dict[str, Any]] = None
    reason: str
    risk_level: str
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class ApprovalAction(BaseModel):
    action: str  # approve, reject

# --- Endpoints ---

@router.post("/request", response_model=ApprovalResponse)
async def request_approval(
    req: ApprovalCreate,
    db: Session = Depends(get_db)
):
    """SDK calls this to request permission before executing a high-risk tool."""
    # Note: In prod, auth the agent
    approval = ApprovalRequest(
        agent_id=req.agent_id,
        tool_name=req.tool_name,
        input_data=req.input_data,
        reason=req.reason,
        risk_level=req.risk_level,
        status="pending",
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=15)
    )
    db.add(approval)
    db.commit()
    db.refresh(approval)
    
    # Broadcast to dashboard
    await manager.broadcast({
        "type": "approval_request",
        "data": {
            "id": approval.id,
            "agent_id": approval.agent_id,
            "tool_name": approval.tool_name,
            "reason": approval.reason
        }
    }, channel="global")
    
    return approval

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
    
    # Let the agent know immediately if it's connected via websocket
    await manager.broadcast({
        "type": "approval_result",
        "data": {
            "id": approval.id,
            "status": approval.status
        }
    }, channel=approval.agent_id)
    
    return {"message": f"Request {approval.status}"}
