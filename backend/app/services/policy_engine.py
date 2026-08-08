"""
Q — Policy Engine
Evaluates incoming telemetry events against all active governance policies.
Returns a verdict: pass, warn, block, require_approval, or quarantine.
"""

import logging
from datetime import datetime, timezone, timedelta
from typing import Optional
from dataclasses import dataclass, field
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.models.policy import Policy, PolicyViolation
from app.models.agent import Agent
from app.models.event import Event
from app.models.alert import Alert

logger = logging.getLogger("q.policy_engine")


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class EvaluationResult:
    """The outcome of evaluating a single event against all active policies."""
    passed: bool = True
    action: str = "pass"          # pass | warn | block | require_approval | quarantine
    triggered_policies: list = field(default_factory=list)
    violations: list = field(default_factory=list)
    block_reason: Optional[str] = None


@dataclass
class EventContext:
    """Normalised view of a telemetry event used during policy evaluation."""
    agent_id: str
    event_type: str
    tool_name: Optional[str]
    risk_level: str
    input_data: dict
    created_at: datetime
    latency_ms: Optional[float]
    agent_status: str = "active"
    agent_framework: Optional[str] = None


# ---------------------------------------------------------------------------
# Condition matchers
# ---------------------------------------------------------------------------

def _match_condition(ctx: EventContext, conditions: dict) -> bool:
    """
    Returns True when ALL conditions in the dict are satisfied.

    Supported condition keys:
        risk_levels        – list[str], e.g. ["high", "critical"]
        tool_names         – list[str], exact match
        tool_names_exclude – list[str], blocked tool names
        event_types        – list[str]
        agent_ids          – list[str]
        input_contains     – list[str], substring search in serialised input
        min_latency_ms     – float, trigger if latency exceeds this
        always             – bool, always triggers (catch-all)
    """
    if conditions.get("always"):
        return True

    # Risk level filter
    allowed_risks = conditions.get("risk_levels")
    if allowed_risks and ctx.risk_level not in allowed_risks:
        return False

    # Specific tool names (whitelist)
    tool_names = conditions.get("tool_names")
    if tool_names and ctx.tool_name not in tool_names:
        return False

    # Blocked tool names
    tool_names_exclude = conditions.get("tool_names_exclude")
    if tool_names_exclude and ctx.tool_name in tool_names_exclude:
        return True  # Blocked-tool rule explicitly matches

    # Event types
    event_types = conditions.get("event_types")
    if event_types and ctx.event_type not in event_types:
        return False

    # Agent scope
    agent_ids = conditions.get("agent_ids")
    if agent_ids and ctx.agent_id not in agent_ids:
        return False

    # Input payload substring search (prompt injection, sensitive data)
    input_contains = conditions.get("input_contains")
    if input_contains:
        serialised = str(ctx.input_data).lower()
        if not any(phrase.lower() in serialised for phrase in input_contains):
            return False

    # Latency threshold
    min_latency = conditions.get("min_latency_ms")
    if min_latency is not None:
        if ctx.latency_ms is None or ctx.latency_ms < min_latency:
            return False

    return True


def _match_rate_limit(ctx: EventContext, conditions: dict, db: Session) -> bool:
    """
    Rate-limit check: how many events has this agent fired in the last window?
    """
    window_seconds = conditions.get("window_seconds", 3600)
    max_calls = conditions.get("max_calls", 100)
    tool_names = conditions.get("tool_names")

    since = datetime.now(timezone.utc) - timedelta(seconds=window_seconds)
    q = db.query(func.count(Event.id)).filter(
        Event.agent_id == ctx.agent_id,
        Event.created_at >= since,
    )
    if tool_names:
        q = q.filter(Event.tool_name.in_(tool_names))

    count = q.scalar() or 0
    return count >= max_calls


# ---------------------------------------------------------------------------
# Policy evaluator
# ---------------------------------------------------------------------------

class PolicyEngine:
    """
    Core policy evaluation engine.
    Call `evaluate(ctx, db)` during event ingestion.
    """

    # Action precedence: higher index = more severe; we always take the worst
    ACTION_PRECEDENCE = ["pass", "warn", "require_approval", "block", "quarantine"]

    def evaluate(self, ctx: EventContext, db: Session) -> EvaluationResult:
        result = EvaluationResult()

        # Fetch all active policies
        policies = db.execute(select(Policy).where(Policy.is_active == True)).scalars().all()

        for policy in policies:
            triggered = False

            try:
                if policy.policy_type == "rate_limit":
                    triggered = _match_rate_limit(ctx, policy.conditions, db)
                else:
                    triggered = _match_condition(ctx, policy.conditions)
            except Exception as e:
                logger.warning(f"Policy {policy.id} condition error: {e}")
                continue

            if not triggered:
                continue

            # Determine action from this policy
            action = policy.actions.get("action", "warn")
            result.triggered_policies.append({
                "id": policy.id,
                "name": policy.name,
                "policy_type": policy.policy_type,
                "action": action,
                "severity": policy.severity,
            })

            # Upgrade result action if this is more severe
            if self._precedence(action) > self._precedence(result.action):
                result.action = action
                result.block_reason = (
                    policy.actions.get("message")
                    or f"Policy '{policy.name}' triggered: {policy.policy_type}"
                )

        result.passed = result.action in ("pass", "warn")
        return result

    @staticmethod
    def _precedence(action: str) -> int:
        try:
            return PolicyEngine.ACTION_PRECEDENCE.index(action)
        except ValueError:
            return 0


# ---------------------------------------------------------------------------
# Side-effect appliers
# ---------------------------------------------------------------------------

async def apply_policy_verdict(
    result: EvaluationResult,
    ctx: EventContext,
    db_event: Event,
    db: Session,
    ws_manager,
) -> None:
    """
    After evaluation, write violations, trigger alerts, quarantine agents,
    and broadcast WebSocket messages for any triggered policies.
    """
    if not result.triggered_policies:
        return

    # 1. Persist each violation
    for triggered in result.triggered_policies:
        violation = PolicyViolation(
            event_id=db_event.id,
            policy_id=triggered["id"],
            agent_id=ctx.agent_id,
            violation_type=triggered["policy_type"],
            action_taken=triggered["action"],
            details={
                "policy_name": triggered["name"],
                "risk_level": ctx.risk_level,
                "tool_name": ctx.tool_name,
                "block_reason": result.block_reason,
            },
        )
        db.add(violation)
        result.violations.append(violation)

    # 2. Update event policy flags
    db_event.policy_checked = True
    db_event.policy_passed = result.passed

    # 3. Quarantine agent if action is quarantine
    if result.action == "quarantine":
        agent = db.execute(select(Agent).where(Agent.id == ctx.agent_id)).scalars().first()
        if agent and agent.status not in ("revoked", "quarantined"):
            agent.status = "quarantined"
            logger.warning(f"🔒 Agent {ctx.agent_id} AUTO-QUARANTINED by policy engine")

    # 4. Create an Alert for block / quarantine / high-severity violations
    if result.action in ("block", "quarantine") or any(
        t["severity"] in ("critical", "warning") for t in result.triggered_policies
    ):
        alert = Alert(
            agent_id=ctx.agent_id,
            alert_type="policy_violation",
            severity="critical" if result.action == "quarantine" else "high" if result.action == "block" else "medium",
            message=result.block_reason or "Policy violation detected",
            context={
                "event_id": db_event.id,
                "action": result.action,
                "policies": result.triggered_policies,
                "tool_name": ctx.tool_name,
                "risk_level": ctx.risk_level,
            },
            status="open",
        )
        db.add(alert)

    db.commit()

    # 5. Broadcast to WebSocket
    await ws_manager.broadcast({
        "type": "policy_violation",
        "data": {
            "agent_id": ctx.agent_id,
            "action": result.action,
            "passed": result.passed,
            "block_reason": result.block_reason,
            "policies": result.triggered_policies,
            "event_id": db_event.id,
            "tool_name": ctx.tool_name,
            "risk_level": ctx.risk_level,
        }
    })

    level = logging.WARNING if not result.passed else logging.INFO
    logger.log(level, f"Policy verdict for agent {ctx.agent_id}: action={result.action} tool={ctx.tool_name}")


# Singleton
policy_engine = PolicyEngine()
