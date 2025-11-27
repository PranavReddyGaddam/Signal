from fastapi import APIRouter

from app.api.v1.endpoints import intent, patterns, leads, sessions

api_router = APIRouter()

api_router.include_router(intent.router, prefix="/intent", tags=["intent"])
api_router.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
api_router.include_router(patterns.router, prefix="/patterns", tags=["patterns"])
api_router.include_router(leads.router, prefix="/leads", tags=["leads"])
