import asyncio
import logging
from datetime import datetime
from typing import Any, Dict

from celery import Task

from app.core.celery import celery_app
from app.core.websocket import manager
from app.models.base import SessionLocal
from app.models.db.session import SessionDB
from app.models.intent import IntentExtractionResult
from app.services.mock_services import mock_intent_extraction


logger = logging.getLogger(__name__)


def _run_async(coro_func, *args, **kwargs):
    """Run an async function in a fresh event loop (Celery tasks are sync)."""
    loop = asyncio.new_event_loop()
    try:
        asyncio.set_event_loop(loop)
        return loop.run_until_complete(coro_func(*args, **kwargs))
    finally:
        loop.close()


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def extract_intent_task(self, session_id: str, user_input: str) -> Dict[str, Any]:
    logger.info("[IntentTask] Starting for session %s", session_id)

    db = SessionLocal()
    try:
        session = db.query(SessionDB).filter(SessionDB.id == session_id).first()
        if not session:
            raise ValueError(f"Session {session_id} not found")

        session.status = "processing"
        session.current_step = "intent_extraction"
        session.progress_percentage = 10.0
        db.commit()

        _run_async(manager.send_progress_update, session_id, "intent_extraction", 10.0, "Starting intent extraction...")

        try:
            mock_intent = mock_intent_extraction(user_input, session_id)

            session.progress_percentage = 80.0
            db.commit()
            _run_async(
                manager.send_progress_update,
                session_id,
                "intent_extraction",
                80.0,
                "Processing intent with AI models...",
            )

            intent_result = IntentExtractionResult(
                **mock_intent,
                raw_input=user_input,
                confidence=0.85,
                extracted_at=datetime.utcnow(),
            )

            # Convert intent result to JSON-serializable dict
            intent_dict = intent_result.model_dump(mode='json')
            session.extracted_intent = intent_dict
            session.status = "intent_extracted"
            session.current_step = "awaiting_confirmation"
            session.progress_percentage = 100.0
            db.commit()

            _run_async(
                manager.send_progress_update,
                session_id,
                "intent_extraction",
                100.0,
                "Intent extraction completed successfully",
            )
            _run_async(
                manager.send_analysis_complete,
                session_id,
                "intent_extraction",
                {"intent": intent_result.dict()},
            )

            logger.info("[IntentTask] Completed for session %s", session_id)
            return {"success": True, "session_id": session_id, "intent": intent_result.dict()}

        except Exception as exc:
            logger.exception("[IntentTask] Error for session %s", session_id)
            if isinstance(exc, (ConnectionError, TimeoutError)) and self.request.retries < self.max_retries:
                session.add_error(f"Intent extraction failed (retry {self.request.retries + 1}): {exc}")
                db.commit()
                _run_async(
                    manager.send_error,
                    session_id,
                    f"Intent extraction failed, retrying... ({self.request.retries + 1}/{self.max_retries})",
                    "retry_error",
                )
                raise self.retry(countdown=60 * (2 ** self.request.retries), exc=exc)
            else:
                session.status = "failed"
                session.add_error(f"Intent extraction failed: {exc}")
                db.commit()
                _run_async(
                    manager.send_error,
                    session_id,
                    f"Intent extraction failed: {exc}",
                    "processing_error",
                )
                raise exc

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


class IntentExtractionTask(Task):
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        session_id = args[0] if args else None
        logger.error("[IntentTask] Failure for session %s", session_id, exc_info=exc)
        if not session_id:
            return

        db = SessionLocal()
        try:
            session = db.query(SessionDB).filter(SessionDB.id == session_id).first()
            if session:
                session.status = "failed"
                session.add_error(f"Intent extraction task failed: {exc}")
                db.commit()
                _run_async(
                    manager.send_error,
                    session_id,
                    f"Intent extraction task failed: {exc}",
                    "task_failure",
                )
        finally:
            db.close()

    def on_success(self, retval, task_id, args, kwargs):
        session_id = args[0] if args else None
        if session_id and retval.get("success"):
            logger.info("[IntentTask] Success callback for session %s", session_id)


extract_intent_task = celery_app.register_task(extract_intent_task)
