"""Celery app configuration with Redis broker and beat schedule."""

from __future__ import annotations

import os
from celery import Celery
from celery.schedules import crontab

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "viralclip",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["tasks.process_video", "tasks.cleanup"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1,
    worker_concurrency=2,
    task_time_limit=1800,        # 30-minute hard limit per task
    task_soft_time_limit=1500,   # 25-minute soft limit
    task_routes={
        "tasks.process_video.*": {"queue": "video_processing"},
        "tasks.cleanup.*":       {"queue": "celery"},
    },
    beat_schedule={
        "daily-cleanup": {
            "task":     "tasks.cleanup.cleanup_expired_videos",
            "schedule": crontab(hour=2, minute=0),  # 2 AM UTC daily
        },
    },
)
