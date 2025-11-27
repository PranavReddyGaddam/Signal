from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class SessionStatus(str, Enum):
    PENDING = "pending"
    INTENT_EXTRACTED = "intent_extracted"
    PATTERN_DISCOVERY = "pattern_discovery"
    PATTERNS_VALIDATED = "patterns_validated"
    LEAD_GENERATION = "lead_generation"
    COMPLETED = "completed"
    FAILED = "failed"


class SessionState(BaseModel):
    """Conversation state management"""
    id: str = Field(..., description="Unique session identifier")
    
    # User input and intent
    user_input: str = Field(..., description="Original user input")
    extracted_intent: Optional[Dict[str, Any]] = Field(None, description="Extracted intent data")
    
    # Workflow state
    status: SessionStatus = Field(default=SessionStatus.PENDING, description="Current workflow status")
    current_step: str = Field(default="intent_extraction", description="Current processing step")
    progress_percentage: float = Field(default=0.0, ge=0, le=100, description="Overall progress")
    
    # Pattern discovery results
    pattern_report_id: Optional[str] = Field(None, description="ID of generated pattern report")
    patterns_confirmed: bool = Field(default=False, description="Whether user confirmed patterns")
    
    # Lead generation results
    lead_report_id: Optional[str] = Field(None, description="ID of generated lead report")
    leads_generated: bool = Field(default=False, description="Whether leads have been generated")
    
    # User confirmations
    user_confirmations: Dict[str, bool] = Field(default_factory=dict, description="User confirmation history")
    
    # Error handling
    errors: List[str] = Field(default_factory=list, description="Accumulated errors")
    retry_count: int = Field(default=0, description="Number of retries attempted")
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = Field(None, description="When session completed")
    
    def update_progress(self, step: str, progress: float):
        """Update current step and progress"""
        self.current_step = step
        self.progress_percentage = progress
    
    def add_error(self, error: str):
        """Add error to session"""
        self.errors.append(error)
        self.updated_at = datetime.utcnow()
    
    def complete_session(self):
        """Mark session as completed"""
        self.status = SessionStatus.COMPLETED
        self.progress_percentage = 100.0
        self.completed_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
