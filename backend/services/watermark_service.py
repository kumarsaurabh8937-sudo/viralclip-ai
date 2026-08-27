"""FFmpeg watermark overlay for free-tier users."""

from __future__ import annotations

import logging
import os
import subprocess
from pathlib import Path

logger = logging.getLogger(__name__)
WATERMARK_TEXT = os.getenv("WATERMARK_TEXT", "ViralClip AI")


class WatermarkService:
    @staticmethod
    def apply(input_path: str | Path, output_path: str | Path,
              text: str = WATERMARK_TEXT, opacity: float = 0.65) -> Path:
        input_path  = Path(input_path)
        output_path = Path(output_path)

        drawtext = (
            f"drawtext=text='{text}'"
            f":fontsize=28:fontcolor=white@{opacity}"
            f":x=w-tw-20:y=h-th-20"
            f":box=1:boxcolor=black@{opacity * 0.5}:boxborderw=8"
        )

        cmd = [
            "ffmpeg", "-i", str(input_path),
            "-vf", drawtext,
            "-codec:a", "copy",
            "-preset", "fast", "-crf", "23",
            "-y", str(output_path),
        ]

        logger.info(f"Applying watermark: {input_path.name}")
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise RuntimeError(f"Watermark FFmpeg error: {result.stderr[-400:]}")
        return output_path


watermark_service = WatermarkService()
