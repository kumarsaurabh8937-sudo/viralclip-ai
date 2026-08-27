"""Whisper-based audio transcriber — supports Hinglish / Hindi / English output."""

from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Literal

import whisper

logger = logging.getLogger(__name__)
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "medium")

_model = None
def get_model():
    global _model
    if _model is None:
        logger.info(f"Loading Whisper model: {WHISPER_MODEL}")
        _model = whisper.load_model(WHISPER_MODEL)
    return _model


def transcribe(
    audio_path: str | Path,
    language: Literal["hinglish", "hindi", "english"] = "hinglish",
) -> dict:
    """
    Transcribe audio and return word-level timestamps.

    Returns:
        dict with keys: text, segments, words, language
    """
    audio_path = str(audio_path)
    model      = get_model()

    if language == "hinglish":
        # Guide Whisper to romanise Hindi — produces Hinglish naturally
        result = model.transcribe(
            audio_path,
            word_timestamps=True,
            initial_prompt=(
                "The following is a conversation in Hinglish — Hindi words written in "
                "English (Roman) alphabet mixed with English words. Transliterate all "
                "Hindi words into Roman script. Do not use Devanagari."
            ),
        )
    elif language == "hindi":
        result = model.transcribe(audio_path, language="hi", word_timestamps=True)
    else:  # english
        result = model.transcribe(audio_path, task="translate", word_timestamps=True)

    # Flatten word-level timestamps across all segments
    words = []
    for seg in result.get("segments", []):
        for w in seg.get("words", []):
            words.append({
                "word":  w["word"].strip(),
                "start": w["start"],
                "end":   w["end"],
                "prob":  w.get("probability", 1.0),
            })

    logger.info(f"Transcribed {len(words)} words | lang={language}")
    return {
        "text":     result.get("text", "").strip(),
        "segments": result.get("segments", []),
        "words":    words,
        "language": language,
    }
