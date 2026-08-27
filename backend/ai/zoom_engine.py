"""Dynamic zoom — zooms in on high-energy keyword moments via FFmpeg zoompan."""

from __future__ import annotations

import logging
import subprocess
from pathlib import Path

from ai.hook_extractor import HIGH_ENERGY_WORDS

logger = logging.getLogger(__name__)


def apply_zoom(
    input_path: str | Path,
    output_path: str | Path,
    words: list[dict],
    hook_start: float,
    zoom_factor: float = 1.15,
    fps: int = 30,
) -> Path:
    """
    Applies smooth zoom-in / zoom-out on high-energy words using FFmpeg zoompan filter.
    """
    import re

    input_path  = Path(input_path)
    output_path = Path(output_path)

    # Find keyword timestamps (relative to hook start)
    zoom_moments: list[tuple[float, float]] = []
    for w in words:
        clean = re.sub(r"[^\w]", "", w["word"].lower())
        if clean in HIGH_ENERGY_WORDS:
            rel_start = max(0.0, w["start"] - hook_start)
            rel_end   = max(0.0, w["end"]   - hook_start)
            zoom_moments.append((rel_start, rel_end))

    if not zoom_moments:
        # No keywords — gentle constant zoom
        zoom_filter = f"zoompan=z='1.05':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:fps={fps}"
    else:
        # Build zoompan expression that zooms in during keyword windows
        parts = []
        for start_s, end_s in zoom_moments:
            start_f = int(start_s * fps)
            end_f   = int(end_s   * fps)
            parts.append(
                f"if(between(on,{start_f},{end_f}),{zoom_factor},1)"
            )
        zoom_expr = "+".join(parts) if parts else "1"
        # Clamp to [1, zoom_factor]
        zoom_expr = f"min(max(1,{zoom_expr}),{zoom_factor})"
        zoom_filter = (
            f"zoompan=z='{zoom_expr}'"
            f":x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:fps={fps}"
        )

    cmd = [
        "ffmpeg", "-i", str(input_path),
        "-vf", zoom_filter,
        "-c:v", "libx264", "-preset", "fast", "-crf", "22",
        "-c:a", "copy",
        "-y", str(output_path),
    ]

    logger.info(f"Applying zoom on {len(zoom_moments)} keyword moments")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        logger.warning(f"Zoom filter failed, copying original: {result.stderr[-200:]}")
        import shutil
        shutil.copy2(input_path, output_path)

    return output_path
