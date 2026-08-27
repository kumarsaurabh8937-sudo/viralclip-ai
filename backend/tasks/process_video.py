"""Master Celery task — runs the full 9-step AI video processing pipeline."""

from __future__ import annotations

import logging
import os
import shutil
import tempfile
from datetime import datetime, timedelta, timezone
from pathlib import Path

from tasks.celery_app import celery_app

logger = logging.getLogger(__name__)
TMP_ROOT = Path(os.getenv("TMP_DIR", "/tmp/viralclip"))


def _update_job(job_id: str, **fields) -> None:
    """Update Firestore job document."""
    from firebase_admin import firestore as fs
    fs.client().collection("jobs").document(job_id).update(fields)


@celery_app.task(
    bind=True,
    name="tasks.process_video.process_video_task",
    max_retries=2,
    default_retry_delay=30,
)
def process_video_task(
    self,
    job_id: str,
    uid: str,
    input_r2_key: str,
    caption_language: str = "hinglish",
) -> dict:
    """
    Full AI pipeline:
      1. Download from R2
      2. Whisper transcription
      3. Hook extraction
      4. Face-tracking 9:16 crop
      5. Dynamic zoom
      6. Caption rendering
      7. Music balancing
      8. Watermark (free users)
      9. Upload to R2 + update Firestore
    """
    tmp_dir = TMP_ROOT / job_id
    tmp_dir.mkdir(parents=True, exist_ok=True)

    try:
        # ── Imports ────────────────────────────────────────────────────────────
        from services.r2_service       import r2
        from services.credit_service   import credits as credit_svc
        from services.watermark_service import watermark_service
        from ai.transcriber            import transcribe
        from ai.hook_extractor         import extract_hook
        from ai.face_tracker           import crop_to_vertical
        from ai.zoom_engine            import apply_zoom
        from ai.caption_renderer       import render_captions
        from ai.music_balancer         import balance_music

        _update_job(job_id, status="processing", progress=5, step="Downloading video…")

        # Step 1 — Download from R2
        input_video = tmp_dir / "input.mp4"
        from services.r2_service import BUCKET, get_client
        get_client().download_file(BUCKET, input_r2_key, str(input_video))
        logger.info(f"[{job_id}] Downloaded: {input_video}")

        # Step 2 — Transcribe
        _update_job(job_id, progress=15, step="Transcribing audio with Whisper…")
        transcript = transcribe(input_video, language=caption_language)
        words = transcript["words"]

        # Step 3 — Extract hook
        _update_job(job_id, progress=25, step="Analysing best viral hook…")
        hook = extract_hook(words)
        logger.info(f"[{job_id}] Hook: {hook.start:.1f}s – {hook.end:.1f}s")

        # Step 4 — Face-tracking 9:16 crop
        _update_job(job_id, progress=40, step="Smart face-tracking crop to 9:16…")
        cropped = tmp_dir / "cropped.mp4"
        crop_to_vertical(input_video, cropped, hook.start, hook.end)

        # Step 5 — Dynamic zoom
        _update_job(job_id, progress=55, step="Applying dynamic keyword zoom…")
        zoomed = tmp_dir / "zoomed.mp4"
        hook_words = [w for w in words if hook.start <= w["start"] <= hook.end]
        apply_zoom(cropped, zoomed, hook_words, hook.start)

        # Step 6 — Caption rendering
        _update_job(job_id, progress=68, step="Rendering animated captions…")
        captioned = tmp_dir / "captioned.mp4"
        render_captions(zoomed, captioned, hook_words, hook.start)

        # Step 7 — Music balancing
        _update_job(job_id, progress=78, step="Balancing background music…")
        music_out = tmp_dir / "music.mp4"
        balance_music(captioned, music_out)

        # Step 8 — Watermark for free users
        balance = credit_svc.get_balance(uid)
        final_path = tmp_dir / "final.mp4"

        if not balance["is_paid"]:
            _update_job(job_id, progress=88, step="Applying watermark…")
            watermark_service.apply(music_out, final_path)
        else:
            shutil.copy2(music_out, final_path)

        # Step 9 — Upload to R2
        _update_job(job_id, progress=95, step="Uploading to secure storage…")
        output_r2_key = f"outputs/{uid}/{job_id}.mp4"
        r2.upload_file(final_path, output_r2_key, content_type="video/mp4")

        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        output_url = r2.presigned_url(output_r2_key, expiry=3600)

        _update_job(
            job_id,
            status="completed",
            progress=100,
            step="Completed!",
            outputR2Key=output_r2_key,
            outputUrl=output_url,
            expiresAt=expires_at,
            duration=round(hook.duration),
        )

        logger.info(f"[{job_id}] ✅ Pipeline complete")
        return {"job_id": job_id, "status": "completed"}

    except Exception as exc:
        logger.error(f"[{job_id}] Pipeline failed: {exc}", exc_info=True)
        _update_job(job_id, status="failed", errorMessage=str(exc)[:500])

        # Refund credit on failure
        try:
            from services.credit_service import credits as credit_svc
            credit_svc.refund_credit(uid)
        except Exception:
            pass

        raise self.retry(exc=exc)

    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)
