import asyncio
from celery import Task
from app.core.celery import celery_app
from app.core.websocket import manager
from app.models.base import SessionLocal
from app.models.db.session import SessionDB
from app.models.db.lead import LeadReportDB
from app.models.lead import LeadReport
from app.models.pattern import PatternReport
from app.services.mock_services import mock_lead_generation
from datetime import datetime, timedelta
from typing import Dict, Any


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def generate_leads_task(self, session_id: str, pattern_report_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate qualified leads based on discovered patterns using external APIs and analysis.
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
        session.current_step = "lead_generation"
        session.progress_percentage = 10.0
        db.commit()
        
        # Send initial progress update
        asyncio.run(manager.send_progress_update(
            session_id, 
            "lead_generation", 
            10.0, 
            "Starting lead generation based on discovered patterns..."
        ))
        
        # Convert pattern data to PatternReport
        pattern_report = PatternReport(**pattern_report_data)
        
        # Perform lead generation (mock for now)
        try:
            # Update progress for data collection
            session.progress_percentage = 25.0
            db.commit()
            
            asyncio.run(manager.send_progress_update(
                session_id, 
                "lead_generation", 
                25.0, 
                "Collecting company data from external sources..."
            ))
            
            # Simulate data collection phase
            import time
            time.sleep(1)  # Simulate API calls
            
            # Update progress for signal analysis
            session.progress_percentage = 50.0
            db.commit()
            
            asyncio.run(manager.send_progress_update(
                session_id, 
                "lead_generation", 
                50.0, 
                "Analyzing signals and matching patterns..."
            ))
            
            # Simulate signal analysis
            time.sleep(1)
            
            # Update progress for lead scoring
            session.progress_percentage = 75.0
            db.commit()
            
            asyncio.run(manager.send_progress_update(
                session_id, 
                "lead_generation", 
                75.0, 
                "Scoring leads and prioritizing opportunities..."
            ))
            
            # Generate mock lead generation
            mock_report = mock_lead_generation(pattern_report.model_dump(mode='json'), session_id)
            
            # Create database record for lead report
            db_report = LeadReportDB(
                id=mock_report["id"],
                session_id=session_id,
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
            
            # Update session with lead report
            session.lead_report_id = db_report.id
            session.leads_generated = True
            session.status = "completed"
            session.current_step = "completed"
            session.progress_percentage = 100.0
            session.completed_at = datetime.utcnow()
            db.commit()
            
            # Create response model
            lead_report = LeadReport(
                **{k: v for k, v in mock_report.items() if k != 'generated_at'},
                generated_at=db_report.generated_at
            )
            
            # Send completion update
            asyncio.run(manager.send_progress_update(
                session_id, 
                "lead_generation", 
                100.0, 
                "Lead generation completed successfully"
            ))
            
            asyncio.run(manager.send_analysis_complete(
                session_id, 
                "lead_generation", 
                {"lead_report": lead_report.dict()}
            ))
            
            # Send lead found events for high-priority leads
            for lead in mock_report["leads"]:
                if lead.get("priority") == "high":
                    asyncio.run(manager.send_lead_found(
                        session_id, 
                        lead
                    ))
            
            return {
                "success": True,
                "session_id": session_id,
                "lead_report_id": db_report.id,
                "lead_report": lead_report.model_dump(mode='json'),
                "leads_generated": mock_report["leads_generated"]
            }
            
        except Exception as e:
            # Handle specific errors with retry logic
            if isinstance(e, (ConnectionError, TimeoutError)) and self.request.retries < self.max_retries:
                session.add_error(f"Lead generation failed (retry {self.request.retries + 1}): {str(e)}")
                db.commit()
                
                # Send error update
                asyncio.run(manager.send_error(
                    session_id, 
                    f"Lead generation failed, retrying... ({self.request.retries + 1}/{self.max_retries})",
                    "retry_error"
                ))
                
                raise self.retry(countdown=60 * (2 ** self.request.retries), exc=e)
            else:
                # Mark session as failed
                session.status = "failed"
                session.add_error(f"Lead generation failed: {str(e)}")
                db.commit()
                
                # Send error update
                asyncio.run(manager.send_error(
                    session_id, 
                    f"Lead generation failed: {str(e)}",
                    "processing_error"
                ))
                
                raise e
                
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


@celery_app.task(bind=True, max_retries=2, default_retry_delay=30)
def export_leads_task(self, session_id: str, lead_report_id: str, format: str = "json") -> Dict[str, Any]:
    """
    Export leads in specified format (json, csv, pdf).
    """
    db = SessionLocal()
    try:
        # Get lead report
        lead_report = db.query(LeadReportDB).filter(LeadReportDB.id == lead_report_id).first()
        if not lead_report:
            raise ValueError(f"Lead report {lead_report_id} not found")
        
        # Mock export process
        export_id = f"export_{lead_report_id}_{format}_{int(datetime.utcnow().timestamp())}"
        
        # Simulate export processing time
        import time
        time.sleep(2)
        
        # In production, this would generate actual files
        export_result = {
            "export_id": export_id,
            "format": format,
            "lead_report_id": lead_report_id,
            "download_url": f"/api/v1/leads/download/{export_id}.{format}",
            "expires_at": (datetime.utcnow() + timedelta(hours=24)).isoformat(),
            "file_size": 1024 * 100  # Mock file size
        }
        
        return {
            "success": True,
            "export": export_result
        }
        
    except Exception as e:
        if self.request.retries < self.max_retries:
            raise self.retry(countdown=30 * (2 ** self.request.retries), exc=e)
        raise e
    finally:
        db.close()


class LeadGenerationTask(Task):
    """Custom task class for lead generation with proper error handling"""
    
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """Handle task failure"""
        session_id = args[0] if args else None
        if session_id:
            db = SessionLocal()
            try:
                session = db.query(SessionDB).filter(SessionDB.id == session_id).first()
                if session:
                    session.status = "failed"
                    session.add_error(f"Lead generation task failed: {str(exc)}")
                    db.commit()
                    
                    # Send WebSocket error notification
                    asyncio.run(manager.send_error(
                        session_id, 
                        f"Lead generation task failed: {str(exc)}",
                        "task_failure"
                    ))
            except Exception:
                pass
            finally:
                db.close()
    
    def on_success(self, retval, task_id, args, kwargs):
        """Handle task success"""
        session_id = args[0] if args else None
        if session_id and retval.get("success"):
            print(f"Lead generation completed successfully for session {session_id}")


# Register custom task classes
generate_leads_task = celery_app.register_task(generate_leads_task)
export_leads_task = celery_app.register_task(export_leads_task)
