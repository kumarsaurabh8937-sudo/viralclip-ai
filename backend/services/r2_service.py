"""Cloudflare R2 storage service — boto3 S3-compatible API."""

from __future__ import annotations

import logging
import os
from pathlib import Path

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

BUCKET      = os.getenv("R2_BUCKET_NAME", "viralclip-videos")
PUBLIC_URL  = os.getenv("R2_PUBLIC_URL", "")

def _client():
    account_id = os.getenv("R2_ACCOUNT_ID", "")
    return boto3.client(
        "s3",
        endpoint_url=f"https://{account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=os.getenv("R2_ACCESS_KEY_ID", ""),
        aws_secret_access_key=os.getenv("R2_SECRET_ACCESS_KEY", ""),
        config=Config(signature_version="s3v4", retries={"max_attempts": 3, "mode": "adaptive"}),
        region_name="auto",
    )

_r2 = None
def get_client():
    global _r2
    if _r2 is None:
        _r2 = _client()
    return _r2


class R2Service:
    @staticmethod
    def upload_file(local_path: str | Path, key: str, content_type: str = "video/mp4") -> str:
        local_path = Path(local_path)
        logger.info(f"R2 upload: {local_path.name} → {key}")
        with open(local_path, "rb") as f:
            get_client().upload_fileobj(
                f, BUCKET, key,
                ExtraArgs={"ContentType": content_type},
            )
        return f"{PUBLIC_URL.rstrip('/')}/{key}" if PUBLIC_URL else f"r2://{BUCKET}/{key}"

    @staticmethod
    def presigned_url(key: str, expiry: int = 3600) -> str:
        try:
            return get_client().generate_presigned_url(
                "get_object",
                Params={"Bucket": BUCKET, "Key": key},
                ExpiresIn=expiry,
            )
        except ClientError as e:
            logger.error(f"Presigned URL failed for {key}: {e}")
            raise

    @staticmethod
    def delete_object(key: str) -> bool:
        try:
            get_client().delete_object(Bucket=BUCKET, Key=key)
            logger.info(f"Deleted R2: {key}")
            return True
        except ClientError as e:
            logger.error(f"Delete failed {key}: {e}")
            return False

    @staticmethod
    def delete_objects(keys: list[str]) -> int:
        if not keys:
            return 0
        try:
            resp = get_client().delete_objects(
                Bucket=BUCKET,
                Delete={"Objects": [{"Key": k} for k in keys], "Quiet": True},
            )
            errors = resp.get("Errors", [])
            return len(keys) - len(errors)
        except ClientError as e:
            logger.error(f"Batch delete failed: {e}")
            return 0

    @staticmethod
    def size_mb(key: str) -> float:
        try:
            head = get_client().head_object(Bucket=BUCKET, Key=key)
            return head["ContentLength"] / (1024 * 1024)
        except ClientError:
            return 0.0


r2 = R2Service()
