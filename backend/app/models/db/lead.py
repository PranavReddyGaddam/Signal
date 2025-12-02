from sqlalchemy import Column, String, Text, DateTime, Float, JSON, Integer, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.models.base import Base


class LeadReportDB(Base):
    """Database model for lead generation reports"""
    __tablename__ = "lead_reports"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("sessions.id"), nullable=False)
    pattern_report_id = Column(String, ForeignKey("pattern_reports.id"), nullable=False)
    industry = Column(String, nullable=False)
    country = Column(String, nullable=False)
    leads_generated = Column(Integer, nullable=False, default=0)
    analysis_duration = Column(Float, nullable=False, default=0.0)
    leads = Column(JSON, nullable=False, default=lambda: [])
    high_priority_leads = Column(Integer, nullable=False, default=0)
    medium_priority_leads = Column(Integer, nullable=False, default=0)
    low_priority_leads = Column(Integer, nullable=False, default=0)
    average_quality_score = Column(Float, nullable=False, default=0.0)
    pattern_coverage = Column(JSON, nullable=False, default=lambda: {})
    key_insights = Column(JSON, nullable=False, default=lambda: [])
    market_opportunities = Column(JSON, nullable=False, default=lambda: [])
    recommended_approach = Column(Text, nullable=True)
    export_formats = Column(JSON, nullable=False, default=lambda: [])
    generated_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    session = relationship("SessionDB", back_populates="lead_reports")
    pattern_report = relationship("PatternReportDB", back_populates="lead_reports")


class LeadDataDB(Base):
    """Database model for individual lead data"""
    __tablename__ = "lead_data"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    lead_report_id = Column(String, ForeignKey("lead_reports.id"), nullable=False)
    company_name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    website = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    size = Column(String, nullable=True)
    location = Column(String, nullable=False)
    priority = Column(String, nullable=False)
    quality_score = Column(Float, nullable=False)
    matched_patterns = Column(JSON, nullable=False, default=lambda: [])
    signals = Column(JSON, nullable=False, default=lambda: [])
    contact_info = Column(JSON, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    lead_report = relationship("LeadReportDB")


class SignalAnalysisDB(Base):
    """Database model for signal analysis data"""
    __tablename__ = "signal_analysis"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    lead_data_id = Column(String, ForeignKey("lead_data.id"), nullable=False)
    signal_type = Column(String, nullable=False)
    source = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    confidence = Column(Float, nullable=False)
    relevance_score = Column(Float, nullable=False)
    signal_metadata = Column(JSON, nullable=True)
    discovered_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    lead_data = relationship("LeadDataDB")
