"""Job status and processing step definitions."""

from enum import Enum


class JobStatus(str, Enum):
    QUEUED     = "queued"
    PROCESSING = "processing"
    COMPLETED  = "completed"
    FAILED     = "failed"
    EXPIRED    = "expired"


class ProcessingStep(str, Enum):
    DOWNLOADING      = "Downloading video…"
    TRANSCRIBING     = "Transcribing audio with Whisper…"
    EXTRACTING_HOOK  = "Analysing best viral hook segment…"
    FACE_TRACKING    = "Smart face-tracking crop to 9:16…"
    ZOOM_APPLYING    = "Applying dynamic keyword zoom…"
    CAPTION_RENDERING = "Rendering animated captions…"
    MUSIC_BALANCING  = "Balancing background music…"
    WATERMARKING     = "Applying watermark overlay…"
    UPLOADING        = "Uploading to secure storage…"
    DONE             = "Completed!"


STEP_PROGRESS: dict[ProcessingStep, int] = {
    ProcessingStep.DOWNLOADING:       5,
    ProcessingStep.TRANSCRIBING:      15,
    ProcessingStep.EXTRACTING_HOOK:   25,
    ProcessingStep.FACE_TRACKING:     40,
    ProcessingStep.ZOOM_APPLYING:     55,
    ProcessingStep.CAPTION_RENDERING: 68,
    ProcessingStep.MUSIC_BALANCING:   78,
    ProcessingStep.WATERMARKING:      88,
    ProcessingStep.UPLOADING:         95,
    ProcessingStep.DONE:              100,
}
