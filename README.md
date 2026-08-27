# ViralClip AI 🎬

> **AI-powered web app that converts long videos into viral 9:16 Shorts in seconds.**
>
> Smart face-tracking crop · Dynamic zoom on keywords · Hinglish / Hindi / English captions · Auto music balancing · Watermark for free users · 3 free trial credits

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Folder Structure](#2-folder-structure)
3. [Tech Stack](#3-tech-stack)
4. [Core AI Pipeline](#4-core-ai-pipeline)
5. [Business Logic](#5-business-logic)
6. [Frontend — Next.js + Tailwind](#6-frontend--nextjs--tailwind)
7. [Backend — FastAPI + Celery](#7-backend--fastapi--celery)
8. [Getting Started (Local Dev)](#8-getting-started-local-dev)
9. [Environment Variables Reference](#9-environment-variables-reference)
10. [Deployment Notes](#10-deployment-notes)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   Browser / Client                   │
│  Next.js 14 (App Router) · Tailwind CSS · Dark Neon │
└────────────────┬───────────────────────┬────────────┘
                 │ Firebase Auth (JWT)   │ Firestore real-time
                 ▼                       ▼
┌───────────────────────┐    ┌────────────────────────┐
│   FastAPI Backend     │    │     Firebase            │
│  (Python 3.11+)       │───▶│  Auth + Firestore DB   │
│  /api/v1/upload       │    └────────────────────────┘
│  /api/v1/jobs/:id     │
│  /api/v1/admin/*      │
└───────────┬───────────┘
            │ Celery task
            ▼
┌───────────────────────┐    ┌────────────────────────┐
│  Celery Worker        │───▶│  Cloudflare R2          │
│  AI Pipeline (9 steps)│    │  (S3-compatible, zero  │
│  + Celery Beat (cron) │    │   egress cost)          │
└───────────────────────┘    └────────────────────────┘
            │
            ▼ (broker)
       Redis 7
```

---

## 2. Folder Structure

```
viralclip-ai/
├── .env.example                     # Root env template
├── docker-compose.yml               # Redis + Backend + Celery Worker + Beat
│
├── frontend/                        # Next.js 14 App
│   ├── app/
│   │   ├── layout.tsx               # Root layout (Inter font, Toaster)
│   │   ├── page.tsx                 # Homepage: hero + upload UI
│   │   ├── dashboard/
│   │   │   └── page.tsx             # User dashboard (Firestore real-time)
│   │   └── shorts/
│   │       └── [jobId]/
│   │           └── page.tsx         # Video result & download page
│   ├── components/
│   │   ├── hero/
│   │   │   ├── HeroSection.tsx      # Animated hero with Framer Motion
│   │   │   └── FeaturePills.tsx     # Scrolling feature pills
│   │   ├── upload/
│   │   │   ├── VideoDropzone.tsx    # react-dropzone with neon styling
│   │   │   ├── CaptionToggle.tsx    # Hinglish / Hindi / English toggle
│   │   │   └── UploadProgress.tsx   # Multi-stage progress bar
│   │   ├── auth/
│   │   │   └── AuthModal.tsx        # Google / Email / OTP sign-in modal
│   │   ├── dashboard/
│   │   │   ├── CreditCounter.tsx    # Credit badge in navbar
│   │   │   ├── JobCard.tsx          # Individual job card with status
│   │   │   └── JobGrid.tsx          # Responsive job grid
│   │   └── ui/
│   │       ├── Button.tsx           # Reusable neon button variants
│   │       ├── GlowCard.tsx         # Card with neon glow border
│   │       └── NeonBadge.tsx        # Coloured status badge
│   ├── hooks/
│   │   ├── useAuth.ts               # Firebase auth + user hydration
│   │   ├── useCredits.ts            # Real-time Firestore credit listener
│   │   └── useJobStatus.ts          # Polling job status hook
│   ├── lib/
│   │   ├── firebase.ts              # Firebase app singleton
│   │   └── api.ts                   # Axios API client with JWT interceptor
│   ├── styles/
│   │   └── globals.css              # Tailwind + neon utility classes
│   ├── tailwind.config.ts           # Neon theme colours & animations
│   └── next.config.ts
│
├── backend/                         # FastAPI + Celery
│   ├── main.py                      # FastAPI app, CORS, routers, health
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── routers/
│   │   ├── upload.py                # POST /api/v1/upload (full pipeline trigger)
│   │   ├── jobs.py                  # GET /api/v1/jobs/:id, /users/me/credits
│   │   └── admin.py                 # POST /api/v1/admin/cleanup (secret-gated)
│   ├── services/
│   │   ├── r2_service.py            # Cloudflare R2 (boto3 S3-compatible)
│   │   ├── credit_service.py        # Atomic Firestore credit transactions
│   │   ├── anti_spam_service.py     # IP + Device ID fingerprinting
│   │   └── watermark_service.py     # FFmpeg drawtext watermark
│   ├── ai/
│   │   ├── transcriber.py           # Whisper (Hinglish / Hindi / English)
│   │   ├── hook_extractor.py        # NLP sliding-window viral hook scorer
│   │   ├── face_tracker.py          # MediaPipe → FFmpeg 9:16 smart crop
│   │   ├── zoom_engine.py           # FFmpeg zoompan on keyword moments
│   │   ├── caption_renderer.py      # FFmpeg drawtext + context-aware emojis
│   │   └── music_balancer.py        # librosa + FFmpeg amix ducking
│   ├── tasks/
│   │   ├── celery_app.py            # Celery config + Beat schedule (2 AM cleanup)
│   │   ├── process_video.py         # Master 9-step AI Celery task
│   │   └── cleanup.py              # Daily expired-video cleanup task
│   ├── models/
│   │   ├── schemas.py               # Pydantic v2 request/response schemas
│   │   └── job_status.py            # Job status enum helpers
│   ├── middleware/
│   │   └── rate_limiter.py          # SlowAPI rate limiter singleton
│   ├── utils/
│   │   └── firebase_auth.py         # Firebase Admin JWT verification
│   └── assets/
│       └── music/                   # Drop .mp3/.wav files here for BG music
│
└── infrastructure/
    ├── firebase-rules/
    │   ├── firestore.rules          # Firestore security rules
    │   └── storage.rules            # Firebase Storage (locked — using R2)
    ├── cron/
    │   └── cleanup_cron.sh          # System-level cleanup cron (fallback)
    └── r2-lifecycle-rules.json      # R2 Object Lifecycle config (7-day auto-delete)
```

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, TypeScript |
| Styling | Tailwind CSS v3 — custom Dark Neon theme (`#121212`) |
| Animations | Framer Motion |
| Auth | Firebase Auth (Google, Email, Phone/OTP) |
| Database | Firebase Firestore (jobs, users, anti-spam fingerprints) |
| Video Storage | Cloudflare R2 — zero egress cost |
| Backend | Python FastAPI + Uvicorn |
| Task Queue | Celery + Redis |
| AI — Speech | OpenAI Whisper (`medium` model) |
| AI — Vision | MediaPipe Face Detection |
| Video Processing | FFmpeg (crop, zoom, captions, watermark, music) |
| Music Analysis | librosa |

---

## 4. Core AI Pipeline

Each uploaded video goes through a **9-step Celery pipeline**:

```
Step 1  Download from R2          → input.mp4
Step 2  Whisper Transcription     → word-level timestamps (Hinglish/Hindi/English)
Step 3  Hook Extraction           → best 15–60s viral segment (NLP scoring)
Step 4  Face-Tracking 9:16 Crop  → MediaPipe face detection → FFmpeg crop filter
Step 5  Dynamic Zoom             → FFmpeg zoompan on HIGH_ENERGY_WORDS timestamps
Step 6  Caption Rendering        → FFmpeg drawtext + context-aware animated emojis
Step 7  Music Balancing          → FFmpeg amix with 15% duck on background music
Step 8  Watermark (free users)   → FFmpeg drawtext bottom-right "ViralClip AI"
Step 9  Upload to R2 + Firestore → presigned download URL, 7-day expiry set
```

### Hinglish Caption Logic

- **Hinglish (default):** Whisper guided with a `initial_prompt` instructing it to romanise Hindi words into English alphabet. Produces natural code-mixed Hinglish output.
- **Hindi:** Whisper runs with `language="hi"` — full Devanagari output.
- **English:** Whisper runs with `task="translate"` — translates to English.

---

## 5. Business Logic

### Credits & Plans

| Plan | Credits | Watermark | Price |
|---|---|---|---|
| Free Trial | 3 (one-time) | ✅ Yes | Free |
| Paid | Unlimited / Top-up | ❌ No | TBD |

- 1 generated short = 1 credit consumed
- Credits are deducted **atomically** via Firestore transaction before processing starts
- Credits are **automatically refunded** if the pipeline fails

### Anti-Spam (Trial Abuse Prevention)

| Check | Limit |
|---|---|
| Free accounts per IP | 2 |
| Free accounts per Device ID | 1 |
| Uploads per IP per day | 10 |

Device ID is a `crypto.randomUUID()` stored in `localStorage` and sent with every upload request.

### Auto-Delete (R2 Storage)

- Completed videos expire **7 days** after creation
- Celery Beat runs `cleanup_expired_videos` daily at **2:00 AM UTC**
- Cleanup marks Firestore jobs as `expired`, deletes R2 objects in batch
- Fallback: `infrastructure/cron/cleanup_cron.sh` can be run from system cron

---

## 6. Frontend — Next.js + Tailwind

### Dark Neon Theme

```
Base background:    #121212
Surface:            #1E1E1E
Surface raised:     #2A2A2A
Neon Purple:        #A855F7
Neon Blue:          #3B82F6
Neon Pink:          #EC4899
Neon Green:         #10B981
```

### Key Pages

| Route | Description |
|---|---|
| `/` | Hero section + video upload dropzone + caption toggle |
| `/dashboard` | User's shorts history with real-time Firestore listener |
| `/shorts/[jobId]` | Job progress tracker + video preview + download button |

### Caption Language Toggle

Located above the upload dropzone. Three-option pill toggle:
- 🇮🇳 **Hinglish** (default) — Hindi romanised in English letters
- 🔠 **Hindi** — pure Devanagari script
- 🇬🇧 **English** — full English translation

---

## 7. Backend — FastAPI + Celery

### API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/upload` | Firebase JWT | Upload video, trigger AI pipeline |
| `GET` | `/api/v1/jobs/{job_id}` | Firebase JWT | Poll job status & progress |
| `GET` | `/api/v1/users/me/credits` | Firebase JWT | Get credit balance |
| `POST` | `/api/v1/admin/cleanup` | Admin Secret | Manually trigger cleanup |
| `GET` | `/api/v1/admin/stats` | Admin Secret | System statistics |
| `GET` | `/health` | None | Health check (Redis + Firebase) |

### Rate Limits

| Endpoint | Limit |
|---|---|
| `/upload` | 5 requests/minute per IP |
| `/jobs/:id` | 60 requests/minute per IP |
| `/users/me/credits` | 30 requests/minute per IP |

---

## 8. Getting Started (Local Dev)

### Prerequisites

- Node.js 18+, pnpm / npm
- Python 3.11+
- Docker + Docker Compose (for Redis)
- FFmpeg installed on system PATH
- Firebase project with Auth + Firestore enabled
- Cloudflare R2 bucket

### 1. Clone & Setup

```bash
git clone https://github.com/yourorg/viralclip-ai.git
cd viralclip-ai

# Copy root env
cp .env.example .env
# Fill in all values in .env
```

### 2. Start Redis (Docker)

```bash
docker compose up redis -d
```

### 3. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Run FastAPI dev server
uvicorn main:app --reload --port 8000

# In another terminal — Celery worker
celery -A tasks.celery_app worker --loglevel=info -Q video_processing

# In another terminal — Celery Beat (cleanup scheduler)
celery -A tasks.celery_app beat --loglevel=info
```

### 4. Frontend

```bash
cd frontend
cp .env.local.example .env.local
# Fill in Firebase config vars
npm install
npm run dev
# → http://localhost:3000
```

### 5. Background Music (Optional)

Drop `.mp3` or `.wav` royalty-free music files into `backend/assets/music/`. The music balancer auto-picks the first file found.

---

## 9. Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `FIREBASE_ADMIN_PROJECT_ID` | Firebase project ID |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Service account email |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Service account private key (with `\n`) |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret |
| `R2_BUCKET_NAME` | R2 bucket name (default: `viralclip-videos`) |
| `R2_PUBLIC_URL` | Custom domain for R2 public access |
| `REDIS_URL` | Redis connection URL |
| `ADMIN_SECRET` | Secret for admin endpoints |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins |
| `WHISPER_MODEL` | Whisper model size (`tiny`/`base`/`medium`/`large`) |
| `WATERMARK_TEXT` | Watermark text (default: `ViralClip AI`) |
| `FREE_TRIAL_CREDITS` | Free credits for new users (default: `3`) |
| `VIDEO_EXPIRY_DAYS` | Days before auto-delete (default: `7`) |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |
| `NEXT_PUBLIC_API_URL` | Backend URL (default: `http://localhost:8000`) |

---

## 10. Deployment Notes

### Backend (Docker)

```bash
docker compose up --build -d
```

Runs: `redis`, `backend` (FastAPI on port 8000), `celery-worker`, `celery-beat`.

### Frontend (Vercel)

```bash
cd frontend
vercel deploy
```

Set all `NEXT_PUBLIC_*` environment variables in the Vercel dashboard.

### Firebase Security Rules

Deploy Firestore and Storage rules:
```bash
firebase deploy --only firestore:rules,storage
```

### Cloudflare R2 Lifecycle

Apply `infrastructure/r2-lifecycle-rules.json` via the Cloudflare dashboard or `wrangler` CLI as a backup auto-delete policy (in addition to the app-level cleanup).

### Whisper Model Recommendations

| Use Case | Model | VRAM | Notes |
|---|---|---|---|
| Development | `tiny` / `base` | < 1 GB | Fast, lower accuracy |
| Production | `medium` | ~5 GB | Best Hinglish performance |
| Premium | `large-v3` | ~10 GB | Maximum accuracy |

---

*Built with ❤️ using Google Antigravity AI*
