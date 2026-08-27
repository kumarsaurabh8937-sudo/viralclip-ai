"""Anti-spam service — blocks multi-account trial abuse via IP & device tracking."""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from firebase_admin import firestore

logger = logging.getLogger(__name__)

MAX_ACCOUNTS_PER_IP     = 2
MAX_ACCOUNTS_PER_DEVICE = 1
MAX_UPLOADS_PER_IP_DAY  = 10


class AntiSpamService:
    @staticmethod
    def _db():
        return firestore.client()

    @classmethod
    def check_and_register(cls, uid: str, ip: str, device_id: str) -> tuple[bool, str]:
        db       = cls._db()
        ip_key   = ip.replace(".", "_").replace(":", "_")
        ip_ref   = db.collection("fingerprints").document(f"ip_{ip_key}")
        dev_ref  = db.collection("fingerprints").document(f"device_{device_id[:64]}")
        ip_doc   = ip_ref.get()
        dev_doc  = dev_ref.get()

        if ip_doc.exists:
            uids = ip_doc.to_dict().get("uids", [])
            if uid not in uids and len(uids) >= MAX_ACCOUNTS_PER_IP:
                return False, "Too many free accounts from this IP address."

        if dev_doc.exists:
            uids = dev_doc.to_dict().get("uids", [])
            if uid not in uids and len(uids) >= MAX_ACCOUNTS_PER_DEVICE:
                return False, "Free trial already used on this device."

        cls._register(ip_ref,  ip_doc,  uid, ip)
        cls._register(dev_ref, dev_doc, uid, device_id)
        return True, "ok"

    @staticmethod
    def _register(ref, doc, uid: str, identifier: str) -> None:
        now = datetime.now(timezone.utc)
        if doc.exists:
            uids = doc.to_dict().get("uids", [])
            if uid not in uids:
                ref.update({"uids": firestore.ArrayUnion([uid]), "last_seen": now})
        else:
            ref.set({"identifier": identifier, "uids": [uid], "created_at": now, "last_seen": now})

    @classmethod
    def track_upload(cls, uid: str, ip: str) -> tuple[bool, str]:
        db    = cls._db()
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        key   = ip.replace(".", "_").replace(":", "_")
        ref   = db.collection("upload_attempts").document(f"{key}_{today}")
        doc   = ref.get()

        if doc.exists:
            if doc.to_dict().get("count", 0) >= MAX_UPLOADS_PER_IP_DAY:
                return False, "Daily upload limit reached for this IP."
            ref.update({"count": firestore.Increment(1), "last_attempt": datetime.now(timezone.utc)})
        else:
            ref.set({"count": 1, "ip": ip, "date": today, "last_attempt": datetime.now(timezone.utc)})

        return True, "ok"


anti_spam = AntiSpamService()
