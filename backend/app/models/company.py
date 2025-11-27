from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class CompanyData(BaseModel):
    """Standardized company information"""
    id: str = Field(..., description="Unique company identifier")
    name: str = Field(..., description="Company name")
    industry: str = Field(..., description="Industry sector")
    country: str = Field(..., description="Country of operation")
    website: Optional[str] = Field(None, description="Company website")
    description: Optional[str] = Field(None, description="Company description")
    founded_year: Optional[int] = Field(None, description="Year founded")
    employee_count: Optional[int] = Field(None, description="Number of employees")
    revenue: Optional[float] = Field(None, description="Annual revenue in USD")
    funding: Optional[float] = Field(None, description="Total funding in USD")
    business_model: Optional[str] = Field(None, description="Business model (e.g., B2B SaaS)")
    target_market: Optional[str] = Field(None, description="Target market segment")
    key_products: Optional[List[str]] = Field(None, description="Key products or services")
    technologies: Optional[List[str]] = Field(None, description="Technologies used")
    source: str = Field(..., description="Data source (e.g., Crunchbase, LinkedIn)")
    raw_data: Optional[Dict[str, Any]] = Field(None, description="Original raw data")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ValidationResult(BaseModel):
    """Company validation assessment"""
    company_id: str = Field(..., description="Company identifier")
    is_valid: bool = Field(..., description="Whether company meets criteria")
    confidence_score: float = Field(..., ge=0, le=1, description="Validation confidence")
    validation_reasons: List[str] = Field(default_factory=list, description="Reasons for validation decision")
    success_indicators: List[str] = Field(default_factory=list, description="Success indicators found")
    missing_data: List[str] = Field(default_factory=list, description="Missing critical data")
    analyzed_at: datetime = Field(default_factory=datetime.utcnow)
