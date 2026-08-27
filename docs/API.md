# ViralClip AI — API Reference

**Base URL**: `http://localhost:8000/api/v1`  
**Auth**: All endpoints require `Authorization: Bearer <Firebase ID Token>`

---

## POST /upload

Upload a video for AI processing.

**Request** — `multipart/form-data`

| Field | Type | Required | Description |
|---|---|---|---|
| `file` | File | ✅ | Video (MP4/MOV/AVI/WebM, max 2GB) |
| `caption_language` | string | ✅ | `hinglish` \| `hindi` \| `english` |
| `device_id` | string | ✅ | Client device fingerprint (min 8 chars) |

**Response** `201 Created`
```json
{
  "job_id": "job_abc123",
  "status": "queued",
  "credits_remaining": 2,
  "estimated_duration": 180
}
```

**Errors**: `401` (auth), `402` (no credits), `413` (file too large), `415` (wrong type), `429` (rate limit / anti-spam)

---

## GET /jobs/{job_id}

Get processing status for a job.

**Response** `200 OK`
```json
{
  "job_id": "job_abc123",
  "status": "processing",
  "progress": 55,
  "step": "Applying dynamic keyword zoom…",
  "output_url": null,
  "expires_at": null,
  "duration": null,
  "filename": "my-video.mp4",
  "caption_language": "hinglish",
  "created_at": "2024-01-15T10:00:00Z"
}
```

**Status values**: `queued` → `processing` → `completed` | `failed` | `expired`

---

## GET /users/me/credits

Get current user credit balance.

**Response** `200 OK`
```json
{ "credits": 2, "is_paid": false, "plan": "free" }
```

---

## POST /admin/cleanup

Trigger expired video cleanup (Admin only).

**Header**: `X-Admin-Secret: <your_admin_secret>`

**Response** `200 OK`
```json
{ "deleted_count": 5, "freed_storage_mb": 1240.5, "errors": [] }
```

---

## GET /health

Health check (no auth required).

**Response** `200 OK`
```json
{ "status": "healthy", "version": "1.0.0", "redis_connected": true, "firebase_connected": true }
```
