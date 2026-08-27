# Deployment Guide

## Frontend — Vercel

1. Push the `frontend/` folder to GitHub
2. Import repo in Vercel dashboard → set **Root Directory** to `frontend`
3. Add all `NEXT_PUBLIC_*` environment variables
4. Deploy

## Backend — Railway

1. Create new Railway project
2. Add service from GitHub (`backend/` directory)
3. Add **Redis** plugin from Railway marketplace
4. Set env vars (copy from `.env.example`)
5. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add **Celery Worker** service: `celery -A tasks.celery_app worker --loglevel=info -Q video_processing`
7. Add **Celery Beat** service: `celery -A tasks.celery_app beat --loglevel=info`

## Cloudflare R2 Setup

1. Create R2 bucket named `viralclip-videos`
2. Apply lifecycle rules: Dashboard → R2 → bucket → Settings → Lifecycle
   - Copy rules from `infrastructure/r2-lifecycle-rules.json`
3. Create API token with Object Read + Write permissions
4. (Optional) Add custom domain for public URL

## Firebase Setup

1. Create Firebase project at console.firebase.google.com
2. Enable **Authentication** providers: Google, Email/Password, Phone
3. Create **Firestore** database (production mode)
4. Apply security rules from `infrastructure/firebase-rules/firestore.rules`
5. Generate **Admin SDK** service account key → Project Settings → Service Accounts
6. Add the JSON key values to backend `.env`

## Local Development

```bash
# 1. Start Redis + backend services
docker-compose up -d

# 2. Frontend
cd frontend
npm install
npm run dev       # → http://localhost:3000

# 3. Backend (without Docker)
cd backend
pip install -r requirements.txt
uvicorn main:app --reload   # → http://localhost:8000/docs
```
