"""Face-tracking 9:16 crop — MediaPipe face detection → FFmpeg crop filter."""

from __future__ import annotations

import logging
import subprocess
from pathlib import Path

logger = logging.getLogger(__name__)


def crop_to_vertical(
    input_path: str | Path,
    output_path: str | Path,
    start: float,
    end: float,
) -> Path:
    """
    1. Sample frames with OpenCV + MediaPipe to find average face X position.
    2. Build FFmpeg crop=w:h:x:y for 9:16 (width = height * 9/16).
    3. Re-encode with the crop applied.
    """
    input_path  = Path(input_path)
    output_path = Path(output_path)

    try:
        import cv2
        import mediapipe as mp

        cap = cv2.VideoCapture(str(input_path))
        fps = cap.get(cv2.CAP_PROP_FPS) or 30
        W   = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        H   = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        cap.set(cv2.CAP_PROP_POS_MSEC, start * 1000)

        face_x_positions = []
        detector = mp.solutions.face_detection.FaceDetection(min_detection_confidence=0.5)

        sample_frames = 0
        while sample_frames < 30:
            ret, frame = cap.read()
            if not ret:
                break
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = detector.process(rgb)
            if results.detections:
                for det in results.detections:
                    bbox = det.location_data.relative_bounding_box
                    cx   = (bbox.xmin + bbox.width / 2) * W
                    face_x_positions.append(cx)
            sample_frames += 1

        cap.release()
        detector.close()

        avg_x = int(sum(face_x_positions) / len(face_x_positions)) if face_x_positions else W // 2
        crop_w = int(H * 9 / 16)
        crop_x = max(0, min(avg_x - crop_w // 2, W - crop_w))
        crop_filter = f"crop={crop_w}:{H}:{crop_x}:0"

    except Exception as e:
        logger.warning(f"MediaPipe face detection failed ({e}), using centre crop")
        crop_filter = "crop=ih*9/16:ih:(iw-ih*9/16)/2:0"

    duration = end - start
    cmd = [
        "ffmpeg",
        "-ss", str(start),
        "-i", str(input_path),
        "-t", str(duration),
        "-vf", crop_filter,
        "-c:v", "libx264", "-preset", "fast", "-crf", "22",
        "-c:a", "aac", "-b:a", "128k",
        "-y", str(output_path),
    ]

    logger.info(f"Face-tracking crop: {crop_filter} | {start:.1f}s – {end:.1f}s")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg crop error: {result.stderr[-400:]}")

    return output_path
