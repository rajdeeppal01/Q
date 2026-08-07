"""
Event Model — Telemetry events emitted by instrumented AI agents.
Every tool call, LLM invocation, data access, and decision is captured here.
This is the immutable audit trail.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, Float, Boolean, JSON, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Event(Base):
    __tablename__ = "events"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    agent_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("agents.id"), nullable=False, index=True
    )
    event_type: Mapped[str] = mapped_column(
        String(30), nullable=False, index=True
    )  # tool_call, llm_invoke, data_access, decision, error, heartbeat
    tool_name: Mapped[str] = mapped_column(String(100), nullable=True, index=True)
    input_data: Mapped[dict] = mapped_column(JSON, nullable=True)
    output_data: Mapped[dict] = mapped_column(JSON, nullable=True)
    risk_level: Mapped[str] = mapped_column(
        String(20), default="low"
    )  # low, medium, high, critical
    latency_ms: Mapped[float] = mapped_column(Float, nullable=True)
    trace_id: Mapped[str] = mapped_column(
        String(36), nullable=True, index=True
    )  # Links related events in a single agent run
    parent_span_id: Mapped[str] = mapped_column(
        String(36), nullable=True
    )  # For nested tool calls / sub-agent spawning
    policy_checked: Mapped[bool] = mapped_column(Boolean, default=False)
    policy_passed: Mapped[bool] = mapped_column(Boolean, nullable=True)
    error_message: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )

    # Relationships
    agent = relationship("Agent", back_populates="events")
    policy_violations = relationship("PolicyViolation", back_populates="event", lazy="dynamic")

    # Composite indexes for common queries
    __table_args__ = (
        Index("ix_events_agent_created", "agent_id", "created_at"),
        Index("ix_events_type_created", "event_type", "created_at"),
    )

    def __repr__(self):
        return f"<Event {self.event_type}: {self.tool_name or 'N/A'} [{self.risk_level}]>"
