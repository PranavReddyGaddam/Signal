from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List
import uuid
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.session import SessionState, SessionStatus
from app.models.db.session import SessionDB
from app.models.base import get_db
from app.tasks.intent_tasks import extract_intent_task
from app.tasks.pattern_tasks import discover_patterns_task
from app.tasks.lead_tasks import generate_leads_task

router = APIRouter()


@router.post("/", response_model=SessionState)
async def create_session(user_input: str, db: Session = Depends(get_db)) -> SessionState:
    """
    Create a new analysis session and start intent extraction asynchronously.
    """
    session_id = str(uuid.uuid4())
    
    # Create database record
    db_session = SessionDB(
        id=session_id,
        user_input=user_input,
        status=SessionStatus.PENDING.value,
        current_step="intent_extraction",
        progress_percentage=0.0
    )
    
    try:
        db.add(db_session)
        db.commit()
        db.refresh(db_session)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create session: {str(e)}")
    
    # Trigger intent extraction task asynchronously
    try:
        extract_intent_task.delay(session_id, user_input)
    except Exception as e:
        # Update session status to failed if task submission fails
        db_session.status = SessionStatus.FAILED.value
        db_session.add_error(f"Failed to start intent extraction task: {str(e)}")
        db.commit()
        raise HTTPException(status_code=500, detail=f"Failed to start processing: {str(e)}")
    
    # Convert to response model
    return SessionState(
        id=db_session.id,
        user_input=db_session.user_input,
        status=SessionStatus(db_session.status),
        current_step=db_session.current_step,
        progress_percentage=db_session.progress_percentage,
        extracted_intent=db_session.extracted_intent,
        pattern_report_id=db_session.pattern_report_id,
        patterns_confirmed=db_session.patterns_confirmed,
        lead_report_id=db_session.lead_report_id,
        leads_generated=db_session.leads_generated,
        user_confirmations=db_session.user_confirmations,
        errors=db_session.errors,
        created_at=db_session.created_at,
        updated_at=db_session.updated_at,
        completed_at=db_session.completed_at
    )


@router.get("/{session_id}", response_model=SessionState)
async def get_session(session_id: str, db: Session = Depends(get_db)) -> SessionState:
    """
    Get session state by ID.
    """
    db_session = db.query(SessionDB).filter(SessionDB.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return SessionState(
        id=db_session.id,
        user_input=db_session.user_input,
        status=SessionStatus(db_session.status),
        current_step=db_session.current_step,
        progress_percentage=db_session.progress_percentage,
        extracted_intent=db_session.extracted_intent,
        pattern_report_id=db_session.pattern_report_id,
        patterns_confirmed=db_session.patterns_confirmed,
        lead_report_id=db_session.lead_report_id,
        leads_generated=db_session.leads_generated,
        user_confirmations=db_session.user_confirmations,
        errors=db_session.errors,
        created_at=db_session.created_at,
        updated_at=db_session.updated_at,
        completed_at=db_session.completed_at
    )


@router.put("/{session_id}", response_model=SessionState)
async def update_session(session_id: str, updates: Dict[str, Any], db: Session = Depends(get_db)) -> SessionState:
    """
    Update session state.
    """
    db_session = db.query(SessionDB).filter(SessionDB.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Update allowed fields
    try:
        db_session.status = updates["status"]
        if "current_step" in updates:
            db_session.current_step = updates["current_step"]
        if "progress_percentage" in updates:
            db_session.progress_percentage = updates["progress_percentage"]
        if "extracted_intent" in updates:
            db_session.extracted_intent = updates["extracted_intent"]
        if "pattern_report_id" in updates:
            db_session.pattern_report_id = updates["pattern_report_id"]
        if "patterns_confirmed" in updates:
            db_session.patterns_confirmed = updates["patterns_confirmed"]
        if "lead_report_id" in updates:
            db_session.lead_report_id = updates["lead_report_id"]
        if "leads_generated" in updates:
            db_session.leads_generated = updates["leads_generated"]
        if "user_confirmations" in updates:
            db_session.user_confirmations.update(updates["user_confirmations"])
        
        db_session.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_session)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update session: {str(e)}")
    
    return SessionState(
        id=db_session.id,
        user_input=db_session.user_input,
        status=SessionStatus(db_session.status),
        current_step=db_session.current_step,
        progress_percentage=db_session.progress_percentage,
        extracted_intent=db_session.extracted_intent,
        pattern_report_id=db_session.pattern_report_id,
        patterns_confirmed=db_session.patterns_confirmed,
        lead_report_id=db_session.lead_report_id,
        leads_generated=db_session.leads_generated,
        user_confirmations=db_session.user_confirmations,
        errors=db_session.errors,
        created_at=db_session.created_at,
        updated_at=db_session.updated_at,
        completed_at=db_session.completed_at
    )


@router.delete("/{session_id}")
async def delete_session(session_id: str, db: Session = Depends(get_db)) -> Dict[str, str]:
    """
    Delete a session.
    """
    db_session = db.query(SessionDB).filter(SessionDB.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        db.delete(db_session)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete session: {str(e)}")
    
    return {"message": "Session deleted successfully"}


@router.get("/", response_model=List[SessionState])
async def list_sessions(db: Session = Depends(get_db)) -> List[SessionState]:
    """
    List all active sessions.
    """
    db_sessions = db.query(SessionDB).all()
    
    return [
        SessionState(
            id=s.id,
            user_input=s.user_input,
            status=SessionStatus(s.status),
            current_step=s.current_step,
            progress_percentage=s.progress_percentage,
            extracted_intent=s.extracted_intent,
            pattern_report_id=s.pattern_report_id,
            patterns_confirmed=s.patterns_confirmed,
            lead_report_id=s.lead_report_id,
            leads_generated=s.leads_generated,
            user_confirmations=s.user_confirmations,
            errors=s.errors,
            created_at=s.created_at,
            updated_at=s.updated_at,
            completed_at=s.completed_at
        )
        for s in db_sessions
    ]


@router.post("/{session_id}/confirm")
async def confirm_step(session_id: str, step: str, confirmed: bool, db: Session = Depends(get_db)) -> SessionState:
    """
    Confirm or reject a workflow step and trigger next step if confirmed.
    """
    db_session = db.query(SessionDB).filter(SessionDB.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        # Update confirmations
        if not db_session.user_confirmations:
            db_session.user_confirmations = {}
        db_session.user_confirmations[step] = confirmed
        
        if confirmed:
            if step == "intent_extraction":
                # Start pattern discovery task
                if not db_session.extracted_intent:
                    raise HTTPException(status_code=400, detail="Intent extraction not completed")
                
                db_session.status = SessionStatus.PATTERNS_DISCOVERING.value
                db_session.current_step = "pattern_discovery"
                db_session.patterns_confirmed = False
                db.commit()
                
                # Trigger pattern discovery task
                discover_patterns_task.delay(session_id, db_session.extracted_intent)
                
            elif step == "pattern_discovery":
                # Start lead generation task
                if not db_session.pattern_report_id:
                    raise HTTPException(status_code=400, detail="Pattern discovery not completed")
                
                db_session.status = SessionStatus.LEADS_GENERATING.value
                db_session.current_step = "lead_generation"
                db_session.leads_generated = False
                db.commit()
                
                # Get pattern report data for task
                from app.models.db.pattern import PatternReportDB
                pattern_report = db.query(PatternReportDB).filter(PatternReportDB.id == db_session.pattern_report_id).first()
                if pattern_report:
                    # Convert to dict for task
                    pattern_data = {
                        "id": pattern_report.id,
                        "session_id": pattern_report.session_id,
                        "industry": pattern_report.industry,
                        "country": pattern_report.country,
                        "companies_analyzed": pattern_report.companies_analyzed,
                        "analysis_duration": pattern_report.analysis_duration,
                        "patterns": pattern_report.patterns,
                        "total_patterns": pattern_report.total_patterns,
                        "average_confidence": pattern_report.average_confidence,
                        "high_confidence_patterns": pattern_report.high_confidence_patterns,
                        "key_insights": pattern_report.key_insights,
                        "recommendations": pattern_report.recommendations,
                        "generated_at": pattern_report.generated_at.isoformat()
                    }
                    generate_leads_task.delay(session_id, pattern_data)
                
            elif step == "lead_generation":
                # Complete the session
                db_session.status = SessionStatus.COMPLETED.value
                db_session.current_step = "completed"
                db_session.progress_percentage = 100.0
                db_session.completed_at = datetime.utcnow()
        else:
            db_session.status = SessionStatus.FAILED.value
            db_session.add_error(f"User rejected step: {step}")
        
        db_session.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_session)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to confirm step: {str(e)}")
    
    return SessionState(
        id=db_session.id,
        user_input=db_session.user_input,
        status=SessionStatus(db_session.status),
        current_step=db_session.current_step,
        progress_percentage=db_session.progress_percentage,
        extracted_intent=db_session.extracted_intent,
        pattern_report_id=db_session.pattern_report_id,
        patterns_confirmed=db_session.patterns_confirmed,
        lead_report_id=db_session.lead_report_id,
        leads_generated=db_session.leads_generated,
        user_confirmations=db_session.user_confirmations,
        errors=db_session.errors,
        created_at=db_session.created_at,
        updated_at=db_session.updated_at,
        completed_at=db_session.completed_at
    )
