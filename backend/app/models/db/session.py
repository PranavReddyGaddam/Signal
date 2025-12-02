from sqlalchemy import Column, String, Text, DateTime, Float, JSON, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.models.base import Base


class SessionDB(Base):
    """Database model for analysis sessions"""
    __tablename__ = "sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_input = Column(Text, nullable=False)
    status = Column(String, nullable=False, default="pending")
    current_step = Column(String, nullable=False, default="intent_extraction")
    progress_percentage = Column(Float, nullable=False, default=0.0)
    extracted_intent = Column(JSON, nullable=True)
    pattern_report_id = Column(String, nullable=True)
    patterns_confirmed = Column(Boolean, nullable=False, default=False)
    lead_report_id = Column(String, nullable=True)
    leads_generated = Column(Boolean, nullable=False, default=False)
    user_confirmations = Column(JSON, nullable=False, default=lambda: {})
    errors = Column(JSON, nullable=False, default=lambda: [])
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    pattern_reports = relationship("PatternReportDB", back_populates="session", cascade="all, delete-orphan")
    lead_reports = relationship("LeadReportDB", back_populates="session", cascade="all, delete-orphan")

    def complete_session(self):
        """Mark session as completed"""
        self.status = "completed"
        self.current_step = "completed"
        self.progress_percentage = 100.0
        self.completed_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

    def add_error(self, error_message: str):
        """Add error to session"""
        self.errors.append({
            "message": error_message,
            "timestamp": datetime.utcnow().isoformat()
        })
        self.updated_at = datetime.utcnow()
