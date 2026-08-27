"""
ViralClip AI — FastAPI Main Application

Entrypoint for the ViralClip AI backend.
Provides REST API for video upload, job status, credit management,
and admin operations.
"""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from middleware.rate_limiter import limiter
from routers import upload, jobs, admin

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info("🚀 ViralClip AI backend starting up...")
    # Ensure Firebase Admin SDK is initialised at startup
    try:
        from utils.firebase_auth import _init_firebase
        _init_firebase()
        logger.info("✅ Firebase Admin SDK ready")
    except Exception as e:
        logger.warning(f"⚠️  Firebase init deferred: {e}")
    yield
    logger.info("🔴 ViralClip AI backend shutting down...")


app = FastAPI(
    title="ViralClip AI",
    description="""AI-powered video processing API that converts long videos
    into viral 9:16 shorts with smart face-tracking, Hinglish captions,
    dynamic zoom, and background music balancing.""",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── Rate limiter ───────────────────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ───────────────────────────────────────────────────────────────────────
allowed_origins_raw = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
allowed_origins = [o.strip() for o in allowed_origins_raw.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Admin-Secret", "X-Device-ID"],
)

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(upload.router, prefix="/api/v1", tags=["Upload"])
app.include_router(jobs.router,   prefix="/api/v1", tags=["Jobs & Credits"])
app.include_router(admin.router,  prefix="/api/v1", tags=["Admin"])


# ── Root & Health ──────────────────────────────────────────────────────────────
@app.get("/", include_in_schema=False)
async def root():
    return {"message": "ViralClip AI API v1.0.0", "docs": "/docs"}


@app.get("/health", tags=["Health"])
async def health_check() -> dict:
    redis_ok = False
    firebase_ok = False

    try:
        import redis as redis_lib
        r = redis_lib.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"))
        r.ping()
        redis_ok = True
    except Exception:
        pass

    try:
        from firebase_admin import auth as fb_auth
        firebase_ok = True
    except Exception:
        pass

    return {
        "status": "healthy",
        "version": "1.0.0",
        "redis_connected": redis_ok,
        "firebase_connected": firebase_ok,
    }


# ── Global exception handler ───────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please try again."},
    )
