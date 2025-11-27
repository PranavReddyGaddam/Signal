# Backend - GTM Pattern Engine

FastAPI backend for the AI-Driven Go-To-Market Pattern Engine with multi-agent system.

## Tech Stack
- **Framework**: FastAPI
- **AI Framework**: Google Agent Development Kit
- **Database**: PostgreSQL + SQLAlchemy
- **Caching**: Redis
- **Queue**: Celery with Redis
- **Validation**: Pydantic
- **Testing**: Pytest

## Architecture
Multi-agent system with hierarchical workflow:
- Root Agent (GTM Pattern Engine)
- Intent Extractor Agent
- Pattern Discovery Workflow
- Lead Generation Workflow

## Getting Started
```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

## Features
- Multi-agent orchestration
- Parallel company validation
- Pattern discovery with confidence scoring
- Lead generation and signal analysis
- Real-time WebSocket updates
- Comprehensive API endpoints
