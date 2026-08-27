"""Hook extractor — finds the best 15-60s viral segment using NLP scoring."""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass

logger = logging.getLogger(__name__)

# High-energy words (Hinglish + English) that signal viral moments
HIGH_ENERGY_WORDS = {
    "never", "always", "secret", "shocking", "truth", "exposed", "amazing",
    "unbelievable", "crazy", "incredible", "best", "worst", "hack", "viral",
    "bhai", "yaar", "kya", "matlab", "sach", "bata", "dekho", "suno",
    "important", "must", "wait", "stop", "listen", "watch", "know",
}

@dataclass
class HookSegment:
    start:    float
    end:      float
    duration: float
    score:    float
    text:     str


def extract_hook(
    words: list[dict],
    min_dur: float = 15.0,
    max_dur: float = 60.0,
    window_step: float = 1.0,
) -> HookSegment:
    """
    Sliding-window scorer over word-timestamped transcript.
    Returns the best segment between min_dur and max_dur seconds.
    """
    if not words:
        # Fallback: take the start of the video
        return HookSegment(start=0.0, end=min(max_dur, 30.0), duration=min(max_dur, 30.0), score=0.0, text="")

    total_dur = words[-1]["end"]
    best: HookSegment | None = None

    t = 0.0
    while t + min_dur <= total_dur:
        for dur in [15.0, 30.0, 45.0, 60.0]:
            if dur > max_dur:
                continue
            seg_end   = t + dur
            seg_words = [w for w in words if w["start"] >= t and w["end"] <= seg_end]
            if not seg_words:
                continue

            score = _score_segment(seg_words, dur)

            if best is None or score > best.score:
                text = " ".join(w["word"] for w in seg_words)
                best = HookSegment(start=t, end=seg_end, duration=dur, score=score, text=text)

        t += window_step

    if best is None:
        # Last-resort fallback
        end = min(total_dur, max_dur)
        text = " ".join(w["word"] for w in words if w["end"] <= end)
        return HookSegment(start=0.0, end=end, duration=end, score=0.0, text=text)

    logger.info(f"Best hook: {best.start:.1f}s – {best.end:.1f}s (score={best.score:.2f})")
    return best


def _score_segment(words: list[dict], duration: float) -> float:
    score = 0.0
    for w in words:
        clean = re.sub(r"[^\w]", "", w["word"].lower())
        if clean in HIGH_ENERGY_WORDS:
            score += 2.0
        # Reward high-confidence words
        score += w.get("prob", 1.0) * 0.1
        # Prefer faster speech (more words per second = higher energy)
    wps = len(words) / max(duration, 1.0)
    score += min(wps * 0.5, 3.0)
    return score
