from celery import Celery
from app.core.config import settings

# Create Celery instance
celery_app = Celery(
    "gtm_pattern_engine",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.tasks.intent_tasks",
        "app.tasks.pattern_tasks", 
        "app.tasks.lead_tasks"
    ]
)

# Configure Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)

# Configure retry settings
celery_app.conf.update(
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    worker_disable_rate_limits=False,
)

# Configure beat scheduler for periodic tasks (if needed later)
celery_app.conf.beat_schedule = {
    # Example: cleanup old sessions every hour
    # 'cleanup-sessions': {
    #     'task': 'app.tasks.cleanup_tasks.cleanup_old_sessions',
    #     'schedule': 3600.0,
    # },
}

# Import tasks to ensure they're registered
from app.tasks import intent_tasks, pattern_tasks, lead_tasks
