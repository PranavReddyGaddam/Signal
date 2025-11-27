from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
import uuid
from datetime import datetime

from app.models.session import SessionState, SessionStatus

router = APIRouter()

# In-memory session storage for development
# In production, this would use Redis or database
sessions: Dict[str, SessionState] = {}


@router.post("/", response_model=SessionState)
async def create_session(user_input: str) -> SessionState:
    """
    Create a new analysis session.
    """
    session_id = str(uuid.uuid4())
    
    session = SessionState(
        id=session_id,
        user_input=user_input,
        status=SessionStatus.PENDING,
        current_step="intent_extraction",
        progress_percentage=0.0
    )
    
    sessions[session_id] = session
    return session


@router.get("/{session_id}", response_model=SessionState)
async def get_session(session_id: str) -> SessionState:
    """
    Get session state by ID.
    """
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return sessions[session_id]


@router.put("/{session_id}", response_model=SessionState)
async def update_session(session_id: str, updates: Dict[str, Any]) -> SessionState:
    """
    Update session state.
    """
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = sessions[session_id]
    
    # Update allowed fields
    if "status" in updates:
        session.status = SessionStatus(updates["status"])
    if "current_step" in updates:
        session.current_step = updates["current_step"]
    if "progress_percentage" in updates:
        session.progress_percentage = updates["progress_percentage"]
    if "extracted_intent" in updates:
        session.extracted_intent = updates["extracted_intent"]
    if "pattern_report_id" in updates:
        session.pattern_report_id = updates["pattern_report_id"]
    if "patterns_confirmed" in updates:
        session.patterns_confirmed = updates["patterns_confirmed"]
    if "lead_report_id" in updates:
        session.lead_report_id = updates["lead_report_id"]
    if "leads_generated" in updates:
        session.leads_generated = updates["leads_generated"]
    if "user_confirmations" in updates:
        session.user_confirmations.update(updates["user_confirmations"])
    
    session.updated_at = datetime.utcnow()
    
    return session


@router.delete("/{session_id}")
async def delete_session(session_id: str) -> Dict[str, str]:
    """
    Delete a session.
    """
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    del sessions[session_id]
    return {"message": "Session deleted successfully"}


@router.get("/", response_model=List[SessionState])
async def list_sessions() -> List[SessionState]:
    """
    List all active sessions.
    """
    return list(sessions.values())


@router.post("/{session_id}/confirm")
async def confirm_step(session_id: str, step: str, confirmed: bool) -> SessionState:
    """
    Confirm or reject a workflow step.
    """
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = sessions[session_id]
    session.user_confirmations[step] = confirmed
    
    if confirmed:
        if step == "intent_extraction":
            session.status = SessionStatus.INTENT_EXTRACTED
            session.current_step = "pattern_discovery"
        elif step == "patterns_validation":
            session.status = SessionStatus.PATTERNS_VALIDATED
            session.current_step = "lead_generation"
        elif step == "lead_generation":
            session.complete_session()
    else:
        session.status = SessionStatus.FAILED
        session.add_error(f"User rejected step: {step}")
    
    session.updated_at = datetime.utcnow()
    
    return session
