"""
Compliance Assessment Model — Maps agent operations to regulatory frameworks.
Tracks NIST AI RMF, OWASP Agentic Top 10, and ISO 42001 compliance scores over time.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, Float, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class ComplianceAssessment(Base):
    __tablename__ = "compliance_assessments"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    assessed_by: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False
    )
    framework: Mapped[str] = mapped_column(
        String(30), nullable=False, index=True
    )  # nist_ai_rmf, owasp_agentic, iso_42001
    control_mappings: Mapped[dict] = mapped_column(
        JSON, nullable=False
    )  # Per-control status: {"GOVERN_1": {"status": "compliant", "evidence": "..."}, ...}
    overall_score: Mapped[float] = mapped_column(Float, nullable=False)
    gaps: Mapped[dict] = mapped_column(JSON, nullable=True)
    recommendations: Mapped[dict] = mapped_column(JSON, nullable=True)
    assessed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )

    def __repr__(self):
        return f"<ComplianceAssessment {self.framework} score={self.overall_score}>"
