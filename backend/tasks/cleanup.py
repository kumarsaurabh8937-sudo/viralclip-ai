"""Cleanup task — deletes expired videos from R2 and marks jobs expired in Firestore."""

from __future__ import annotations

import logging
import os
from datetime import datetime, timedelta, timezone

from tasks.celery_app import celery_app

logger = logging.getLogger(__name__)
EXPIRY_DAYS = int(os.getenv("VIDEO_EXPIRY_DAYS", "7"))


def trigger_cleanup() -> dict:
    """Find completed jobs older than EXPIRY_DAYS, delete R2 objects, mark expired."""
    from firebase_admin import firestore as fs
    from services.r2_service import r2

    db     = fs.client()
    cutoff = datetime.now(timezone.utc) - timedelta(days=EXPIRY_DAYS)
    logger.info(f"Cleanup: cutoff = {cutoff.isoformat()}")

    expired = (
        db.collection("jobs")
        .where("status", "==", "completed")
        .where("createdAt", "<", cutoff)
        .stream()
    )

    deleted_count = 0
    freed_mb      = 0.0
    errors        = []
    r2_keys       = []

    for doc in expired:
        data      = doc.to_dict()
        job_id    = doc.id
        out_key   = data.get("outputR2Key")
        in_key    = data.get("inputR2Key")

        for key in [out_key, in_key]:
            if key:
                freed_mb += r2.size_mb(key)
                r2_keys.append(key)

        try:
            doc.reference.update({
                "status":      "expired",
                "outputUrl":   None,
                "outputR2Key": None,
                "expiredAt":   datetime.now(timezone.utc),
            })
            deleted_count += 1
        except Exception as e:
            errors.append(f"Job {job_id}: {e}")
            logger.error(f"Failed to expire {job_id}: {e}")

    if r2_keys:
        r2.delete_objects(r2_keys)

    logger.info(f"Cleanup done: {deleted_count} expired, {freed_mb:.1f} MB freed")
    return {"deleted_count": deleted_count, "freed_storage_mb": round(freed_mb, 2), "errors": errors}


@celery_app.task(name="tasks.cleanup.cleanup_expired_videos")
def cleanup_expired_videos():
    """Celery beat task — runs daily at 2 AM UTC."""
    return trigger_cleanup()
