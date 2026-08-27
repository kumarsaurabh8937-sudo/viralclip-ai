"""Pydantic v2 schemas for ViralClip AI API."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class CaptionLanguage(str, Enum):
    hinglish = "hinglish"
    hindi    = "hindi"
    english  = "english"


class JobStatusEnum(str, Enum):
    queued     = "queued"
    processing = "processing"
    completed  = "completed"
    failed     = "failed"
    expired    = "expired"


class UploadResponse(BaseModel):
    job_id:             str
    status:             JobStatusEnum
    credits_remaining:  int
    estimated_duration: int = Field(description="Estimated seconds to process")


class JobStatusResponse(BaseModel):
    job_id:          str
    status:          JobStatusEnum
    progress:        int = Field(ge=0, le=100)
    step:            Optional[str]      = None
    output_url:      Optional[str]      = None
    thumbnail_url:   Optional[str]      = None
    expires_at:      Optional[datetime] = None
    duration:        Optional[int]      = None
    filename:        str
    caption_language: CaptionLanguage
    created_at:      datetime
    error_message:   Optional[str]      = None


class CreditBalance(BaseModel):
    credits:  int
    is_paid:  bool
    plan:     str


class CleanupResponse(BaseModel):
    deleted_count:   int
    freed_storage_mb: float
    errors:          list[str] = []


class HealthResponse(BaseModel):
    status:            str
    version:           str
    redis_connected:   bool
    firebase_connected: bool
