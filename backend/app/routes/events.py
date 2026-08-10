"""
Q — Events API
Telemetry ingestion from instrumented agents.
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Header, Request
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import Optional, Any
from datetime import datetime, timezone
from pydantic import BaseModel
import logging
import hashlib

from app.database import get_db
from app.config import settings
from app.limiter import limiter
from app.models.agent import Agent
from app.models.event import Event
from app.models.alert import Alert
from app.models.identity import AgentIdentity
from app.websocket.manager import manager
from app.services.policy_engine import policy_engine, EventContext, apply_policy_verdict
from app.services.anomaly import anomaly_detector

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


# --- Anomaly Detection (Phase 4) ---

def process_event_background(event_data: dict, agent_id: str, db: Session):
    """Background task: runs the full statistical + OWASP anomaly detector, persists alerts."""
    try:
        event_obj = TelemetryEvent(**event_data)

        anomalies = anomaly_detector.analyze(
            agent_id=agent_id,
            event_type=event_obj.event_type,
            tool_name=event_obj.tool_name,
            risk_level=event_obj.risk_level,
            input_data=event_obj.input_data,
        )

        for result in anomalies:
            alert = Alert(
                agent_id=agent_id,
                alert_type=result.owasp_id or result.anomaly_type,
                severity=result.severity,
                message=result.message,
                context={**event_data, "evidence": result.evidence, "anomaly_type": result.anomaly_type},
                status="open",
            )
            db.add(alert)

        if anomalies:
            db.commit()
            logger.warning(f"[Anomaly] {len(anomalies)} anomalies detected for agent {agent_id}")

    except Exception as e:
        logger.error(f"Error in background event processing: {e}")


# --- Endpoints ---

@router.post("/ingest")
@limiter.limit(settings.RATE_LIMIT_EVENTS)
async def ingest_event(
    request: Request,
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
        raise HTTPException(status_code=400, detail="Missing agent_id")

    if not x_q_api_key:
        raise HTTPException(status_code=401, detail="Missing x-q-api-key header")

    agent = db.execute(select(Agent).where(Agent.id == event.agent_id)).scalars().first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    if agent.status in ["revoked", "quarantined"]:
        raise HTTPException(status_code=403, detail=f"Agent is {agent.status}")

    # Validate API Key
    api_key_hash_val = hashlib.sha256(x_q_api_key.encode()).hexdigest()
    identity = db.execute(
        select(AgentIdentity).where(
            AgentIdentity.agent_id == event.agent_id,
            AgentIdentity.api_key_hash == api_key_hash_val,
            AgentIdentity.is_active == True
        )
    ).scalars().first()
    
    if not identity:
        raise HTTPException(status_code=401, detail="Invalid or revoked API key")

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

    # --- Policy Engine Evaluation ---
    if event.agent_id:
        ctx = EventContext(
            agent_id=event.agent_id,
            event_type=event.event_type,
            tool_name=event.tool_name,
            risk_level=event.risk_level,
            input_data=event.input_data or {},
            created_at=datetime.now(timezone.utc),
            latency_ms=event.latency_ms,
            agent_status=agent.status if agent else "active",
            agent_framework=agent.framework if agent else None,
        )
        result = policy_engine.evaluate(ctx, db)
        await apply_policy_verdict(result, ctx, db_event, db, manager)

        # Block the event if policy says so
        if not result.passed and result.action == "block":
            return {
                "status": "blocked",
                "event_id": db_event.id,
                "reason": result.block_reason,
                "action": result.action,
            }
        if result.action == "quarantine":
            return {
                "status": "quarantined",
                "event_id": db_event.id,
                "reason": result.block_reason,
            }

        event_dict["policy_passed"] = result.passed
        event_dict["policy_action"] = result.action

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
