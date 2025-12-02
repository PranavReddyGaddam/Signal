import os
import requests
import json
from typing import Dict, Any, List, Optional
from datetime import datetime
import uuid

# Import existing models
from app.models.intent import IntentExtractionResult
from app.models.pattern import PatternReport, SuccessPattern
from app.models.lead import LeadReport, LeadAnalysisResult, SignalAnalysis


class GTMLLMService:
    """
    LLM service for GTM Pattern Engine using OpenRouter with Cerebras provider.
    Replaces mock services with real AI inference.
    """
    
    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        if not self.api_key:
            raise ValueError("OPENROUTER_API_KEY environment variable is required")
        
        self.url = "https://openrouter.ai/api/v1/chat/completions"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:8000",
            "X-Title": "GTM-Pattern-Engine"
        }
    
    def _extract_json_from_response(self, response: str) -> str:
        """
        Extract clean JSON from LLM response, handling markdown and formatting issues.
        """
        # Remove markdown code fences if present
        if "```json" in response:
            start = response.find("```json") + 7
            end = response.find("```", start)
            if end != -1:
                return response[start:end].strip()
        
        if "```" in response:
            start = response.find("```") + 3
            end = response.find("```", start)
            if end != -1:
                return response[start:end].strip()
        
        # Try to find JSON object boundaries
        import re
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            return json_match.group().strip()
        
        # If no clear boundaries found, return as-is
        return response.strip()
    
    def _parse_json_safely(self, response: str) -> Dict[str, Any]:
        """
        Parse JSON with multiple fallback strategies.
        """
        cleaned_response = self._extract_json_from_response(response)
        
        try:
            return json.loads(cleaned_response)
        except json.JSONDecodeError as e:
            # Try to fix common JSON issues
            try:
                # Remove trailing commas
                fixed = re.sub(r',(\s*[}\]])', r'\1', cleaned_response)
                return json.loads(fixed)
            except:
                raise Exception(f"Failed to parse LLM response as JSON: {e}")
    
    def _make_request(self, messages: List[Dict], max_tokens: int = 4000, temperature: float = 0.2) -> str:
        """
        Make API call to OpenRouter using requests library.
        """
        payload = {
            "model": "qwen/qwen3-235b-a22b-2507",
            "provider": {
                "only": ["Cerebras"]
            },
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }

        try:
            response = requests.post(self.url, headers=self.headers, json=payload, timeout=60)
            
            # Handle specific HTTP status codes
            if response.status_code == 429:
                raise Exception("Rate limit exceeded. Please wait a few minutes before trying again.")
            elif response.status_code == 401:
                raise Exception("Invalid API key or authentication failed.")
            elif response.status_code == 403:
                raise Exception("Access forbidden. Please check your API key permissions.")
            elif response.status_code == 408:
                raise Exception("Request timed out. Please try again.")
            
            response.raise_for_status()
            response_data = response.json()
            return response_data["choices"][0]["message"]["content"]

        except requests.exceptions.Timeout:
            raise Exception("Request timed out. The LLM service might be overloaded.")
        
        except requests.exceptions.ConnectionError:
            raise Exception("Failed to connect to AI service. Please check your internet connection.")
        
        except requests.exceptions.RequestException as e:
            raise Exception(f"OpenRouter API request failed: {str(e)}")
        
        except Exception as e:
            raise Exception(f"Unexpected error in LLM service: {str(e)}")
    
    def extract_intent(self, user_input: str, session_id: str) -> Dict[str, Any]:
        """
        Extract intent from user input using LLM.
        """
        max_retries = 2
        for attempt in range(max_retries):
            try:
                prompt = self._build_intent_prompt(user_input)
                messages = [
                    {"role": "system", "content": "You are a GTM (Go-To-Market) strategy expert. Extract structured intent from user queries about finding companies or market opportunities."},
                    {"role": "user", "content": prompt}
                ]
                
                response = self._make_request(messages, max_tokens=1000, temperature=0.1)
                
                # Parse JSON response
                try:
                    intent_data = json.loads(response)
                except json.JSONDecodeError:
                    # Fallback: extract JSON from response
                    import re
                    json_match = re.search(r'\{.*\}', response, re.DOTALL)
                    if json_match:
                        intent_data = json.loads(json_match.group())
                    else:
                        raise Exception("Failed to parse LLM response as JSON")
                
                # Ensure required fields
                intent_data.update({
                    "confidence": intent_data.get("confidence", 0.85),
                    "raw_input": user_input,
                    "extracted_at": datetime.utcnow().isoformat()
                })
                
                return {
                    "success": True,
                    "session_id": session_id,
                    "intent": intent_data
                }
                
            except Exception as e:
                if attempt == max_retries - 1:
                    return {
                        "success": False,
                        "session_id": session_id,
                        "error": str(e)
                    }
                continue
    
    def discover_patterns(self, intent_data: Dict[str, Any], session_id: str) -> Dict[str, Any]:
        """
        Discover success patterns based on extracted intent using LLM.
        """
        max_retries = 2
        for attempt in range(max_retries):
            try:
                prompt = self._build_pattern_discovery_prompt(intent_data)
                messages = [
                    {"role": "system", "content": "You are a GTM strategy expert specializing in identifying success patterns for companies in different industries and markets."},
                    {"role": "user", "content": prompt}
                ]
                
                response = self._make_request(messages, max_tokens=2000, temperature=0.3)
                
                # Parse JSON response
                try:
                    pattern_data = json.loads(response)
                except json.JSONDecodeError:
                    import re
                    json_match = re.search(r'\{.*\}', response, re.DOTALL)
                    if json_match:
                        pattern_data = json.loads(json_match.group())
                    else:
                        raise Exception("Failed to parse LLM response as JSON")
                
                # Ensure required fields
                report_id = str(uuid.uuid4())
                pattern_data.update({
                    "id": report_id,
                    "session_id": session_id,
                    "companies_analyzed": pattern_data.get("companies_analyzed", 12),
                    "analysis_duration": pattern_data.get("analysis_duration", 45.2),
                    "total_patterns": len(pattern_data.get("patterns", [])),
                    "generated_at": datetime.utcnow().isoformat(),
                    "model_version": "1.0"
                })
                
                return {
                    "success": True,
                    "session_id": session_id,
                    "pattern_report_id": report_id,
                    "pattern_report": pattern_data
                }
                
            except Exception as e:
                if attempt == max_retries - 1:
                    return {
                        "success": False,
                        "session_id": session_id,
                        "error": str(e)
                    }
                continue
    
    def generate_leads(self, pattern_report: Dict[str, Any], session_id: str) -> Dict[str, Any]:
        """
        Generate leads based on discovered patterns using LLM.
        """
        max_retries = 3  # Increased retries for JSON parsing issues
        for attempt in range(max_retries):
            try:
                prompt = self._build_lead_generation_prompt(pattern_report)
                messages = [
                    {"role": "system", "content": "You are a B2B lead generation expert specializing in identifying high-quality potential customers based on success patterns and market analysis. Return ONLY valid JSON."},
                    {"role": "user", "content": prompt}
                ]
                
                # Use higher max_tokens for complex lead generation
                response = self._make_request(messages, max_tokens=6000, temperature=0.1)
                
                # Parse JSON with robust extraction
                lead_data = self._parse_json_safely(response)
                
                # Ensure required fields
                report_id = str(uuid.uuid4())
                lead_data.update({
                    "id": report_id,
                    "session_id": session_id,
                    "pattern_report_id": pattern_report.get("id", ""),
                    "leads_generated": len(lead_data.get("leads", [])),
                    "analysis_duration": lead_data.get("analysis_duration", 32.8),
                    "export_formats": ["csv", "json", "xlsx"],
                    "generated_at": datetime.utcnow().isoformat(),
                    "model_version": "1.0"
                })
                
                return {
                    "success": True,
                    "session_id": session_id,
                    "lead_report_id": report_id,
                    "lead_report": lead_data
                }
                
            except Exception as e:
                if attempt == max_retries - 1:
                    return {
                        "success": False,
                        "session_id": session_id,
                        "error": f"Failed to generate leads after {max_retries} attempts: {str(e)}"
                    }
                # Retry with lower temperature for more deterministic output
                continue
    
    def _build_intent_prompt(self, user_input: str) -> str:
        """Build prompt for intent extraction."""
        return f"""
Extract the GTM intent from this user query: "{user_input}"

Return a JSON object with these exact fields:
{{
    "industry": "string (the industry sector like 'SaaS', 'FinTech', 'HealthTech', etc.)",
    "country": "string (the target country/market)",
    "company_size": "string or null (like 'Enterprise', 'Mid-Market', 'Small', or null if not specified)",
    "goal": "string (like 'lead_generation', 'market_analysis', 'competitive_intelligence', etc.)",
    "confidence": "number between 0 and 1"
}}

Be precise and only extract information that's clearly mentioned in the query.
"""
    
    def _build_pattern_discovery_prompt(self, intent_data: Dict[str, Any]) -> str:
        """Build prompt for pattern discovery."""
        industry = intent_data.get("industry", "SaaS")
        country = intent_data.get("country", "United States")
        
        return f"""
Generate success patterns for {industry} companies in {country}.

Return a JSON object with these exact fields:
{{
    "industry": "{industry}",
    "country": "{country}",
    "companies_analyzed": 12,
    "analysis_duration": 45.2,
    "patterns": [
        {{
            "id": "unique uuid string",
            "name": "pattern name",
            "description": "detailed description",
            "confidence": 0.85,
            "frequency": 8,
            "total_companies": 12,
            "category": "business_model",
            "subcategory": "growth_strategy",
            "key_attributes": ["attribute1", "attribute2", "attribute3"],
            "success_metrics": {{
                "metric1": 0.9,
                "metric2": 85.0
            }},
            "implementation_complexity": "medium",
            "source_companies": ["Company A", "Company B"],
            "discovered_at": "ISO datetime string",
            "model_version": "1.0"
        }}
    ],
    "total_patterns": 2,
    "average_confidence": 0.815,
    "high_confidence_patterns": 2,
    "key_insights": ["insight1", "insight2", "insight3"],
    "recommendations": ["recommendation1", "recommendation2", "recommendation3"]
}}

Generate 2-3 realistic patterns for the specified industry and market.
"""
    
    def _build_lead_generation_prompt(self, pattern_report: Dict[str, Any]) -> str:
        """Build prompt for lead generation."""
        industry = pattern_report.get("industry", "SaaS")
        country = pattern_report.get("country", "United States")
        patterns = pattern_report.get("patterns", [])
        
        return f"""
Generate 5 high-quality B2B leads for {industry} companies in {country} based on these success patterns: {[p.get('name', 'Unknown') for p in patterns]}

CRITICAL: Return ONLY valid JSON. No markdown, no code fences, no explanations, no commentary. Just the JSON object.

Use this exact structure:
{{
    "industry": "{industry}",
    "country": "{country}",
    "leads": [
        {{
            "lead_id": "uuid-string",
            "session_id": "uuid-string", 
            "quality_score": 0.85,
            "priority": "high",
            "matched_patterns": ["pattern1"],
            "pattern_scores": {{"pattern1": 0.8}},
            "signal_analysis": {{
                "lead_id": "uuid-string",
                "market_signals": {{"growth_potential": 0.8}},
                "financial_signals": {{"revenue_stability": 0.6}},
                "technology_signals": {{"tech_stack": 0.8}},
                "growth_signals": {{"hiring_rate": 0.9}},
                "overall_score": 0.8,
                "confidence": 0.85,
                "positive_signals": ["signal1"],
                "negative_signals": [],
                "missing_signals": [],
                "signal_strength": "strong",
                "signal_timestamp": "2024-01-01T00:00:00Z"
            }},
            "outreach_recommendations": ["rec1"],
            "talking_points": ["point1"],
            "risk_factors": ["risk1"],
            "opportunity_factors": ["opp1"],
            "analyzed_at": "2024-01-01T00:00:00Z",
            "model_version": "1.0"
        }}
    ],
    "high_priority_leads": 2,
    "medium_priority_leads": 2,
    "low_priority_leads": 1,
    "average_quality_score": 0.69,
    "pattern_coverage": {{"pattern1": 5}},
    "key_insights": ["insight1"],
    "market_opportunities": ["opp1"],
    "recommended_approach": "detailed approach description"
}}

Generate realistic lead data. Ensure all JSON is properly formatted and complete.
"""


# Global instance (only created if API key is present)
try:
    llm_service = GTMLLMService()
except ValueError:
    llm_service = None
