"""Firebase JWT verification — server-side only."""

from __future__ import annotations

import logging
import os
from functools import lru_cache
from typing import Optional

from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def _init_firebase():
    import firebase_admin
    from firebase_admin import credentials

    if firebase_admin._apps:
        return firebase_admin.get_app()

    private_key = os.getenv("FIREBASE_ADMIN_PRIVATE_KEY", "").replace("\\n", "\n")

    cred = credentials.Certificate({
        "type": "service_account",
        "project_id":   os.getenv("FIREBASE_ADMIN_PROJECT_ID", ""),
        "private_key_id": os.getenv("FIREBASE_ADMIN_PRIVATE_KEY_ID", "key"),
        "private_key":  private_key,
        "client_email": os.getenv("FIREBASE_ADMIN_CLIENT_EMAIL", ""),
        "client_id":    "",
        "auth_uri":     "https://accounts.google.com/o/oauth2/auth",
        "token_uri":    "https://oauth2.googleapis.com/token",
    })
    return firebase_admin.initialize_app(cred)


try:
    _init_firebase()
except Exception as e:
    logger.warning(f"Firebase init deferred: {e}")


async def verify_firebase_token(token: str) -> Optional[dict]:
    """Verify a Firebase ID token. Returns decoded claims or None."""
    try:
        from firebase_admin import auth
        return auth.verify_id_token(token, check_revoked=True)
    except Exception as e:
        logger.debug(f"Token verification failed: {e}")
        return None
