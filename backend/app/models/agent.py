"""
Agent Model — Registered AI agents under Q governance.
Each agent has a unique identity, scoped permissions, and a risk classification.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Agent(Base):
    __tablename__ = "agents"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    owner_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    agent_type: Mapped[str] = mapped_column(
        String(50), default="general"
    )  # research, data_analysis, code_review, general
    framework: Mapped[str] = mapped_column(
        String(50), nullable=True
    )  # langchain, crewai, custom, etc.
    status: Mapped[str] = mapped_column(
        String(20), default="active", index=True
    )  # active, paused, revoked, quarantined
    risk_level: Mapped[str] = mapped_column(
        String(20), default="low"
    )  # low, medium, high, critical
    permissions: Mapped[dict] = mapped_column(
        JSON, default=dict
    )  # {"tools": [...], "data_classifications": [...], "max_actions_per_hour": 100}
    metadata_: Mapped[dict] = mapped_column(
        "metadata", JSON, default=dict
    )  # {"team": "...", "environment": "...", "version": "..."}
    registered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    last_heartbeat: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    owner = relationship("User", back_populates="agents")
    identities = relationship("AgentIdentity", back_populates="agent", lazy="dynamic")
    events = relationship("Event", back_populates="agent", lazy="dynamic")
    alerts = relationship("Alert", back_populates="agent", lazy="dynamic")
    approval_requests = relationship("ApprovalRequest", back_populates="agent", lazy="dynamic")

    def __repr__(self):
        return f"<Agent {self.name} [{self.status}]>"
