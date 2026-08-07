"""
Q — Audit & Compliance API
Generate compliance reports (NIST, OWASP, ISO) and query historical audit trails.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
import csv
from io import StringIO
from fastapi.responses import StreamingResponse

from app.database import get_db
from app.models.event import Event
from app.models.policy import PolicyViolation
from app.models.agent import Agent
from app.routes.auth import get_current_user

router = APIRouter(prefix="/audit", tags=["Audit & Compliance"])


# --- Schemas ---

class ComplianceScore(BaseModel):
    nist_ai_rmf: int
    owasp_llm: int
    iso_42001: int
    overall_health: int

class AuditReportResponse(BaseModel):
    agent_id: str
    timeframe_days: int
    total_actions: int
    policy_violations: int
    anomalies_detected: int
    compliance_scores: ComplianceScore


# --- Helper Logic ---

def calculate_compliance_scores(total_actions: int, violations: int, anomalies: int) -> ComplianceScore:
    """Calculates heuristic compliance scores based on agent behavior."""
    if total_actions == 0:
        return ComplianceScore(nist_ai_rmf=100, owasp_llm=100, iso_42001=100, overall_health=100)
        
    violation_rate = (violations / total_actions) * 100
    anomaly_rate = (anomalies / total_actions) * 100
    
    # NIST AI RMF: Heavily penalized by policy violations (governance failures)
    nist = max(0, 100 - int(violation_rate * 5))
    
    # OWASP: Heavily penalized by anomalies (security/prompt injection failures)
    owasp = max(0, 100 - int(anomaly_rate * 7))
    
    # ISO 42001: General management system health
    iso = max(0, 100 - int((violation_rate + anomaly_rate) * 3))
    
    overall = (nist + owasp + iso) // 3
    return ComplianceScore(
        nist_ai_rmf=nist,
        owasp_llm=owasp,
        iso_42001=iso,
        overall_health=overall
    )


# --- Endpoints ---

@router.get("/report/{agent_id}", response_model=AuditReportResponse)
def get_compliance_report(
    agent_id: str,
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Generate a compliance and health report for an agent over a time period."""
    # Verify ownership
    agent = db.execute(select(Agent).where(Agent.id == agent_id, Agent.owner_id == current_user.id)).scalars().first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found or unauthorized")
        
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    # Total Actions (Events)
    total_actions = db.execute(
        select(func.count(Event.id)).where(Event.agent_id == agent_id, Event.created_at >= cutoff_date)
    ).scalar() or 0
    
    # Total Violations
    violations = db.execute(
        select(func.count(PolicyViolation.id)).where(PolicyViolation.agent_id == agent_id, PolicyViolation.created_at >= cutoff_date)
    ).scalar() or 0
    
    # Anomalies (High/Critical risk events)
    anomalies = db.execute(
        select(func.count(Event.id)).where(
            Event.agent_id == agent_id, 
            Event.risk_level.in_(["high", "critical"]),
            Event.created_at >= cutoff_date
        )
    ).scalar() or 0
    
    scores = calculate_compliance_scores(total_actions, violations, anomalies)
    
    return AuditReportResponse(
        agent_id=agent_id,
        timeframe_days=days,
        total_actions=total_actions,
        policy_violations=violations,
        anomalies_detected=anomalies,
        compliance_scores=scores
    )


@router.get("/export/{agent_id}")
def export_audit_log_csv(
    agent_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Export the raw audit log (events) as a CSV file for compliance auditors."""
    # Verify ownership
    agent = db.execute(select(Agent).where(Agent.id == agent_id, Agent.owner_id == current_user.id)).scalars().first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
        
    events = db.execute(
        select(Event).where(Event.agent_id == agent_id).order_by(Event.created_at.desc()).limit(1000)
    ).scalars().all()
    
    # Generate CSV in memory
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["Timestamp", "Event ID", "Event Type", "Tool Name", "Risk Level", "Error"])
    
    for e in events:
        writer.writerow([
            e.created_at.isoformat(),
            e.id,
            e.event_type,
            e.tool_name or "",
            e.risk_level,
            e.error_message or ""
        ])
        
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=audit_log_{agent.name}_{datetime.now().strftime('%Y%m%d')}.csv"}
    )
