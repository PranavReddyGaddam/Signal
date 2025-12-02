from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List
import uuid
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.lead import LeadData, SignalAnalysis, LeadAnalysisResult, LeadReport
from app.models.pattern import PatternReport
from app.models.db.lead import LeadReportDB
from app.models.base import get_db

router = APIRouter()


@router.post("/generate", response_model=LeadReport)
async def generate_leads(pattern_report: PatternReport, db: Session = Depends(get_db)) -> LeadReport:
    """
    Generate qualified leads based on discovered patterns.
    
    Mock implementation for development - will be replaced with multi-agent system.
    """
    try:
        # Mock lead generation
        mock_report = _mock_lead_generation(pattern_report)
        
        # Create database record
        db_report = LeadReportDB(
            id=mock_report["id"],
            session_id=mock_report["session_id"],
            pattern_report_id=mock_report["pattern_report_id"],
            industry=mock_report["industry"],
            country=mock_report["country"],
            leads_generated=mock_report["leads_generated"],
            analysis_duration=mock_report["analysis_duration"],
            leads=mock_report["leads"],
            high_priority_leads=mock_report["high_priority_leads"],
            medium_priority_leads=mock_report["medium_priority_leads"],
            low_priority_leads=mock_report["low_priority_leads"],
            average_quality_score=mock_report["average_quality_score"],
            pattern_coverage=mock_report["pattern_coverage"],
            key_insights=mock_report["key_insights"],
            market_opportunities=mock_report["market_opportunities"],
            recommended_approach=mock_report["recommended_approach"],
            export_formats=mock_report["export_formats"],
            generated_at=datetime.utcnow()
        )
        
        db.add(db_report)
        db.commit()
        db.refresh(db_report)
        
        report = LeadReport(
            **mock_report,
            generated_at=db_report.generated_at
        )
        
        return report
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lead generation failed: {str(e)}")


@router.get("/{report_id}", response_model=LeadReport)
async def get_lead_report(report_id: str, db: Session = Depends(get_db)) -> LeadReport:
    """
    Get lead report by ID.
    """
    db_report = db.query(LeadReportDB).filter(LeadReportDB.id == report_id).first()
    if not db_report:
        raise HTTPException(status_code=404, detail="Lead report not found")
    
    return LeadReport(
        id=db_report.id,
        session_id=db_report.session_id,
        pattern_report_id=db_report.pattern_report_id,
        industry=db_report.industry,
        country=db_report.country,
        leads_generated=db_report.leads_generated,
        analysis_duration=db_report.analysis_duration,
        leads=db_report.leads,
        high_priority_leads=db_report.high_priority_leads,
        medium_priority_leads=db_report.medium_priority_leads,
        low_priority_leads=db_report.low_priority_leads,
        average_quality_score=db_report.average_quality_score,
        pattern_coverage=db_report.pattern_coverage,
        key_insights=db_report.key_insights,
        market_opportunities=db_report.market_opportunities,
        recommended_approach=db_report.recommended_approach,
        export_formats=db_report.export_formats,
        generated_at=db_report.generated_at
    )


@router.get("/", response_model=List[LeadReport])
async def list_lead_reports(db: Session = Depends(get_db)) -> List[LeadReport]:
    """
    List all lead reports.
    """
    db_reports = db.query(LeadReportDB).all()
    
    return [
        LeadReport(
            id=r.id,
            session_id=r.session_id,
            pattern_report_id=r.pattern_report_id,
            industry=r.industry,
            country=r.country,
            leads_generated=r.leads_generated,
            analysis_duration=r.analysis_duration,
            leads=r.leads,
            high_priority_leads=r.high_priority_leads,
            medium_priority_leads=r.medium_priority_leads,
            low_priority_leads=r.low_priority_leads,
            average_quality_score=r.average_quality_score,
            pattern_coverage=r.pattern_coverage,
            key_insights=r.key_insights,
            market_opportunities=r.market_opportunities,
            recommended_approach=r.recommended_approach,
            export_formats=r.export_formats,
            generated_at=r.generated_at
        )
        for r in db_reports
    ]


def _mock_lead_generation(pattern_report: PatternReport) -> Dict[str, Any]:
    """
    Mock lead generation for development.
    In production, this will use the multi-agent system.
    """
    report_id = str(uuid.uuid4())
    
    # Generate mock leads based on patterns
    leads = _generate_mock_leads(pattern_report)
    
    # Calculate metrics
    high_priority = len([l for l in leads if l.priority == "high"])
    medium_priority = len([l for l in leads if l.priority == "medium"])
    low_priority = len([l for l in leads if l.priority == "low"])
    
    avg_quality = sum(l.quality_score for l in leads) / len(leads)
    
    # Pattern coverage
    pattern_coverage = {}
    for lead in leads:
        for pattern_id in lead.matched_patterns:
            pattern_coverage[pattern_id] = pattern_coverage.get(pattern_id, 0) + 1
    
    return {
        "id": report_id,
        "session_id": pattern_report.session_id,
        "industry": pattern_report.industry,
        "country": pattern_report.country,
        "leads_generated": len(leads),
        "analysis_duration": 67.8,
        "leads": leads,
        "high_priority_leads": high_priority,
        "medium_priority_leads": medium_priority,
        "low_priority_leads": low_priority,
        "average_quality_score": avg_quality,
        "pattern_coverage": pattern_coverage,
        "key_insights": [
            f"High concentration of leads in {pattern_report.country} market",
            "Strong pattern alignment indicates good market fit",
            "Technology-focused leads show higher quality scores"
        ],
        "market_opportunities": [
            "Enterprise segment shows untapped potential",
            "Integration-focused companies have high growth potential",
            "API-first companies indicate modern tech adoption"
        ],
        "recommended_approach": f"Focus on high-priority leads with strong pattern matches in the {pattern_report.industry} sector",
        "export_formats": ["json", "csv", "pdf"]
    }


def _generate_mock_leads(pattern_report: PatternReport) -> List[LeadAnalysisResult]:
    """
    Generate mock leads based on pattern report.
    """
    leads = []
    num_leads = 25  # Target number of leads
    
    # Mock company data
    company_templates = [
        {"name": "TechCorp Solutions", "employee_count": 150, "revenue": 25000000},
        {"name": "DataFlow Systems", "employee_count": 80, "revenue": 12000000},
        {"name": "CloudBridge Inc", "employee_count": 200, "revenue": 45000000},
        {"name": "InnovateTech", "employee_count": 50, "revenue": 8000000},
        {"name": "EnterpriseSoft", "employee_count": 300, "revenue": 65000000},
    ]
    
    for i in range(num_leads):
        template = company_templates[i % len(company_templates)]
        
        # Create lead data
        lead_data = LeadData(
            id=str(uuid.uuid4()),
            name=f"{template['name']} {i+1}",
            industry=pattern_report.industry,
            country=pattern_report.country,
            website=f"https://lead{i+1}.example.com",
            description=f"Leading {pattern_report.industry} company specializing in enterprise solutions",
            founded_year=2015 + (i % 8),
            employee_count=template['employee_count'] + (i * 10),
            revenue=template['revenue'] + (i * 1000000),
            funding=5000000 + (i * 2000000),
            growth_rate=0.15 + (i * 0.02),
            business_model="B2B SaaS",
            target_market="Enterprise",
            key_products=["Platform", "Analytics", "Integration"],
            technologies=["React", "Python", "AWS", "Kubernetes"],
            headquarters=f"City {i%10}, {pattern_report.country}",
            source="mock_data_generator"
        )
        
        # Assign patterns
        pattern_ids = [p.id for p in pattern_report.patterns[:2]]  # Match first 2 patterns
        lead_data.pattern_ids = pattern_ids
        lead_data.pattern_match_scores = {pid: 0.7 + (i * 0.01) for pid in pattern_ids}
        
        # Create signal analysis
        signal_analysis = SignalAnalysis(
            lead_id=lead_data.id,
            market_signals={"market_position": 0.8, "competitiveness": 0.7},
            financial_signals={"revenue_growth": 0.8, "profitability": 0.6},
            technology_signals={"tech_stack": 0.9, "innovation": 0.8},
            growth_signals={"hiring_rate": 0.7, "expansion": 0.8},
            overall_score=0.75 + (i * 0.005),
            confidence=0.8,
            positive_signals=["Strong revenue growth", "Modern tech stack", "Enterprise focus"],
            negative_signals=["Limited market presence", "High competition"],
            signal_strength="strong" if i < 10 else "moderate"
        )
        
        # Determine priority
        quality_score = signal_analysis.overall_score
        if quality_score > 0.8:
            priority = "high"
        elif quality_score > 0.7:
            priority = "medium"
        else:
            priority = "low"
        
        # Create lead analysis result
        lead_analysis = LeadAnalysisResult(
            lead_id=lead_data.id,
            session_id=pattern_report.session_id,
            quality_score=quality_score,
            priority=priority,
            matched_patterns=pattern_ids,
            pattern_scores=lead_data.pattern_match_scores,
            signal_analysis=signal_analysis,
            outreach_recommendations=[
                "Focus on enterprise value proposition",
                "Highlight integration capabilities",
                "Emphasize ROI and efficiency gains"
            ],
            talking_points=[
                "Scalable enterprise architecture",
                "Proven track record in similar companies",
                "Strong technical team and support"
            ],
            risk_factors=["Market competition", "Economic uncertainty"],
            opportunity_factors=["Growing market demand", "Technology trends"]
        )
        
        leads.append(lead_analysis)
    
    return leads
