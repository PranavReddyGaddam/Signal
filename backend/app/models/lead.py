from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class LeadData(BaseModel):
    """Potential lead information"""
    id: str = Field(..., description="Unique lead identifier")
    name: str = Field(..., description="Lead company name")
    industry: str = Field(..., description="Industry sector")
    country: str = Field(..., description="Country of operation")
    website: Optional[str] = Field(None, description="Company website")
    description: Optional[str] = Field(None, description="Company description")
    
    # Company metrics
    founded_year: Optional[int] = Field(None, description="Year founded")
    employee_count: Optional[int] = Field(None, description="Number of employees")
    revenue: Optional[float] = Field(None, description="Annual revenue in USD")
    funding: Optional[float] = Field(None, description="Total funding in USD")
    growth_rate: Optional[float] = Field(None, description="Revenue growth rate")
    
    # Business information
    business_model: Optional[str] = Field(None, description="Business model")
    target_market: Optional[str] = Field(None, description="Target market segment")
    key_products: Optional[List[str]] = Field(None, description="Key products or services")
    technologies: Optional[List[str]] = Field(None, description="Technologies used")
    
    # Contact information
    headquarters: Optional[str] = Field(None, description="Headquarters location")
    contacts: Optional[List[Dict[str, Any]]] = Field(None, description="Key contacts")
    
    # Pattern matching
    pattern_ids: List[str] = Field(default_factory=list, description="Success patterns this lead matches")
    pattern_match_scores: Dict[str, float] = Field(default_factory=dict, description="Pattern match confidence scores")
    
    # Metadata
    source: str = Field(..., description="Data source")
    discovered_at: datetime = Field(default_factory=datetime.utcnow)
    raw_data: Optional[Dict[str, Any]] = Field(None, description="Original raw data")


class SignalAnalysis(BaseModel):
    """Lead quality signals analysis"""
    lead_id: str = Field(..., description="Lead identifier")
    
    # Signal categories
    market_signals: Dict[str, float] = Field(default_factory=dict, description="Market position signals")
    financial_signals: Dict[str, float] = Field(default_factory=dict, description="Financial health signals")
    technology_signals: Dict[str, float] = Field(default_factory=dict, description="Technology stack signals")
    growth_signals: Dict[str, float] = Field(default_factory=dict, description="Growth trajectory signals")
    
    # Overall assessment
    overall_score: float = Field(..., ge=0, le=1, description="Overall lead quality score")
    confidence: float = Field(..., ge=0, le=1, description="Analysis confidence")
    
    # Signal details
    positive_signals: List[str] = Field(default_factory=list, description="Positive indicators")
    negative_signals: List[str] = Field(default_factory=list, description="Negative indicators")
    missing_signals: List[str] = Field(default_factory=list, description="Missing data for analysis")
    
    # Timing
    signal_strength: str = Field(..., description="Signal strength (strong, moderate, weak)")
    signal_timestamp: datetime = Field(default_factory=datetime.utcnow, description="When signals were analyzed")


class LeadAnalysisResult(BaseModel):
    """Complete lead assessment"""
    model_config = {"protected_namespaces": ()}
    
    lead_id: str = Field(..., description="Lead identifier")
    session_id: str = Field(..., description="Analysis session ID")
    
    # Quality assessment
    quality_score: float = Field(..., ge=0, le=1, description="Overall lead quality score")
    priority: str = Field(..., description="Priority level (high, medium, low)")
    
    # Pattern matching
    matched_patterns: List[str] = Field(default_factory=list, description="Success patterns matched")
    pattern_scores: Dict[str, float] = Field(default_factory=dict, description="Pattern match scores")
    
    # Signal analysis
    signal_analysis: SignalAnalysis = Field(..., description="Detailed signal analysis")
    
    # Recommendations
    outreach_recommendations: List[str] = Field(default_factory=list, description="Suggested outreach strategies")
    talking_points: List[str] = Field(default_factory=list, description="Key talking points for outreach")
    
    # Risk assessment
    risk_factors: List[str] = Field(default_factory=list, description="Potential risk factors")
    opportunity_factors: List[str] = Field(default_factory=list, description="Key opportunity factors")
    
    # Metadata
    analyzed_at: datetime = Field(default_factory=datetime.utcnow)
    model_version: str = Field(default="1.0", description="AI model version used")


class LeadReport(BaseModel):
    """Final lead generation report"""
    model_config = {"protected_namespaces": ()}
    
    id: str = Field(..., description="Unique report identifier")
    session_id: str = Field(..., description="Analysis session ID")
    
    # Report parameters
    industry: str = Field(..., description="Target industry")
    country: str = Field(..., description="Target country")
    leads_generated: int = Field(..., description="Total leads generated")
    analysis_duration: float = Field(..., description="Analysis duration in seconds")
    
    # Lead breakdown
    leads: List[LeadAnalysisResult] = Field(default_factory=list, description="All analyzed leads")
    high_priority_leads: int = Field(default=0, description="Number of high-priority leads")
    medium_priority_leads: int = Field(default=0, description="Number of medium-priority leads")
    low_priority_leads: int = Field(default=0, description="Number of low-priority leads")
    
    # Quality metrics
    average_quality_score: float = Field(..., ge=0, le=1, description="Average quality across all leads")
    pattern_coverage: Dict[str, int] = Field(default_factory=dict, description="How many leads match each pattern")
    
    # Insights
    key_insights: List[str] = Field(default_factory=list, description="Key insights from lead analysis")
    market_opportunities: List[str] = Field(default_factory=list, description="Identified market opportunities")
    recommended_approach: str = Field(..., description="Recommended market approach")
    
    # Export data
    export_formats: List[str] = Field(default_factory=list, description="Available export formats")
    
    # Metadata
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    model_version: str = Field(default="1.0", description="AI model version used")
