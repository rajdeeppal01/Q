"""
Agent Identity Model — Non-human IAM credentials for AI agents.
Each agent can have multiple API keys with scoped permissions and rotation policies.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class AgentIdentity(Base):
    __tablename__ = "agent_identities"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    agent_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("agents.id"), nullable=False, index=True
    )
    api_key_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    api_key_prefix: Mapped[str] = mapped_column(
        String(12), nullable=False
    )  # "q_sk_xxxx" — first 12 chars for identification
    scopes: Mapped[dict] = mapped_column(
        JSON, default=dict
    )  # {"tools": ["search_web", "query_db"], "data": ["public", "internal"]}
    issued_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    rotated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)

    # Relationships
    agent = relationship("Agent", back_populates="identities")

    def __repr__(self):
        return f"<AgentIdentity {self.api_key_prefix}... [{'' if self.is_active else 'in'}active]>"
