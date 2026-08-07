"""
Approval Request Model — Human-in-the-Loop (HITL) approval workflow.
When an agent attempts a high-risk action, execution pauses until a human approves or denies.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class ApprovalRequest(Base):
    __tablename__ = "approval_requests"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    agent_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("agents.id"), nullable=False, index=True
    )
    event_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("events.id"), nullable=True
    )
    action_description: Mapped[str] = mapped_column(String(500), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=True)
    context: Mapped[dict] = mapped_column(
        JSON, nullable=True
    )  # Full context: tool name, args, agent state, risk assessment
    status: Mapped[str] = mapped_column(
        String(20), default="pending", index=True
    )  # pending, approved, denied, expired
    reviewed_by: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=True
    )
    review_notes: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    reviewed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    agent = relationship("Agent", back_populates="approval_requests")

    def __repr__(self):
        return f"<ApprovalRequest {self.action_description[:40]} [{self.status}]>"
