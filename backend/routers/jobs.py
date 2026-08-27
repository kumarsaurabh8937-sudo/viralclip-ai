"""Job status + credits routers."""

from __future__ import annotations

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from middleware.rate_limiter import limiter
from models.schemas import CaptionLanguage, CreditBalance, JobStatusEnum, JobStatusResponse
from services.credit_service import credits as credit_svc
from services.r2_service import r2
from utils.firebase_auth import verify_firebase_token

logger   = logging.getLogger(__name__)
router   = APIRouter()
security = HTTPBearer()


async def get_current_user(creds: Annotated[HTTPAuthorizationCredentials, Depends(security)]) -> dict:
    decoded = await verify_firebase_token(creds.credentials)
    if not decoded:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token.")
    return decoded


@router.get("/jobs/{job_id}", response_model=JobStatusResponse, summary="Get job status")
@limiter.limit("60/minute")
async def get_job_status(
    request: Request,
    job_id: str,
    current_user: dict = Depends(get_current_user),
) -> JobStatusResponse:
    uid = current_user["uid"]

    from firebase_admin import firestore as fs
    db  = fs.client()
    doc = db.collection("jobs").document(job_id).get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found.")

    data = doc.to_dict()
    if data.get("userId") != uid:
        raise HTTPException(status_code=403, detail="Access denied.")

    output_url = None
    if data.get("status") == "completed" and data.get("outputR2Key"):
        try:
            output_url = r2.presigned_url(data["outputR2Key"], expiry=3600)
        except Exception as e:
            logger.warning(f"Presigned URL failed for {job_id}: {e}")

    return JobStatusResponse(
        job_id=job_id,
        status=JobStatusEnum(data.get("status", "queued")),
        progress=data.get("progress", 0),
        step=data.get("step"),
        output_url=output_url,
        thumbnail_url=data.get("thumbnailUrl"),
        expires_at=data.get("expiresAt"),
        duration=data.get("duration"),
        filename=data.get("filename", "video.mp4"),
        caption_language=CaptionLanguage(data.get("captionLanguage", "hinglish")),
        created_at=data["createdAt"],
        error_message=data.get("errorMessage"),
    )


@router.get("/users/me/credits", response_model=CreditBalance, summary="Get credit balance")
@limiter.limit("30/minute")
async def get_credits(
    request: Request,
    current_user: dict = Depends(get_current_user),
) -> CreditBalance:
    try:
        bal = credit_svc.get_balance(current_user["uid"])
        return CreditBalance(**bal)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
