from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class SuccessPattern(BaseModel):
    """Identified success pattern from company analysis"""
    model_config = {"protected_namespaces": ()}
    
    id: str = Field(..., description="Unique pattern identifier")
    name: str = Field(..., description="Pattern name")
    description: str = Field(..., description="Detailed pattern description")
    confidence: float = Field(..., ge=0, le=1, description="Confidence score")
    frequency: int = Field(..., description="Number of companies with this pattern")
    total_companies: int = Field(..., description="Total companies analyzed")
    
    # Pattern categorization
    category: str = Field(..., description="Pattern category (e.g., technology, business_model)")
    subcategory: Optional[str] = Field(None, description="Pattern subcategory")
    
    # Pattern details
    key_attributes: List[str] = Field(default_factory=list, description="Key attributes of this pattern")
    success_metrics: Dict[str, float] = Field(default_factory=dict, description="Associated success metrics")
    implementation_complexity: Optional[str] = Field(None, description="Implementation difficulty")
    
    # Source companies
    source_companies: List[str] = Field(default_factory=list, description="Companies exhibiting this pattern")
    
    # Metadata
    discovered_at: datetime = Field(default_factory=datetime.utcnow)
    model_version: str = Field(default="1.0", description="AI model version used")


class PatternReport(BaseModel):
    """Complete pattern analysis report"""
    model_config = {"protected_namespaces": ()}
    
    id: str = Field(..., description="Unique report identifier")
    session_id: str = Field(..., description="Analysis session ID")
    
    # Analysis parameters
    industry: str = Field(..., description="Industry analyzed")
    country: str = Field(..., description="Country/region analyzed")
    companies_analyzed: int = Field(..., description="Number of companies analyzed")
    analysis_duration: float = Field(..., description="Analysis duration in seconds")
    
    # Results
    patterns: List[SuccessPattern] = Field(default_factory=list, description="Discovered success patterns")
    total_patterns: int = Field(default=0, description="Total number of patterns found")
    
    # Quality metrics
    average_confidence: float = Field(..., ge=0, le=1, description="Average confidence across all patterns")
    high_confidence_patterns: int = Field(default=0, description="Patterns with confidence > 0.8")
    
    # Insights
    key_insights: List[str] = Field(default_factory=list, description="Key business insights")
    recommendations: List[str] = Field(default_factory=list, description="Actionable recommendations")
    
    # Metadata
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    model_version: str = Field(default="1.0", description="AI model version used")
