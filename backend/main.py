import asyncio
import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from supabase import create_client, Client

import ingestion.fred as fred_ingest
import ingestion.market as market_ingest
import ingestion.news as news_ingest
import ingestion.embeddings as embeddings_mod
import correlation.engine as corr_engine
import ai.brief as ai_brief
from routers import health as health_router
from routers import signals as signals_router
from routers import brief as brief_router
from routers import macro as macro_router
from routers import chokepoints as chokepoints_router
from routers import risk as risk_router
from routers import map_layers as map_layers_router
from routers import ai_toggle as ai_toggle_router
from routers import economic_stress as economic_stress_router


def _create_supabase() -> Client | None:
    url = os.getenv("SUPABASE_URL", "")
    key = os.getenv("SUPABASE_ANON_KEY", "")
    if not url or not key:
        logging.warning("SUPABASE_URL or SUPABASE_ANON_KEY not set — running without database")
        return None
    return create_client(url, key)


@asynccontextmanager
async def lifespan(app: FastAPI):
    db = _create_supabase()
    app.state.db = db
    scheduler = AsyncIOScheduler()

    if db:
        for mod in [fred_ingest, market_ingest, news_ingest, embeddings_mod, corr_engine, ai_brief]:
            if hasattr(mod, "set_db"):
                mod.set_db(db)

        scheduler.add_job(fred_ingest.run, "interval", minutes=15, id="fred")
        scheduler.add_job(market_ingest.run, "interval", minutes=15, id="market")
        scheduler.add_job(news_ingest.run, "interval", minutes=15, id="news")
        scheduler.add_job(corr_engine.run, "interval", minutes=15, id="engine", jitter=120)
        scheduler.add_job(ai_brief.run, "interval", minutes=30, id="brief")
        scheduler.start()
        health_router.set_scheduler(scheduler)
        logging.info("Supabase connected, scheduler started")

        asyncio.create_task(_initial_ingestion())
    else:
        logging.warning("No Supabase credentials — demo mode only")

    yield

    scheduler.shutdown(wait=False)


async def _initial_ingestion():
    await asyncio.sleep(3)
    logging.info("Running initial ingestion...")
    for job_fn in [fred_ingest.run, market_ingest.run, news_ingest.run]:
        try:
            await job_fn()
        except Exception as e:
            logging.error(f"Initial ingestion error: {e}")
    await asyncio.sleep(5)
    for job_fn in [corr_engine.run, ai_brief.run]:
        try:
            await job_fn()
        except Exception as e:
            logging.error(f"Initial processing error: {e}")


app = FastAPI(title="Signal", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router.router, prefix="/api")
app.include_router(signals_router.router, prefix="/api")
app.include_router(brief_router.router, prefix="/api")
app.include_router(macro_router.router, prefix="/api")
app.include_router(chokepoints_router.router, prefix="/api")
app.include_router(risk_router.router, prefix="/api")
app.include_router(map_layers_router.router, prefix="/api")
app.include_router(ai_toggle_router.router, prefix="/api")
app.include_router(economic_stress_router.router, prefix="/api")
