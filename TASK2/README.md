# AI Feedback System

A production-grade, two-dashboard AI feedback system with server-side LLM orchestration.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│  ┌─────────────────────┐    ┌─────────────────────────────────┐ │
│  │   User Dashboard    │    │      Admin Dashboard            │ │
│  │   (/)               │    │      (/admin)                   │ │
│  │                     │    │                                 │ │
│  │  • Star rating      │    │  • View all submissions         │ │
│  │  • Review text      │    │  • AI summaries & actions       │ │
│  │  • AI response      │    │  • Statistics & filters         │ │
│  └─────────────────────┘    └─────────────────────────────────┘ │
└────────────────────────────────┬────────────────────────────────┘
                                 │ REST API
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Backend (FastAPI)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Validation  │→ │Business Logic│→ │  LLM Orchestration   │  │
│  │    Layer     │  │    Layer     │  │   (OpenAI GPT-4o)    │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                           │                     │               │
│                    ┌──────┴─────────────────────┘               │
│                    ▼                                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Error Handling & Fallbacks                  │   │
│  │  • Timeout protection   • Graceful degradation          │   │
│  │  • Rate limiting        • Always store submissions       │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  PostgreSQL Database   │
                    │  (Supabase/Neon/Local) │
                    └────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL database
- OpenAI API key

### 1. Backend Setup

```bash
cd TASK2/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL and OPENAI_API_KEY

# Run the server
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup

```bash
cd TASK2/frontend

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local

# Run the development server
npm run dev
```

### 3. Access the Application

- **User Dashboard**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3000/admin
- **API Docs**: http://localhost:8000/docs

## 📋 API Contract

### POST /reviews

Submit a new review.

**Request:**
```json
{
  "rating": 4,
  "review_text": "Great service, but the food was cold."
}
```

**Response:**
```json
{
  "success": true,
  "ai_response": "Thank you for your feedback! We're glad you enjoyed the service. We apologize for the food temperature and will address this with our kitchen team."
}
```

### GET /admin/reviews

Get all reviews for admin dashboard.

**Query Parameters:**
- `limit` (optional): Max results (default: 100)
- `offset` (optional): Pagination offset (default: 0)
- `rating` (optional): Filter by rating (1-5)

**Response:**
```json
{
  "reviews": [
    {
      "id": 1,
      "rating": 4,
      "review_text": "Great service, but the food was cold.",
      "ai_summary": "Positive experience with service concern about food temperature",
      "ai_actions": "Review kitchen timing procedures; follow up on food quality",
      "status": "success",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1
}
```

### GET /admin/stats

Get dashboard statistics.

**Response:**
```json
{
  "total_reviews": 150,
  "average_rating": 4.2,
  "success_count": 145,
  "failed_count": 5,
  "recent_24h_count": 12,
  "rating_distribution": {
    "1": 5,
    "2": 10,
    "3": 25,
    "4": 50,
    "5": 60
  }
}
```

## 🤖 LLM Handling

### Server-Side Only

All LLM calls are made exclusively from the backend. The frontend never accesses the OpenAI API directly.

### Structured Output

Each review triggers a single LLM call that extracts:
1. **User Response**: Message shown to the customer
2. **Internal Summary**: Brief analysis for admin team
3. **Recommended Actions**: Suggested follow-up steps

### Prompt Strategy

| Rating | Approach |
|--------|----------|
| 4-5 ★ | Express gratitude, reinforce positives |
| 3 ★ | Acknowledge mixed experience, commit to improvement |
| 1-2 ★ | Show empathy, apologize, express improvement intent |

### Fallback Behavior

| Scenario | Handling |
|----------|----------|
| Empty review | Return rating-based generic response without LLM call |
| LLM timeout (30s) | Store submission, mark as failed, return fallback message |
| Malformed output | Parse what's available, use defaults for missing fields |
| API error | Graceful degradation with friendly user message |

## ⚠️ Error Handling

### Guaranteed Storage

All submissions are stored in the database, even if LLM processing fails. Users always receive a response.

### Error Matrix

| Error Type | User Message | Backend Action |
|------------|--------------|----------------|
| Empty review | "Thank you for your rating!" | Process without LLM call |
| Very long review | Normal processing | Truncate for LLM, store full text |
| LLM timeout | "Your feedback was recorded." | Mark as failed, store fallback |
| Rate limit (429) | "Please wait before submitting." | Reject request |
| Database error | "Service temporarily unavailable." | Log error, return 500 |

## 🚦 Rate Limiting

- **Limit**: 10 requests per 60 seconds per IP
- **Scope**: Applied to `/reviews` endpoint
- **Response**: 429 status with friendly message

## 🗄️ Database Schema

```sql
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT NOT NULL DEFAULT '',
    ai_response TEXT,
    ai_summary TEXT,
    ai_actions TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    error_message TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 📁 Project Structure

```
TASK2/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app entry
│   │   ├── config.py         # Environment config
│   │   ├── database.py       # PostgreSQL connection
│   │   ├── models.py         # SQLAlchemy models
│   │   ├── schemas.py        # Pydantic schemas
│   │   ├── routes/
│   │   │   ├── reviews.py    # POST /reviews
│   │   │   └── admin.py      # GET /admin/*
│   │   ├── services/
│   │   │   ├── llm_service.py    # OpenAI integration
│   │   │   └── review_service.py # Business logic
│   │   └── middleware/
│   │       └── rate_limit.py # Rate limiting
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx    # Root layout
    │   │   ├── page.tsx      # User Dashboard
    │   │   ├── admin/
    │   │   │   └── page.tsx  # Admin Dashboard
    │   │   └── globals.css
    │   ├── components/
    │   │   ├── ui/           # shadcn/ui components
    │   │   ├── review-form.tsx
    │   │   ├── star-rating.tsx
    │   │   └── loading.tsx
    │   └── lib/
    │       ├── api.ts        # API client
    │       └── utils.ts
    ├── package.json
    └── tailwind.config.ts
```

## 🚀 Deployment

### Backend (Render/Railway/Fly.io)

1. Set environment variables:
   - `DATABASE_URL`
   - `OPENAI_API_KEY`
   - `RATE_LIMIT_REQUESTS=10`
   - `RATE_LIMIT_WINDOW=60`
   - `LLM_TIMEOUT_SECONDS=30`

2. Deploy command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Frontend (Vercel)

1. Set environment variable:
   - `NEXT_PUBLIC_API_URL=https://your-backend-url.com`

2. Deploy via Vercel CLI or GitHub integration

### Database (Supabase/Neon)

1. Create a PostgreSQL database
2. Get connection string (use `postgresql+asyncpg://` prefix for backend)
3. Tables auto-create on first backend startup

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```env
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/db
OPENAI_API_KEY=sk-...
RATE_LIMIT_REQUESTS=10
RATE_LIMIT_WINDOW=60
LLM_TIMEOUT_SECONDS=30
LLM_MODEL=gpt-4o-mini
```

**Frontend (.env.local)**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## ✅ Testing

### Manual Testing

1. **Submit Reviews**: Test various ratings and text lengths
2. **Admin View**: Verify all data appears with correct status
3. **Rate Limiting**: Submit 11 requests rapidly
4. **Error Handling**: Disconnect database, verify graceful failure

### Health Check

```bash
curl http://localhost:8000/health
```

## 📜 License

MIT
