"""
Q — Agents API
Registration, CRUD, and identity management for governed AI agents.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Header, Request
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List, Optional
import uuid
import secrets
import hashlib
from datetime import datetime, timezone

from app.database import get_db
from app.models.agent import Agent
from app.models.identity import AgentIdentity
from app.routes.auth import get_current_user
from pydantic import BaseModel
from app.config import settings
from app.limiter import limiter

router = APIRouter(prefix="/agents", tags=["Agents"])


# --- Schemas ---

class AgentCreate(BaseModel):
    name: str
    description: Optional[str] = None
    agent_type: str = "general"
    framework: Optional[str] = None

class AgentResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    agent_type: str
    framework: Optional[str] = None
    status: str
    risk_level: str
    permissions: dict = {}
    metadata_: dict = {}
    api_key: Optional[str] = None  # Only returned on creation
    
    class Config:
        from_attributes = True


class AgentStatusUpdate(BaseModel):
    status: str  # active, paused, revoked, quarantined


# --- Endpoints ---

@router.post("/register", response_model=AgentResponse)
@limiter.limit(settings.RATE_LIMIT_AUTH)
def register_agent(
    request: Request,
    agent_data: AgentCreate,
    db: Session = Depends(get_db),
    # For MVP, we might allow SDK auto-registration without user auth, 
    # but for security, a valid user token or a "project registration token" is required.
    # We will assume a default owner for now if auth is bypassed for the SDK demo.
    x_q_api_key: Optional[str] = Header(None)
):
    """
    Register a new AI agent with the Q platform.
    Returns the agent ID and a newly generated API key for the agent's identity.
    """
    # In a real scenario, validate x_q_api_key as a master project token.
    # For now, we find the first user (the admin) to own the agent.
    from app.models.user import User
    owner = db.execute(select(User)).scalars().first()
    if not owner:
        # Create a dummy user if none exists (just for quickstart demo purposes)
        owner = User(email="admin@q-platform.internal", name="Q Admin", password_hash="dummy")
        db.add(owner)
        db.commit()
        db.refresh(owner)

    # 1. Create the Agent record
    new_agent = Agent(
        owner_id=owner.id,
        name=agent_data.name,
        description=agent_data.description,
        agent_type=agent_data.agent_type,
        framework=agent_data.framework,
    )
    db.add(new_agent)
    db.flush()  # To get the agent ID

    # 2. Generate an API Key (Agent Identity)
    raw_api_key = f"q_sk_{secrets.token_urlsafe(32)}"
    
    api_key_hash_val = hashlib.sha256(raw_api_key.encode()).hexdigest()
    
    identity = AgentIdentity(
        agent_id=new_agent.id,
        api_key_hash=api_key_hash_val,
        api_key_prefix=raw_api_key[:12],
    )
    db.add(identity)
    db.commit()
    db.refresh(new_agent)

    # 3. Return response with the plaintext key (only time it's ever shown!)
    response = AgentResponse.model_validate(new_agent)
    response.api_key = raw_api_key
    return response


@router.get("/", response_model=List[AgentResponse])
def list_agents(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """List all agents owned by the current user."""
    agents = db.execute(
        select(Agent).where(Agent.owner_id == current_user.id)
    ).scalars().all()
    return agents


@router.get("/{agent_id}", response_model=AgentResponse)
def get_agent(agent_id: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Get details of a specific agent."""
    agent = db.execute(
        select(Agent).where(Agent.id == agent_id, Agent.owner_id == current_user.id)
    ).scalars().first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.put("/{agent_id}/status")
def update_agent_status(
    agent_id: str, 
    update_data: AgentStatusUpdate,
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    """Pause, revoke, or activate an agent (status management)."""
    agent = db.execute(
        select(Agent).where(Agent.id == agent_id, Agent.owner_id == current_user.id)
    ).scalars().first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
        
    valid_statuses = ["active", "paused", "revoked", "quarantined"]
    if update_data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")

    agent.status = update_data.status
    db.commit()
    return {"message": f"Agent status updated to {agent.status}"}


@router.post("/{agent_id}/keys/rotate")
def rotate_agent_key(
    agent_id: str, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    """Rotate the API key for an agent."""
    agent = db.execute(
        select(Agent).where(Agent.id == agent_id, Agent.owner_id == current_user.id)
    ).scalars().first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Invalidate old keys
    old_identities = db.execute(
        select(AgentIdentity).where(AgentIdentity.agent_id == agent_id)
    ).scalars().all()
    for identity in old_identities:
        identity.is_active = False

    # Generate new key
    raw_api_key = f"q_sk_{secrets.token_urlsafe(32)}"
    api_key_hash_val = hashlib.sha256(raw_api_key.encode()).hexdigest()
    new_identity = AgentIdentity(
        agent_id=agent.id,
        api_key_hash=api_key_hash_val,
        api_key_prefix=raw_api_key[:12],
    )
    db.add(new_identity)
    db.commit()

    return {"message": "Key rotated successfully", "new_api_key": raw_api_key}


@router.post("/{agent_id}/heartbeat")
@limiter.limit(settings.RATE_LIMIT_EVENTS)
def agent_heartbeat(
    request: Request,
    agent_id: str,
    db: Session = Depends(get_db),
    x_q_api_key: Optional[str] = Header(None)
):
    """SDK calls this periodically to indicate the agent is alive."""
    if not x_q_api_key:
        raise HTTPException(status_code=401, detail="Missing x-q-api-key header")

    agent = db.execute(select(Agent).where(Agent.id == agent_id)).scalars().first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
        
    api_key_hash_val = hashlib.sha256(x_q_api_key.encode()).hexdigest()
    identity = db.execute(
        select(AgentIdentity).where(
            AgentIdentity.agent_id == agent_id,
            AgentIdentity.api_key_hash == api_key_hash_val,
            AgentIdentity.is_active == True
        )
    ).scalars().first()
    
    if not identity:
        raise HTTPException(status_code=401, detail="Invalid or revoked API key")
    agent.last_heartbeat = datetime.now(timezone.utc)
    db.commit()
    return {"status": "alive"}


@router.get("/{agent_id}/events")
def get_agent_events(
    agent_id: str,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Get the most recent events for a specific agent (for the Agent Detail timeline)."""
    from app.models.event import Event
    agent = db.execute(
        select(Agent).where(Agent.id == agent_id, Agent.owner_id == current_user.id)
    ).scalars().first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    events = db.execute(
        select(Event).where(Event.agent_id == agent_id)
        .order_by(Event.created_at.desc())
        .limit(limit)
    ).scalars().all()

    return [
        {
            "id": e.id,
            "event_type": e.event_type,
            "tool_name": e.tool_name,
            "risk_level": e.risk_level,
            "policy_passed": e.policy_passed,
            "latency_ms": e.latency_ms,
            "trace_id": e.trace_id,
            "error_message": e.error_message,
            "created_at": e.created_at.isoformat() if e.created_at else None,
        }
        for e in events
    ]


@router.get("/{agent_id}/stats")
def get_agent_stats(
    agent_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Get aggregated KPI stats for a specific agent."""
    from app.models.event import Event
    from app.models.alert import Alert
    from sqlalchemy import func

    agent = db.execute(
        select(Agent).where(Agent.id == agent_id, Agent.owner_id == current_user.id)
    ).scalars().first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    total_events = db.execute(
        select(func.count(Event.id)).where(Event.agent_id == agent_id)
    ).scalar() or 0

    blocked = db.execute(
        select(func.count(Event.id)).where(
            Event.agent_id == agent_id, Event.policy_passed == False
        )
    ).scalar() or 0

    critical = db.execute(
        select(func.count(Event.id)).where(
            Event.agent_id == agent_id, Event.risk_level == "critical"
        )
    ).scalar() or 0

    open_alerts = db.execute(
        select(func.count(Alert.id)).where(
            Alert.agent_id == agent_id, Alert.status == "open"
        )
    ).scalar() or 0

    avg_latency = db.execute(
        select(func.avg(Event.latency_ms)).where(
            Event.agent_id == agent_id, Event.latency_ms != None
        )
    ).scalar()

    # Tool usage breakdown
    tool_counts = db.execute(
        select(Event.tool_name, func.count(Event.id).label("count"))
        .where(Event.agent_id == agent_id, Event.tool_name != None)
        .group_by(Event.tool_name)
        .order_by(func.count(Event.id).desc())
        .limit(8)
    ).all()

    # Risk breakdown
    risk_counts = db.execute(
        select(Event.risk_level, func.count(Event.id).label("count"))
        .where(Event.agent_id == agent_id)
        .group_by(Event.risk_level)
    ).all()

    return {
        "total_events": total_events,
        "blocked_events": blocked,
        "critical_events": critical,
        "open_alerts": open_alerts,
        "avg_latency_ms": round(avg_latency, 1) if avg_latency else None,
        "tool_usage": [{"tool": r[0], "count": r[1]} for r in tool_counts],
        "risk_breakdown": {r[0]: r[1] for r in risk_counts},
    }

