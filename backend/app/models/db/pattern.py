from sqlalchemy import Column, String, Text, DateTime, Float, JSON, Integer, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.models.base import Base


class PatternReportDB(Base):
    """Database model for pattern discovery reports"""
    __tablename__ = "pattern_reports"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("sessions.id"), nullable=False)
    industry = Column(String, nullable=False)
    country = Column(String, nullable=False)
    companies_analyzed = Column(Integer, nullable=False, default=0)
    analysis_duration = Column(Float, nullable=False, default=0.0)
    patterns = Column(JSON, nullable=False, default=lambda: [])
    total_patterns = Column(Integer, nullable=False, default=0)
    average_confidence = Column(Float, nullable=False, default=0.0)
    high_confidence_patterns = Column(Integer, nullable=False, default=0)
    key_insights = Column(JSON, nullable=False, default=lambda: [])
    recommendations = Column(JSON, nullable=False, default=lambda: [])
    generated_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    session = relationship("SessionDB", back_populates="pattern_reports")
    lead_reports = relationship("LeadReportDB", back_populates="pattern_report")


class SuccessPatternDB(Base):
    """Database model for individual success patterns"""
    __tablename__ = "success_patterns"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    pattern_report_id = Column(String, ForeignKey("pattern_reports.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    confidence = Column(Float, nullable=False)
    frequency = Column(Integer, nullable=False, default=1)
    examples = Column(JSON, nullable=False, default=lambda: [])
    characteristics = Column(JSON, nullable=False, default=lambda: [])
    success_metrics = Column(JSON, nullable=False, default=lambda: {})
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    pattern_report = relationship("PatternReportDB")
