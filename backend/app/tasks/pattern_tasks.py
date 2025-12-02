from celery import Task
from app.core.celery import celery_app
from app.core.websocket import manager
from app.models.base import SessionLocal
from app.models.db.session import SessionDB
from app.models.db.pattern import PatternReportDB
from app.models.pattern import PatternReport
from app.models.intent import IntentExtractionResult
from app.services.mock_services import mock_pattern_discovery
import asyncio
import json
from datetime import datetime
from typing import Dict, Any


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def discover_patterns_task(self, session_id: str, intent_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Discover success patterns based on extracted intent using multi-agent system.
    Updates session state and sends WebSocket progress updates.
    """
    db = SessionLocal()
    try:
        # Get session
        session = db.query(SessionDB).filter(SessionDB.id == session_id).first()
        if not session:
            raise ValueError(f"Session {session_id} not found")
        
        # Update session status to processing
        session.status = "processing"
        session.current_step = "pattern_discovery"
        session.progress_percentage = 10.0
        db.commit()
        
        # Send WebSocket notifications using new event loop
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(manager.send_progress_update(
                session_id, 
                "pattern_discovery", 
                10.0, 
                "Starting pattern discovery analysis..."
            ))
        finally:
            loop.close()
        
        # Convert intent data to IntentExtractionResult
        intent_result = IntentExtractionResult(**intent_data)
        
        # Perform pattern discovery (mock for now)
        try:
            # Update progress for company analysis
            session.progress_percentage = 30.0
            db.commit()
            
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                loop.run_until_complete(manager.send_progress_update(
                    session_id, 
                    "pattern_discovery", 
                    30.0, 
                    "Analyzing companies in target market..."
                ))
            finally:
                loop.close()
            
            # Simulate company analysis phase
            import time
            time.sleep(2)  # Simulate processing time
            
            # Update progress for pattern extraction
            session.progress_percentage = 60.0
            db.commit()
            
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                loop.run_until_complete(manager.send_progress_update(
                    session_id, 
                    "pattern_discovery", 
                    60.0, 
                    "Extracting success patterns from company data..."
                ))
            finally:
                loop.close()
            
            # Generate mock pattern discovery
            intent_data = intent_result.model_dump(mode='json')
            intent_data["session_id"] = session_id  # Add session_id for mock service
            mock_report = mock_pattern_discovery(intent_data, session_id)
            
            # Update progress for report generation
            session.progress_percentage = 85.0
            db.commit()
            
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                loop.run_until_complete(manager.send_progress_update(
                    session_id, 
                    "pattern_discovery", 
                    85.0, 
                    "Generating pattern analysis report..."
                ))
            finally:
                loop.close()
            
            # Create database record for pattern report
            db_report = PatternReportDB(
                id=mock_report["id"],
                session_id=session_id,
                industry=mock_report["industry"],
                country=mock_report["country"],
                companies_analyzed=mock_report["companies_analyzed"],
                analysis_duration=mock_report["analysis_duration"],
                patterns=mock_report["patterns"],
                total_patterns=mock_report["total_patterns"],
                average_confidence=mock_report["average_confidence"],
                high_confidence_patterns=mock_report["high_confidence_patterns"],
                key_insights=mock_report["key_insights"],
                recommendations=mock_report["recommendations"],
                generated_at=datetime.utcnow()
            )
            
            db.add(db_report)
            db.commit()
            db.refresh(db_report)
            
            # Update session with pattern report
            session.pattern_report_id = db_report.id
            session.status = "patterns_discovered"
            session.current_step = "awaiting_validation"
            session.progress_percentage = 100.0
            db.commit()
            
            # Create response model
            pattern_report = PatternReport(
                **{k: v for k, v in mock_report.items() if k != 'generated_at'},
                generated_at=db_report.generated_at
            )
            
            # Send completion updates
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                loop.run_until_complete(manager.send_progress_update(
                    session_id, 
                    "pattern_discovery", 
                    100.0, 
                    "Pattern discovery completed successfully"
                ))
                
                loop.run_until_complete(manager.send_analysis_complete(
                    session_id, 
                    "pattern_discovery", 
                    {"pattern_report": pattern_report.dict()}
                ))
                
                # Send pattern discovered events for each high-confidence pattern
                for pattern in mock_report["patterns"]:
                    if pattern.get("confidence", 0) >= 0.7:
                        loop.run_until_complete(manager.send_pattern_discovered(
                            session_id, 
                            pattern
                        ))
            finally:
                loop.close()
            
            return {
                "success": True,
                "session_id": session_id,
                "pattern_report_id": db_report.id,
                "pattern_report": pattern_report.model_dump(mode='json')
            }
            
        except Exception as e:
            # Handle specific errors with retry logic
            if isinstance(e, (ConnectionError, TimeoutError)) and self.request.retries < self.max_retries:
                session.add_error(f"Pattern discovery failed (retry {self.request.retries + 1}): {str(e)}")
                db.commit()
                
                # Send error update
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                try:
                    loop.run_until_complete(manager.send_error(
                        session_id, 
                        f"Pattern discovery failed, retrying... ({self.request.retries + 1}/{self.max_retries})",
                        "retry_error"
                    ))
                finally:
                    loop.close()
                
                raise self.retry(countdown=60 * (2 ** self.request.retries), exc=e)
            else:
                # Mark session as failed
                session.status = "failed"
                session.add_error(f"Pattern discovery failed: {str(e)}")
                db.commit()
                
                # Send error update
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                try:
                    loop.run_until_complete(manager.send_error(
                        session_id, 
                        f"Pattern discovery failed: {str(e)}",
                        "processing_error"
                    ))
                finally:
                    loop.close()
                
                raise e
                
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


class PatternDiscoveryTask(Task):
    """Custom task class for pattern discovery with proper error handling"""
    
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """Handle task failure"""
        session_id = args[0] if args else None
        if session_id:
            db = SessionLocal()
            try:
                session = db.query(SessionDB).filter(SessionDB.id == session_id).first()
                if session:
                    session.status = "failed"
                    session.add_error(f"Pattern discovery task failed: {str(exc)}")
                    db.commit()
                    
                    # Send WebSocket error notification
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    try:
                        loop.run_until_complete(manager.send_error(
                            session_id, 
                            f"Pattern discovery task failed: {str(exc)}",
                            "task_failure"
                        ))
                    except Exception:
                        pass
                    finally:
                        loop.close()
            except Exception:
                pass
            finally:
                db.close()
    
    def on_success(self, retval, task_id, args, kwargs):
        """Handle task success"""
        session_id = args[0] if args else None
        if session_id and retval.get("success"):
            print(f"Pattern discovery completed successfully for session {session_id}")


# Register custom task class
discover_patterns_task = celery_app.register_task(discover_patterns_task)
