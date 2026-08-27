"""Admin router — protected by X-Admin-Secret header."""

from __future__ import annotations

import logging
import os
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Security
from fastapi.security import APIKeyHeader

from models.schemas import CleanupResponse
from tasks.cleanup import trigger_cleanup

logger       = logging.getLogger(__name__)
router       = APIRouter()
ADMIN_SECRET = os.getenv("ADMIN_SECRET", "")
_key_header  = APIKeyHeader(name="X-Admin-Secret", auto_error=False)


def _verify_admin(key: str = Security(_key_header)) -> str:
    if not ADMIN_SECRET or key != ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Invalid admin secret.")
    return key


@router.post("/admin/cleanup", response_model=CleanupResponse, summary="Trigger expired video cleanup")
async def cleanup(_: str = Security(_verify_admin)) -> CleanupResponse:
    logger.info("Admin: triggering cleanup")
    try:
        result = trigger_cleanup()
        return CleanupResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cleanup failed: {e}")


@router.get("/admin/stats", summary="System statistics")
async def stats(_: str = Security(_verify_admin)) -> dict:
    from firebase_admin import firestore as fs
    db = fs.client()
    total      = sum(1 for _ in db.collection("jobs").stream())
    completed  = sum(1 for _ in db.collection("jobs").where("status", "==", "completed").stream())
    processing = sum(1 for _ in db.collection("jobs").where("status", "==", "processing").stream())
    return {
        "total_jobs": total,
        "completed_jobs": completed,
        "processing_jobs": processing,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
