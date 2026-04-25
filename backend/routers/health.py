from datetime import datetime, timezone
from fastapi import APIRouter

router = APIRouter()
_scheduler = None


def set_scheduler(scheduler) -> None:
    global _scheduler
    _scheduler = scheduler


@router.get("/health")
async def health():
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "scheduler_running": _scheduler.running if _scheduler else False,
    }
