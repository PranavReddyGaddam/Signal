from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
import uuid
from datetime import datetime

from app.models.pattern import SuccessPattern, PatternReport
from app.models.intent import IntentExtractionResult

router = APIRouter()

# In-memory storage for development
pattern_reports: Dict[str, PatternReport] = {}


@router.post("/discover", response_model=PatternReport)
async def discover_patterns(intent: IntentExtractionResult) -> PatternReport:
    """
    Discover success patterns based on extracted intent.
    
    Mock implementation for development - will be replaced with multi-agent system.
    """
    try:
        # Mock pattern discovery
        mock_report = _mock_pattern_discovery(intent)
        
        report = PatternReport(
            **mock_report,
            generated_at=datetime.utcnow()
        )
        
        pattern_reports[report.id] = report
        return report
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pattern discovery failed: {str(e)}")


@router.get("/{report_id}", response_model=PatternReport)
async def get_pattern_report(report_id: str) -> PatternReport:
    """
    Get pattern report by ID.
    """
    if report_id not in pattern_reports:
        raise HTTPException(status_code=404, detail="Pattern report not found")
    
    return pattern_reports[report_id]


@router.get("/", response_model=List[PatternReport])
async def list_pattern_reports() -> List[PatternReport]:
    """
    List all pattern reports.
    """
    return list(pattern_reports.values())


def _mock_pattern_discovery(intent: IntentExtractionResult) -> Dict[str, Any]:
    """
    Mock pattern discovery for development.
    In production, this will use the multi-agent system.
    """
    report_id = str(uuid.uuid4())
    
    # Generate mock patterns based on industry
    patterns = _generate_mock_patterns(intent.industry)
    
    return {
        "id": report_id,
        "session_id": str(uuid.uuid4()),  # Would be actual session ID
        "industry": intent.industry,
        "country": intent.country,
        "companies_analyzed": 12,
        "analysis_duration": 45.2,
        "patterns": patterns,
        "total_patterns": len(patterns),
        "average_confidence": sum(p.confidence for p in patterns) / len(patterns),
        "high_confidence_patterns": len([p for p in patterns if p.confidence > 0.8]),
        "key_insights": [
            f"Cloud-native architecture is dominant in {intent.industry}",
            "API-first approach correlates with higher success rates",
            "Strong focus on enterprise integration patterns"
        ],
        "recommendations": [
            "Prioritize leads with modern tech stacks",
            "Focus on companies with clear product-market fit",
            "Look for strong engineering teams"
        ]
    }


def _generate_mock_patterns(industry: str) -> List[SuccessPattern]:
    """
    Generate mock success patterns based on industry.
    """
    base_patterns = [
        {
            "name": "Cloud-Native Architecture",
            "description": "Companies built with cloud-first principles using microservices and containerization",
            "category": "technology",
            "confidence": 0.85,
            "frequency": 10,
            "key_attributes": ["Kubernetes", "Microservices", "API-first", "Scalable infrastructure"]
        },
        {
            "name": "Enterprise Sales Focus",
            "description": "B2B companies with dedicated enterprise sales teams and high-touch customer success",
            "category": "business_model",
            "confidence": 0.78,
            "frequency": 8,
            "key_attributes": ["Enterprise sales team", "Customer success", "High ACV", "Long sales cycles"]
        },
        {
            "name": "Product-Led Growth",
            "description": "Companies that drive growth through product experience and viral loops",
            "category": "growth_strategy",
            "confidence": 0.72,
            "frequency": 6,
            "key_attributes": ["Free tier", "Self-service", "Viral loops", "Product analytics"]
        }
    ]
    
    # Industry-specific patterns
    if industry == "SaaS":
        base_patterns.append({
            "name": "Recurring Revenue Model",
            "description": "Subscription-based business model with predictable revenue streams",
            "category": "business_model",
            "confidence": 0.92,
            "frequency": 11,
            "key_attributes": ["MRR/ARR", "Churn management", "Expansion revenue", "Annual billing"]
        })
    elif industry == "FinTech":
        base_patterns.append({
            "name": "Regulatory Compliance First",
            "description": "Strong focus on compliance and security from day one",
            "category": "compliance",
            "confidence": 0.88,
            "frequency": 9,
            "key_attributes": ["SOC 2", "GDPR", "AML/KYC", "Security audits"]
        })
    
    patterns = []
    for i, pattern_data in enumerate(base_patterns):
        pattern = SuccessPattern(
            id=str(uuid.uuid4()),
            source_companies=[f"Company_{j}" for j in range(pattern_data["frequency"])],
            total_companies=12,
            success_metrics={"revenue_growth": 0.3 + (i * 0.1), "market_share": 0.15 + (i * 0.05)},
            implementation_complexity="medium" if i % 2 == 0 else "high",
            **pattern_data
        )
        patterns.append(pattern)
    
    return patterns
