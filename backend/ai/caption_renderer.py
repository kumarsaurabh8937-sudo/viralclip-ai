"""Caption renderer — FFmpeg drawtext captions with context-aware emoji overlays."""

from __future__ import annotations

import logging
import subprocess
from pathlib import Path

logger = logging.getLogger(__name__)

# Emoji map keyed on keywords (Hinglish + English)
EMOJI_MAP: dict[str, str] = {
    "fire":     "🔥", "kya":    "😮", "bhai":   "💪",
    "amazing":  "🤩", "love":   "❤️",  "money":  "💰",
    "viral":    "📱", "secret": "🤫", "truth":  "💡",
    "crazy":    "😜", "best":   "🏆", "wow":    "🤯",
    "sad":      "😢", "happy":  "😊", "funny":  "😂",
    "yaar":     "🤝", "bata":   "👀", "sach":   "✅",
}

MAX_CHARS_PER_LINE = 35


def _escape(text: str) -> str:
    return text.replace("'", r"\'").replace(":", r"\:")


def render_captions(
    input_path: str | Path,
    output_path: str | Path,
    words: list[dict],
    hook_start: float,
    font_size: int = 48,
) -> Path:
    """
    Render animated word-level captions using FFmpeg drawtext.
    Groups words into ~35-char subtitle lines and overlays emojis
    for keyword words.
    """
    import re
    input_path  = Path(input_path)
    output_path = Path(output_path)

    if not words:
        import shutil
        shutil.copy2(input_path, output_path)
        return output_path

    # Build groups of words into lines
    groups: list[dict] = []
    current_words: list[dict] = []
    current_len = 0

    for w in words:
        wlen = len(w["word"]) + 1
        if current_len + wlen > MAX_CHARS_PER_LINE and current_words:
            line_text  = " ".join(cw["word"] for cw in current_words)
            line_start = current_words[0]["start"] - hook_start
            line_end   = current_words[-1]["end"]  - hook_start
            groups.append({"text": line_text, "start": max(0, line_start), "end": max(0, line_end)})
            current_words = []
            current_len   = 0
        current_words.append(w)
        current_len += wlen

    if current_words:
        line_text  = " ".join(cw["word"] for cw in current_words)
        line_start = current_words[0]["start"] - hook_start
        line_end   = current_words[-1]["end"]  - hook_start
        groups.append({"text": line_text, "start": max(0, line_start), "end": max(0, line_end)})

    # Build drawtext filter chain
    filters = []
    for g in groups:
        esc_text = _escape(g["text"])
        # Detect emoji to append
        words_in_group = g["text"].lower().split()
        emoji = next((EMOJI_MAP[w] for w in words_in_group if w in EMOJI_MAP), "")
        display_text = f"{esc_text} {emoji}" if emoji else esc_text

        filters.append(
            f"drawtext=text='{display_text}'"
            f":fontsize={font_size}"
            f":fontcolor=white"
            f":x=(w-text_w)/2:y=h-th-80"
            f":box=1:boxcolor=black@0.55:boxborderw=12"
            f":enable='between(t,{g['start']:.3f},{g['end']:.3f})'"
        )

    vf = ",".join(filters) if filters else "null"

    cmd = [
        "ffmpeg", "-i", str(input_path),
        "-vf", vf,
        "-c:v", "libx264", "-preset", "fast", "-crf", "22",
        "-c:a", "copy",
        "-y", str(output_path),
    ]

    logger.info(f"Rendering {len(groups)} caption lines")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        logger.warning(f"Caption render failed, copying original: {result.stderr[-200:]}")
        import shutil
        shutil.copy2(input_path, output_path)

    return output_path
