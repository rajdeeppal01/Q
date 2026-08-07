"""
Q — Policies API
CRUD operations and runtime evaluation for agent governance policies.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel

from app.database import get_db
from app.models.policy import Policy
from app.models.agent import Agent
from app.routes.auth import get_current_user

router = APIRouter(prefix="/policies", tags=["Policies"])

# --- Schemas ---

class PolicyCreate(BaseModel):
    name: str
    description: Optional[str] = None
    policy_type: str
    conditions: dict
    actions: dict
    severity: str = "warning"

class PolicyResponse(PolicyCreate):
    id: str
    created_by: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# --- Endpoints ---

@router.post("/", response_model=PolicyResponse)
def create_policy(
    policy_data: PolicyCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new governance policy."""
    policy = Policy(
        created_by=current_user.id,
        name=policy_data.name,
        description=policy_data.description,
        policy_type=policy_data.policy_type,
        conditions=policy_data.conditions,
        actions=policy_data.actions,
        severity=policy_data.severity
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return policy

@router.get("/", response_model=List[PolicyResponse])
def get_policies(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """List all policies created by the current user."""
    policies = db.execute(
        select(Policy).where(Policy.created_by == current_user.id)
    ).scalars().all()
    return policies

@router.get("/active")
def get_active_policies_for_agent(
    agent_id: str,
    db: Session = Depends(get_db)
):
    """
    Called by the Agent SDK to fetch active policies to cache locally.
    In a real system, we'd authenticate the agent here.
    """
    agent = db.execute(select(Agent).where(Agent.id == agent_id)).scalars().first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
        
    policies = db.execute(
        select(Policy).where(Policy.created_by == agent.owner_id, Policy.is_active == True)
    ).scalars().all()
    
    return [
        {
            "id": p.id,
            "policy_type": p.policy_type,
            "conditions": p.conditions,
            "actions": p.actions
        } for p in policies
    ]
