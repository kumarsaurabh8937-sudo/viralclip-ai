"""
Video upload router — POST /api/v1/upload

Handles:
- Firebase JWT auth verification
- Anti-spam check (IP + Device ID)
- Credit check before processing
- File validation (type + size)
- Upload video to Cloudflare R2
- Credit deduction
- Enqueue Celery processing task
- Firestore job document creation
"""

from __future__ import annotations

import logging
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile, status, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from middleware.rate_limiter import limiter
from models.schemas import CaptionLanguage, JobStatusEnum, UploadResponse
from services.anti_spam_service import anti_spam
from services.credit_service import credits as credit_svc
from services.r2_service import r2, BUCKET, get_client
from utils.firebase_auth import verify_firebase_token

logger = logging.getLogger(__name__)
router = APIRouter()
security = HTTPBearer()

MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024 * 1024  # 2 GB
ALLOWED_CONTENT_TYPES = {
    "video/mp4",
    "video/quicktime",
    "video/x-msvideo",
    "video/webm",
}
TMP_DIR = Path(os.getenv("TMP_DIR", "/tmp/viralclip"))
TMP_DIR.mkdir(parents=True, exist_ok=True)

ESTIMATED_SECONDS_PER_MIN = 45  # rough estimate for progress UX


async def get_current_user(
    creds: Annotated[HTTPAuthorizationCredentials, Depends(security)],
) -> dict:
    decoded = await verify_firebase_token(creds.credentials)
    if not decoded:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token.")
    return decoded


@router.post(
    "/upload",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a video for AI processing",
)
@limiter.limit("5/minute")
async def upload_video(
    request: Request,
    file: UploadFile = File(...),
    caption_language: CaptionLanguage = Form(CaptionLanguage.hinglish),
    device_id: str = Form("unknown"),
    current_user: dict = Depends(get_current_user),
) -> UploadResponse:
    uid = current_user["uid"]
    ip  = request.client.host if request.client else "unknown"

    # ── Anti-spam check ────────────────────────────────────────────────────────
    ok, reason = anti_spam.check_and_register(uid, ip, device_id)
    if not ok:
        raise HTTPException(status_code=429, detail=reason)

    ok, reason = anti_spam.track_upload(uid, ip)
    if not ok:
        raise HTTPException(status_code=429, detail=reason)

    # ── Credit check ───────────────────────────────────────────────────────────
    try:
        if not credit_svc.has_credits(uid):
            raise HTTPException(
                status_code=402,
                detail="Insufficient credits. Please upgrade your plan.",
            )
    except ValueError:
        # User doc doesn't exist yet — initialize with free credits
        credit_svc.initialize_user(uid, current_user.get("email"), current_user.get("name"))

    # ── File validation ────────────────────────────────────────────────────────
    content_type = file.content_type or ""
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type '{content_type}'. Allowed: MP4, MOV, AVI, WebM.",
        )

    job_id  = f"job_{uuid.uuid4().hex}"
    ext     = Path(file.filename or "video.mp4").suffix or ".mp4"
    tmp_path = TMP_DIR / f"{job_id}_input{ext}"

    try:
        content = await file.read()
        if len(content) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="File exceeds 2 GB limit.",
            )
        tmp_path.write_bytes(content)
        logger.info(f"[{job_id}] Temp file saved: {tmp_path}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to save temp file: {e}")
        raise HTTPException(status_code=500, detail="Failed to receive file.")

    # ── Upload to R2 ───────────────────────────────────────────────────────────
    input_r2_key = f"inputs/{uid}/{job_id}{ext}"
    try:
        r2.upload_file(tmp_path, input_r2_key, content_type=content_type)
        logger.info(f"[{job_id}] Uploaded to R2: {input_r2_key}")
    except Exception as e:
        tmp_path.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail=f"Storage upload failed: {e}")
    finally:
        tmp_path.unlink(missing_ok=True)

    # ── Deduct credit ──────────────────────────────────────────────────────────
    try:
        credits_remaining = credit_svc.deduct_credit(uid)
    except ValueError as e:
        raise HTTPException(status_code=402, detail=str(e))

    # ── Create Firestore job document ──────────────────────────────────────────
    try:
        from firebase_admin import firestore as fs
        db = fs.client()
        db.collection("jobs").document(job_id).set({
            "jobId":           job_id,
            "userId":          uid,
            "status":          JobStatusEnum.queued.value,
            "progress":        0,
            "step":            "Queued for processing…",
            "filename":        file.filename or "video.mp4",
            "captionLanguage": caption_language.value,
            "inputR2Key":      input_r2_key,
            "outputR2Key":     None,
            "outputUrl":       None,
            "thumbnailUrl":    None,
            "duration":        None,
            "expiresAt":       None,
            "createdAt":       datetime.now(timezone.utc),
            "errorMessage":    None,
        })
    except Exception as e:
        logger.error(f"[{job_id}] Firestore write failed: {e}")
        # Non-fatal — job can still be enqueued

    # ── Enqueue Celery task ────────────────────────────────────────────────────
    try:
        from tasks.process_video import process_video_task
        process_video_task.apply_async(
            kwargs={
                "job_id":           job_id,
                "uid":              uid,
                "input_r2_key":     input_r2_key,
                "caption_language": caption_language.value,
            },
            queue="video_processing",
        )
        logger.info(f"[{job_id}] Enqueued for processing")
    except Exception as e:
        logger.error(f"[{job_id}] Celery enqueue failed: {e}")
        # Credit refund on enqueue failure
        credit_svc.refund_credit(uid)
        raise HTTPException(status_code=500, detail="Processing queue unavailable. Please try again.")

    # Rough ETA: ~45s per minute of video (unknown at upload time — use 60s default)
    estimated_duration = ESTIMATED_SECONDS_PER_MIN

    return UploadResponse(
        job_id=job_id,
        status=JobStatusEnum.queued,
        credits_remaining=credits_remaining,
        estimated_duration=estimated_duration,
    )
