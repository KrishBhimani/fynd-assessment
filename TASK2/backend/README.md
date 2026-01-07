# Backend - AI Feedback System

FastAPI backend with PostgreSQL and LLM orchestration.

## Setup

```bash
pip install -r requirements.txt
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/feedback_db
OPENAI_API_KEY=sk-...
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

## API Endpoints

- `POST /reviews` - Submit a review
- `GET /admin/reviews` - Get all reviews
- `GET /health` - Health check
