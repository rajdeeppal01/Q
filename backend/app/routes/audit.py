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


@router.get("/events")
def list_audit_events(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    risk_level: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None),
    agent_id: Optional[str] = Query(None),
    trace_id: Optional[str] = Query(None),
    policy_passed: Optional[bool] = Query(None),
    days: int = Query(7, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """
    Paginated, filterable audit event log for the Audit Trail page.
    Returns events with agent name joined in.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    q = select(Event, Agent.name.label("agent_name")).join(
        Agent, Event.agent_id == Agent.id, isouter=True
    ).where(Event.created_at >= cutoff)

    if risk_level:
        q = q.where(Event.risk_level == risk_level)
    if event_type:
        q = q.where(Event.event_type == event_type)
    if agent_id:
        q = q.where(Event.agent_id == agent_id)
    if trace_id:
        q = q.where(Event.trace_id == trace_id)
    if policy_passed is not None:
        q = q.where(Event.policy_passed == policy_passed)

    total = db.execute(select(func.count()).select_from(q.subquery())).scalar() or 0
    rows = db.execute(q.order_by(Event.created_at.desc()).offset((page - 1) * page_size).limit(page_size)).all()

    events_out = []
    for row in rows:
        ev = row[0]
        agent_name = row[1] or ev.agent_id
        events_out.append({
            "id": ev.id,
            "agent_id": ev.agent_id,
            "agent_name": agent_name,
            "event_type": ev.event_type,
            "tool_name": ev.tool_name,
            "risk_level": ev.risk_level,
            "policy_checked": ev.policy_checked,
            "policy_passed": ev.policy_passed,
            "latency_ms": ev.latency_ms,
            "trace_id": ev.trace_id,
            "error_message": ev.error_message,
            "created_at": ev.created_at.isoformat() if ev.created_at else None,
        })

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": max(1, (total + page_size - 1) // page_size),
        "events": events_out,
    }


@router.get("/export")
def export_platform_audit_csv(
    days: int = Query(7, ge=1, le=365),
    risk_level: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Export platform-wide audit log as CSV."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    q = select(Event, Agent.name.label("agent_name")).join(
        Agent, Event.agent_id == Agent.id, isouter=True
    ).where(Event.created_at >= cutoff).order_by(Event.created_at.desc()).limit(5000)
    if risk_level:
        q = q.where(Event.risk_level == risk_level)

    rows = db.execute(q).all()
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["Timestamp", "Event ID", "Agent", "Event Type", "Tool Name",
                     "Risk Level", "Policy Passed", "Latency (ms)", "Trace ID", "Error"])
    for row in rows:
        ev, agent_name = row[0], row[1] or ""
        writer.writerow([
            ev.created_at.isoformat() if ev.created_at else "",
            ev.id, agent_name, ev.event_type, ev.tool_name or "",
            ev.risk_level,
            "YES" if ev.policy_passed else ("NO" if ev.policy_passed is False else "N/A"),
            round(ev.latency_ms, 1) if ev.latency_ms else "",
            ev.trace_id or "",
            ev.error_message or "",
        ])
    output.seek(0)
    filename = f"q_audit_{datetime.now().strftime('%Y%m%d_%H%M')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/compliance/summary")
def get_platform_compliance_summary(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Platform-wide compliance summary across all frameworks.
    Returns per-framework scores, per-control status, and trend data.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    # Aggregate metrics
    total_events = db.execute(
        select(func.count(Event.id)).where(Event.created_at >= cutoff)
    ).scalar() or 0

    high_risk_events = db.execute(
        select(func.count(Event.id)).where(
            Event.risk_level.in_(["high", "critical"]),
            Event.created_at >= cutoff
        )
    ).scalar() or 0

    total_violations = db.execute(
        select(func.count(PolicyViolation.id)).where(PolicyViolation.created_at >= cutoff)
    ).scalar() or 0

    blocked_events = db.execute(
        select(func.count(Event.id)).where(
            Event.policy_checked == True,
            Event.policy_passed == False,
            Event.created_at >= cutoff
        )
    ).scalar() or 0

    policy_checked = db.execute(
        select(func.count(Event.id)).where(
            Event.policy_checked == True,
            Event.created_at >= cutoff
        )
    ).scalar() or 0

    total_agents = db.execute(select(func.count(Agent.id))).scalar() or 0
    active_agents = db.execute(
        select(func.count(Agent.id)).where(Agent.status == "active")
    ).scalar() or 0
    quarantined_agents = db.execute(
        select(func.count(Agent.id)).where(Agent.status == "quarantined")
    ).scalar() or 0

    t = max(total_events, 1)
    violation_rate = total_violations / t
    high_risk_rate = high_risk_events / t
    block_rate = blocked_events / max(policy_checked, 1)

    # --- NIST AI RMF per-function scores ---
    nist_govern = max(0, min(100, int(100 - violation_rate * 200)))
    nist_map    = max(0, min(100, int(100 - (quarantined_agents / max(total_agents, 1)) * 300)))
    nist_measure = max(0, min(100, int(100 - high_risk_rate * 150)))
    nist_manage  = max(0, min(100, int(100 - block_rate * 100 + (1 - violation_rate) * 20)))
    nist_overall = (nist_govern + nist_map + nist_measure + nist_manage) // 4

    # --- OWASP Agentic Top 10 per-item scores ---
    owasp_base = max(0, min(100, int(100 - violation_rate * 180 - high_risk_rate * 80)))
    owasp_controls = [
        {"id": "ASI01", "name": "Agent Goal Hijack",             "score": min(100, owasp_base + 5),  "status": "monitored"},
        {"id": "ASI02", "name": "Tool Misuse & Exploitation",    "score": min(100, owasp_base),      "status": "enforced" if policy_checked > 0 else "partial"},
        {"id": "ASI03", "name": "Identity & Privilege Abuse",   "score": min(100, owasp_base + 3),  "status": "monitored"},
        {"id": "ASI04", "name": "Supply Chain Vulnerabilities",  "score": min(100, owasp_base + 8),  "status": "partial"},
        {"id": "ASI05", "name": "Unexpected Code Execution",     "score": min(100, owasp_base - 5),  "status": "monitored"},
        {"id": "ASI06", "name": "Memory & Context Poisoning",    "score": min(100, owasp_base + 2),  "status": "partial"},
        {"id": "ASI07", "name": "Insecure Inter-Agent Comms",   "score": min(100, owasp_base + 4),  "status": "monitored"},
        {"id": "ASI08", "name": "Cascading Failures",            "score": min(100, owasp_base + 6),  "status": "partial"},
        {"id": "ASI09", "name": "Human-Agent Trust Exploitation","score": min(100, owasp_base + 1),  "status": "monitored"},
        {"id": "ASI10", "name": "Rogue Agents",                  "score": max(0, owasp_base - 10 + (10 if quarantined_agents == 0 else 0)), "status": "enforced" if quarantined_agents > 0 else "monitored"},
    ]
    owasp_overall = sum(c["score"] for c in owasp_controls) // len(owasp_controls)

    # --- ISO 42001 per-control scores ---
    iso_base = max(0, min(100, int(100 - (violation_rate + high_risk_rate) * 120)))
    iso_controls = [
        {"id": "A.2",  "name": "AI Policies",          "score": min(100, iso_base + 5),  "status": "compliant" if total_violations < 5 else "partial"},
        {"id": "A.3",  "name": "Internal Organisation", "score": min(100, iso_base + 3),  "status": "compliant"},
        {"id": "A.5",  "name": "Impact Assessment",     "score": min(100, iso_base),      "status": "partial"},
        {"id": "A.6",  "name": "AI Lifecycle",          "score": min(100, iso_base + 4),  "status": "compliant" if active_agents > 0 else "partial"},
        {"id": "A.8",  "name": "Transparency",          "score": min(100, iso_base + 6),  "status": "compliant"},
        {"id": "A.9",  "name": "Use of AI",             "score": min(100, iso_base - 2),  "status": "partial"},
        {"id": "A.10", "name": "Third-party AI",        "score": min(100, iso_base + 2),  "status": "partial"},
    ]
    iso_overall = sum(c["score"] for c in iso_controls) // len(iso_controls)

    return {
        "timeframe_days": days,
        "summary": {
            "total_events": total_events,
            "total_violations": total_violations,
            "high_risk_events": high_risk_events,
            "blocked_events": blocked_events,
            "total_agents": total_agents,
            "active_agents": active_agents,
            "quarantined_agents": quarantined_agents,
        },
        "nist": {
            "overall": nist_overall,
            "controls": [
                {"id": "GOVERN", "name": "Govern",  "score": nist_govern,  "description": "Policies, accountability, HITL gates"},
                {"id": "MAP",    "name": "Map",     "score": nist_map,     "description": "Agent registry, permission scoping"},
                {"id": "MEASURE","name": "Measure", "score": nist_measure, "description": "Risk scoring, anomaly metrics"},
                {"id": "MANAGE", "name": "Manage",  "score": nist_manage,  "description": "Auto-quarantine, alerts, approvals"},
            ]
        },
        "owasp": {
            "overall": owasp_overall,
            "controls": owasp_controls,
        },
        "iso": {
            "overall": iso_overall,
            "controls": iso_controls,
        },
        "overall": (nist_overall + owasp_overall + iso_overall) // 3,
    }
