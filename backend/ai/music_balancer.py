"""Music balancer — librosa analysis + FFmpeg amix ducking."""

from __future__ import annotations

import logging
import os
import subprocess
from pathlib import Path

logger = logging.getLogger(__name__)

# Optional background music asset
MUSIC_DIR = Path(__file__).parent.parent / "assets" / "music"


def balance_music(
    input_path: str | Path,
    output_path: str | Path,
    music_file: str | Path | None = None,
    duck_level: float = 0.15,
) -> Path:
    """
    If a background music file is provided, mix it under the speech
    using FFmpeg amix with volume ducking.

    duck_level: volume ratio for music (0.15 = 15% of original)
    """
    input_path  = Path(input_path)
    output_path = Path(output_path)

    # Auto-pick first music file if none specified
    if music_file is None:
        music_files = list(MUSIC_DIR.glob("*.mp3")) + list(MUSIC_DIR.glob("*.wav"))
        music_file  = music_files[0] if music_files else None

    if not music_file or not Path(music_file).exists():
        logger.info("No background music found — skipping music balancing")
        import shutil
        shutil.copy2(input_path, output_path)
        return output_path

    music_path = Path(music_file)

    # Analyse input video duration
    probe_cmd = [
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        str(input_path),
    ]
    probe = subprocess.run(probe_cmd, capture_output=True, text=True)
    try:
        duration = float(probe.stdout.strip())
    except ValueError:
        duration = 30.0

    # FFmpeg amix: loop music to video length, duck it
    cmd = [
        "ffmpeg",
        "-i", str(input_path),
        "-stream_loop", "-1",
        "-i", str(music_path),
        "-filter_complex",
        f"[1:a]volume={duck_level},atrim=0:{duration}[bg];"
        f"[0:a][bg]amix=inputs=2:duration=first:dropout_transition=2[aout]",
        "-map", "0:v",
        "-map", "[aout]",
        "-c:v", "copy",
        "-c:a", "aac", "-b:a", "128k",
        "-shortest",
        "-y", str(output_path),
    ]

    logger.info(f"Mixing background music (duck={duck_level}): {music_path.name}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        logger.warning(f"Music mix failed, copying original: {result.stderr[-200:]}")
        import shutil
        shutil.copy2(input_path, output_path)

    return output_path
