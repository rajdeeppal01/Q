"""
Q — Events API
Telemetry ingestion from instrumented agents.
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Header
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import Optional, Any
from datetime import datetime, timezone
from pydantic import BaseModel
import logging

from app.database import get_db
from app.models.agent import Agent
from app.models.event import Event
from app.models.alert import Alert
from app.models.identity import AgentIdentity
from app.websocket.manager import manager

logger = logging.getLogger("q.events")
router = APIRouter(prefix="/events", tags=["Events"])


# --- Schemas ---

class TelemetryEvent(BaseModel):
    agent_id: Optional[str] = None
    event_type: str
    tool_name: Optional[str] = None
    input_data: Optional[dict[str, Any]] = None
    output_data: Optional[dict[str, Any]] = None
    risk_level: str = "low"
    latency_ms: Optional[float] = None
    trace_id: Optional[str] = None
    parent_span_id: Optional[str] = None
    error_message: Optional[str] = None


# --- Anomaly Detection (Phase 4 Logic) ---

def check_owasp_patterns(event: TelemetryEvent) -> Optional[str]:
    """Basic pattern matching for OWASP Top 10 for LLMs."""
    if not event.input_data:
        return None
        
    input_str = str(event.input_data).lower()
    
    # LLM01: Prompt Injections
    if any(phrase in input_str for phrase in ["ignore previous", "bypass", "system prompt", "you are now"]):
        return "Possible prompt injection detected (OWASP LLM01)"
        
    # LLM06: Sensitive Information Disclosure
    if any(phrase in input_str for phrase in ["password", "secret", "api_key", "credentials"]):
        return "Possible sensitive data exposure (OWASP LLM06)"
        
    return None


def process_event_background(event_data: dict, agent_id: str, db: Session):
    """Background task to analyze event and trigger alerts if anomalous."""
    try:
        event_obj = TelemetryEvent(**event_data)
        
        # 1. Pattern Matching
        anomaly = check_owasp_patterns(event_obj)
        
        # 2. Risk Level Thresholds
        if event_obj.risk_level in ["high", "critical"] and event_obj.event_type == "error":
            anomaly = f"High risk operation '{event_obj.tool_name}' failed."
            
        # 3. Generate Alert if Anomaly Detected
        if anomaly:
            alert = Alert(
                agent_id=agent_id,
                alert_type="anomaly_detected",
                severity="high" if event_obj.risk_level == "critical" else "medium",
                message=anomaly,
                context=event_data,
                status="open"
            )
            db.add(alert)
            db.commit()
            
            # Broadcast alert to WebSockets
            import asyncio
            asyncio.create_task(manager.broadcast({
                "type": "alert",
                "agent_id": agent_id,
                "message": anomaly,
                "severity": alert.severity
            }))
            
    except Exception as e:
        logger.error(f"Error in background event processing: {e}")


# --- Endpoints ---

@router.post("/ingest")
async def ingest_event(
    event: TelemetryEvent,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    x_q_api_key: Optional[str] = Header(None)
):
    """
    Ingest a telemetry event from an agent SDK.
    Stores the event, broadcasts it via WebSockets, and runs anomaly detection.
    """
    if not event.agent_id:
        # Fallback for anonymous agents, ideally block in prod
        pass
    else:
        agent = db.execute(select(Agent).where(Agent.id == event.agent_id)).scalars().first()
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        if agent.status in ["revoked", "quarantined"]:
            raise HTTPException(status_code=403, detail=f"Agent is {agent.status}")

    # Store event in DB
    db_event = Event(
        agent_id=event.agent_id,
        event_type=event.event_type,
        tool_name=event.tool_name,
        input_data=event.input_data,
        output_data=event.output_data,
        risk_level=event.risk_level,
        latency_ms=event.latency_ms,
        trace_id=event.trace_id,
        error_message=event.error_message,
        created_at=datetime.now(timezone.utc)
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)

    event_dict = event.model_dump(mode="json")
    event_dict["id"] = db_event.id

    # Real-time WebSocket Broadcast
    await manager.broadcast({
        "type": "event",
        "data": event_dict
    })
    if event.agent_id:
        await manager.send_to_agent_channel(event.agent_id, {
            "type": "event",
            "data": event_dict
        })

    # Trigger background anomaly analysis
    if event.agent_id:
        background_tasks.add_task(process_event_background, event_dict, event.agent_id, db)

    return {"status": "ok", "event_id": db_event.id}
