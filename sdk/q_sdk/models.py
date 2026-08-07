"""
Q SDK — Pydantic models for telemetry events sent to the Q backend.
These define the contract between the SDK and the platform.
"""

from pydantic import BaseModel, Field
from typing import Optional, Any, Dict
from datetime import datetime
from enum import Enum


class EventType(str, Enum):
    TOOL_CALL = "tool_call"
    LLM_INVOKE = "llm_invoke"
    DATA_ACCESS = "data_access"
    DECISION = "decision"
    ERROR = "error"
    HEARTBEAT = "heartbeat"


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class TelemetryEvent(BaseModel):
    """A single telemetry event emitted by an instrumented agent."""
    agent_id: Optional[str] = None
    event_type: EventType
    tool_name: Optional[str] = None
    input_data: Optional[Dict[str, Any]] = None
    output_data: Optional[Dict[str, Any]] = None
    risk_level: RiskLevel = RiskLevel.LOW
    latency_ms: Optional[float] = None
    trace_id: Optional[str] = None
    parent_span_id: Optional[str] = None
    error_message: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ApprovalRequestPayload(BaseModel):
    """Sent to Q when an agent hits a HITL gate."""
    agent_id: str
    action_description: str
    reason: str
    context: Dict[str, Any] = {}
    timeout_seconds: int = 300  # 5-minute default


class ApprovalResponse(BaseModel):
    """Received from Q after a human reviews the request."""
    approved: bool
    review_notes: Optional[str] = None
    reviewed_by: Optional[str] = None


class AgentRegistration(BaseModel):
    """Sent to register a new agent with Q."""
    name: str
    description: Optional[str] = None
    agent_type: str = "general"
    framework: Optional[str] = None
    permissions: Dict[str, Any] = {}
    metadata: Dict[str, Any] = {}
