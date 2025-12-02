"""
Mock services for development - will be replaced with real AI/agent implementations
"""
from typing import Dict, Any
import uuid
from datetime import datetime
from app.models.intent import IntentExtractionResult
from app.core.config import settings

# Import real LLM service if available
try:
    from app.services.llm_service import llm_service
    LLM_AVAILABLE = True
except ImportError:
    LLM_AVAILABLE = False


def mock_intent_extraction(user_input: str, session_id: str = None) -> Dict[str, Any]:
    """
    Intent extraction - uses real LLM if available, otherwise falls back to mock.
    """
    # Use real LLM if enabled and available
    if settings.USE_REAL_LLM and LLM_AVAILABLE and session_id:
        try:
            return llm_service.extract_intent(user_input, session_id)
        except Exception as e:
            # Fall back to mock on error
            print(f"LLM service failed, falling back to mock: {e}")
    
    # Original mock implementation
    user_input_lower = user_input.lower()
    
    # Simple keyword-based extraction for mock
    industry = "SaaS"  # Default
    country = "United States"  # Default
    
    if "fintech" in user_input_lower or "financial" in user_input_lower:
        industry = "FinTech"
    elif "healthtech" in user_input_lower or "healthcare" in user_input_lower:
        industry = "HealthTech"
    elif "ecommerce" in user_input_lower or "e-commerce" in user_input_lower:
        industry = "E-commerce"
    elif "ai" in user_input_lower or "artificial intelligence" in user_input_lower:
        industry = "AI/ML"
    
    if "germany" in user_input_lower:
        country = "Germany"
    elif "uk" in user_input_lower or "united kingdom" in user_input_lower:
        country = "United Kingdom"
    elif "france" in user_input_lower:
        country = "France"
    elif "canada" in user_input_lower:
        country = "Canada"
    
    return {
        "industry": industry,
        "country": country,
        "company_size": None,
        "goal": "lead_generation"
    }


def mock_pattern_discovery(intent: Dict[str, Any], session_id: str = None) -> Dict[str, Any]:
    """
    Pattern discovery - uses real LLM if available, otherwise falls back to mock.
    """
    # Use real LLM if enabled and available
    if settings.USE_REAL_LLM and LLM_AVAILABLE and session_id:
        try:
            return llm_service.discover_patterns(intent, session_id)
        except Exception as e:
            # Fall back to mock on error
            print(f"LLM service failed, falling back to mock: {e}")
    
    # Original mock implementation
    report_id = str(uuid.uuid4())
    
    # Generate mock patterns based on industry
    patterns = generate_mock_patterns(intent.get("industry", "SaaS"))
    
    return {
        "id": report_id,
        "session_id": intent.get("session_id", ""),  # Use actual session ID
        "industry": intent.get("industry", "SaaS"),
        "country": intent.get("country", "United States"),
        "companies_analyzed": 12,
        "analysis_duration": 45.2,
        "patterns": patterns,
        "total_patterns": len(patterns),
        "average_confidence": sum(p["confidence"] for p in patterns) / len(patterns),
        "high_confidence_patterns": len([p for p in patterns if p["confidence"] >= 0.7]),
        "key_insights": [
            f"Top {intent.get('industry', 'SaaS')} companies show strong product-led growth patterns",
            "Enterprise customers prefer annual contracts with volume discounts",
            "Free trial conversion rates average 15-20% in this market"
        ],
        "recommendations": [
            "Focus on product-led growth strategies",
            "Implement tiered pricing with enterprise options",
            "Optimize free trial to paid conversion funnel"
        ],
        "generated_at": datetime.utcnow().isoformat(),
        "model_version": "1.0"
    }


def mock_lead_generation(pattern_report: Dict[str, Any], session_id: str = None) -> Dict[str, Any]:
    """
    Lead generation - uses real LLM if available, otherwise falls back to mock.
    """
    # Use real LLM if enabled and available
    if settings.USE_REAL_LLM and LLM_AVAILABLE and session_id:
        try:
            return llm_service.generate_leads(pattern_report, session_id)
        except Exception as e:
            # Fall back to mock on error
            print(f"LLM service failed, falling back to mock: {e}")
    
    # Original mock implementation
    report_id = str(uuid.uuid4())
    
    # Generate mock leads based on patterns
    raw_leads = generate_mock_leads(
        pattern_report.get("industry", "SaaS"),
        pattern_report.get("country", "United States"),
        pattern_report.get("patterns", [])
    )
    
    # Convert raw leads to LeadAnalysisResult structure
    leads = []
    high_priority_count = 0
    medium_priority_count = 0
    low_priority_count = 0
    total_quality = 0.0
    
    for raw_lead in raw_leads:
        priority = raw_lead.get("priority", "medium")
        quality_score = raw_lead.get("quality_score", 0.5)
        
        # Count priorities
        if priority == "high":
            high_priority_count += 1
        elif priority == "medium":
            medium_priority_count += 1
        else:
            low_priority_count += 1
        
        total_quality += quality_score
        
        # Create LeadAnalysisResult
        lead_analysis = {
            "lead_id": raw_lead["id"],
            "session_id": pattern_report.get("session_id", ""),
            "quality_score": quality_score,
            "priority": priority,
            "matched_patterns": raw_lead.get("matched_patterns", []),
            "pattern_scores": {pattern: 0.8 for pattern in raw_lead.get("matched_patterns", [])},
            "signal_analysis": {
                "lead_id": raw_lead["id"],
                "market_signals": {"growth_potential": 0.8, "market_fit": 0.7},
                "financial_signals": {"revenue_stability": 0.6, "funding_health": 0.9},
                "technology_signals": {"tech_stack": 0.8, "innovation": 0.7},
                "growth_signals": {"hiring_rate": 0.9, "expansion": 0.8},
                "overall_score": quality_score,
                "confidence": 0.85,
                "positive_signals": ["Strong hiring growth", "Recent funding", "Tech innovation"],
                "negative_signals": ["High competition", "Market saturation"],
                "missing_signals": ["Customer churn data", "Profit margins"],
                "signal_strength": "strong" if priority == "high" else "moderate",
                "signal_timestamp": datetime.utcnow().isoformat()
            },
            "outreach_recommendations": [
                "Focus on technical value proposition",
                "Highlight recent product innovations",
                "Emphasize scalability benefits"
            ],
            "talking_points": [
                "How our solution integrates with your current tech stack",
                "ROI from similar companies in your space",
                "Case studies from your industry"
            ],
            "risk_factors": ["Competitive pressure", "Economic uncertainty"],
            "opportunity_factors": ["Market growth", "Technology adoption"],
            "analyzed_at": datetime.utcnow().isoformat(),
            "model_version": "1.0"
        }
        leads.append(lead_analysis)
    
    # Calculate metrics
    average_quality = total_quality / len(leads) if leads else 0.0
    pattern_coverage = {
        pattern.get("name", "unknown"): len([l for l in leads if pattern.get("name") in l.get("matched_patterns", [])])
        for pattern in pattern_report.get("patterns", [])
    }
    
    return {
        "id": report_id,
        "session_id": pattern_report.get("session_id", ""),
        "pattern_report_id": pattern_report.get("id", ""),
        "industry": pattern_report.get("industry", "SaaS"),
        "country": pattern_report.get("country", "United States"),
        "leads_generated": len(leads),
        "analysis_duration": 32.8,
        "leads": leads,
        "high_priority_leads": high_priority_count,
        "medium_priority_leads": medium_priority_count,
        "low_priority_leads": low_priority_count,
        "average_quality_score": average_quality,
        "pattern_coverage": pattern_coverage,
        "key_insights": [
            "High-priority leads show strong product-market fit indicators",
            "Mid-market segment offers best conversion potential",
            "Technical decision makers are primary contact points"
        ],
        "market_opportunities": [
            "Enterprise segment showing increased demand",
            "Growing adoption of cloud-based solutions",
            "Expansion opportunities in European markets"
        ],
        "recommended_approach": "Focus on high-value enterprise accounts with strong technical teams",
        "export_formats": ["csv", "json", "xlsx"],
        "generated_at": datetime.utcnow().isoformat(),
        "model_version": "1.0"
    }


def generate_mock_patterns(industry: str) -> list:
    """Generate mock success patterns based on industry"""
    base_patterns = [
        {
            "id": str(uuid.uuid4()),
            "name": "Product-Led Growth Strategy",
            "description": "Companies using freemium models with strong product experience",
            "confidence": 0.85,
            "frequency": 8,
            "total_companies": 12,
            "category": "business_model",
            "subcategory": "growth_strategy",
            "key_attributes": [
                "Strong free trial conversion",
                "Self-service onboarding",
                "Viral growth mechanisms"
            ],
            "success_metrics": {
                "conversion_rate": 0.18,
                "time_to_value": 25.0,
                "expansion_rate": 0.25
            },
            "implementation_complexity": "medium",
            "source_companies": ["Company A", "Company B", "Company C"],
            "discovered_at": datetime.utcnow().isoformat(),
            "model_version": "1.0"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Enterprise Sales Focus",
            "description": "B2B companies with enterprise customer acquisition",
            "confidence": 0.78,
            "frequency": 6,
            "total_companies": 10,
            "category": "sales_strategy",
            "subcategory": "enterprise",
            "key_attributes": [
                "Direct sales team",
                "Long sales cycles",
                "High contract values"
            ],
            "success_metrics": {
                "average_deal_size": 150000.0,
                "sales_cycle_months": 9.0,
                "customer_lifetime_years": 7.0
            },
            "implementation_complexity": "high",
            "source_companies": ["Company D", "Company E"],
            "discovered_at": datetime.utcnow().isoformat(),
            "model_version": "1.0"
        }
    ]
    
    # Add industry-specific patterns
    if industry == "FinTech":
        base_patterns.append({
            "id": str(uuid.uuid4()),
            "name": "Regulatory Compliance First",
            "description": "FinTech companies prioritizing compliance and security",
            "confidence": 0.92,
            "frequency": 10,
            "total_companies": 15,
            "category": "compliance",
            "subcategory": "regulatory",
            "key_attributes": [
                "Strong compliance framework",
                "Security-first approach",
                "Regulatory partnerships"
            ],
            "success_metrics": {
                "compliance_score": 0.98,
                "security_incidents": 0.1,
                "regulatory_approval_time": 180.0
            },
            "implementation_complexity": "high",
            "source_companies": ["FinTech Co A", "FinTech Co B"],
            "discovered_at": datetime.utcnow().isoformat(),
            "model_version": "1.0"
        })
    elif industry == "HealthTech":
        base_patterns.append({
            "id": str(uuid.uuid4()),
            "name": "Clinical Workflow Integration",
            "description": "HealthTech companies integrating with clinical workflows",
            "confidence": 0.88,
            "frequency": 7,
            "total_companies": 11,
            "category": "integration",
            "subcategory": "clinical",
            "key_attributes": [
                "HIPAA compliance",
                "EHR integrations",
                "Clinical validation"
            ],
            "success_metrics": {
                "adoption_rate": 0.75,
                "integration_time_days": 85.0,
                "clinical_outcome_improvement": 0.22
            },
            "implementation_complexity": "high",
            "source_companies": ["HealthTech Co A", "HealthTech Co B"],
            "discovered_at": datetime.utcnow().isoformat(),
            "model_version": "1.0"
        })
    
    return base_patterns


def generate_mock_leads(industry: str, country: str, patterns: list) -> list:
    """Generate mock leads based on patterns and market"""
    companies = {
        "SaaS": ["TechCorp Solutions", "CloudFlow Systems", "DataSync Inc", "PlatformPro", "SaaSphere"],
        "FinTech": ["PaySecure", "BankTech Innovations", "FinanceFlow", "CryptoSafe", "InvestPro"],
        "HealthTech": ["MedTech Solutions", "HealthSync", "CarePlatform", "BioTech Systems", "MedicalAI"],
        "E-commerce": ["ShopFlow", "RetailTech", "CommercePro", "MarketSync", "SalesPlatform"],
        "AI/ML": ["AIBrain", "MachineLogic", "NeuralTech", "DataScience Pro", "SmartSystems"]
    }
    
    locations = {
        "United States": ["San Francisco, CA", "New York, NY", "Austin, TX", "Boston, MA", "Seattle, WA"],
        "Germany": ["Berlin", "Munich", "Hamburg", "Frankfurt", "Stuttgart"],
        "United Kingdom": ["London", "Manchester", "Edinburgh", "Bristol", "Birmingham"],
        "France": ["Paris", "Lyon", "Marseille", "Toulouse", "Nice"],
        "Canada": ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa"]
    }
    
    industry_companies = companies.get(industry, companies["SaaS"])
    country_locations = locations.get(country, locations["United States"])
    
    leads = []
    for i, company in enumerate(industry_companies[:5]):  # Generate 5 leads
        priority = "high" if i < 2 else "medium" if i < 4 else "low"
        quality_score = 0.85 if priority == "high" else 0.65 if priority == "medium" else 0.45
        
        lead = {
            "id": str(uuid.uuid4()),
            "company_name": company,
            "description": f"Leading {industry} company specializing in innovative solutions",
            "website": f"https://www.{company.lower().replace(' ', '')}.com",
            "industry": industry,
            "size": "Enterprise" if priority == "high" else "Mid-Market" if priority == "medium" else "Small",
            "location": country_locations[i % len(country_locations)],
            "priority": priority,
            "quality_score": quality_score,
            "matched_patterns": [p["name"] for p in patterns[:2]],  # Match first 2 patterns
            "signals": [
                {
                    "type": "hiring_growth",
                    "source": "LinkedIn",
                    "confidence": 0.8,
                    "description": "Increasing engineering team size"
                },
                {
                    "type": "funding_round",
                    "source": "Crunchbase",
                    "confidence": 0.9,
                    "description": "Recent Series B funding completed"
                }
            ],
            "contact_info": {
                "decision_makers": [
                    {"name": "John Smith", "title": "CTO", "email": "john.smith@" + company.lower().replace(' ', '') + ".com"},
                    {"name": "Jane Doe", "title": "VP Engineering", "email": "jane.doe@" + company.lower().replace(' ', '') + ".com"}
                ]
            }
        }
        leads.append(lead)
    
    return leads
