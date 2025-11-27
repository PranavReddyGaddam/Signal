from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class IntentExtractionResult(BaseModel):
    """Result of intent extraction from user input"""
    industry: str = Field(..., description="Target industry (e.g., SaaS, FinTech)")
    country: str = Field(..., description="Target country or region")
    company_size: Optional[str] = Field(None, description="Target company size (e.g., startup, enterprise)")
    goal: str = Field(..., description="User's goal (e.g., lead generation, market analysis)")
    confidence: float = Field(..., ge=0, le=1, description="Confidence score of intent extraction")
    raw_input: str = Field(..., description="Original user input")
    extracted_at: datetime = Field(default_factory=datetime.utcnow)
