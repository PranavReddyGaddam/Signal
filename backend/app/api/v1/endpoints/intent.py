from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import uuid
from datetime import datetime

from app.models.intent import IntentExtractionResult

router = APIRouter()


@router.post("/extract", response_model=IntentExtractionResult)
async def extract_intent(user_input: str) -> IntentExtractionResult:
    """
    Extract structured intent from natural language user input.
    
    Mock implementation for development - will be replaced with AI agent.
    """
    try:
        # Mock intent extraction logic
        mock_intent = _mock_intent_extraction(user_input)
        
        return IntentExtractionResult(
            **mock_intent,
            raw_input=user_input,
            confidence=0.85,
            extracted_at=datetime.utcnow()
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Intent extraction failed: {str(e)}")


def _mock_intent_extraction(user_input: str) -> Dict[str, Any]:
    """
    Mock intent extraction for development.
    In production, this will use Google Generative AI.
    """
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


@router.get("/examples")
async def get_intent_examples() -> Dict[str, Any]:
    """
    Get examples of supported intent patterns.
    """
    return {
        "examples": [
            "Find SaaS companies in Germany",
            "Looking for FinTech startups in the UK",
            "HealthTech companies in the United States",
            "E-commerce businesses in France",
            "AI companies in Canada for lead generation"
        ],
        "supported_industries": [
            "SaaS", "FinTech", "HealthTech", "E-commerce", "AI/ML", "EdTech", "Cybersecurity"
        ],
        "supported_countries": [
            "United States", "Germany", "United Kingdom", "France", "Canada", "Netherlands", "Sweden"
        ],
        "supported_goals": [
            "lead_generation", "market_analysis", "competitive_research"
        ]
    }
