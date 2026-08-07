"""
Policy Model — Governance policies that define what agents can and cannot do.
PolicyViolation tracks when an agent breaks a rule.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, Boolean, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Policy(Base):
    __tablename__ = "policies"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    created_by: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    policy_type: Mapped[str] = mapped_column(
        String(30), nullable=False, index=True
    )  # rate_limit, data_access, tool_restriction, hitl_gate, scope_boundary, time_boundary
    conditions: Mapped[dict] = mapped_column(
        JSON, nullable=False
    )  # {"agent_ids": [...], "risk_levels": [...], "tool_names": [...], ...}
    actions: Mapped[dict] = mapped_column(
        JSON, nullable=False
    )  # {"action": "block|warn|require_approval|quarantine", "notify": true, ...}
    severity: Mapped[str] = mapped_column(
        String(20), default="warning"
    )  # info, warning, critical, block
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    created_by_user = relationship("User", back_populates="policies")
    violations = relationship("PolicyViolation", back_populates="policy", lazy="dynamic")

    def __repr__(self):
        return f"<Policy {self.name} [{self.policy_type}]>"


class PolicyViolation(Base):
    __tablename__ = "policy_violations"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    event_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("events.id"), nullable=False, index=True
    )
    policy_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("policies.id"), nullable=False, index=True
    )
    agent_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("agents.id"), nullable=False, index=True
    )
    violation_type: Mapped[str] = mapped_column(String(50), nullable=False)
    action_taken: Mapped[str] = mapped_column(
        String(20), nullable=False
    )  # logged, warned, blocked, quarantined
    details: Mapped[dict] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    event = relationship("Event", back_populates="policy_violations")
    policy = relationship("Policy", back_populates="violations")

    def __repr__(self):
        return f"<PolicyViolation {self.violation_type} → {self.action_taken}>"
