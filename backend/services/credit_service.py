"""Credit management — all writes via Firebase Admin SDK (server-side only)."""

from __future__ import annotations

import logging
import os
from datetime import datetime, timezone

from firebase_admin import firestore

logger = logging.getLogger(__name__)
FREE_TRIAL_CREDITS = int(os.getenv("FREE_TRIAL_CREDITS", "3"))


class CreditService:
    @staticmethod
    def _ref(uid: str):
        return firestore.client().collection("users").document(uid)

    @classmethod
    def get_balance(cls, uid: str) -> dict:
        doc = cls._ref(uid).get()
        if not doc.exists:
            raise ValueError(f"User {uid} not found")
        d = doc.to_dict()
        return {"credits": d.get("credits", 0), "is_paid": d.get("isPaid", False), "plan": d.get("plan", "free")}

    @classmethod
    def has_credits(cls, uid: str) -> bool:
        bal = cls.get_balance(uid)
        return bal["is_paid"] or bal["credits"] > 0

    @classmethod
    def deduct_credit(cls, uid: str) -> int:
        """Atomic credit deduction. Returns new balance."""
        db  = firestore.client()
        ref = cls._ref(uid)

        @firestore.transactional
        def _tx(tx, ref):
            snap = ref.get(transaction=tx)
            if not snap.exists:
                raise ValueError(f"User {uid} not found")
            d = snap.to_dict()
            if d.get("isPaid", False):
                return d.get("credits", 0)
            current = d.get("credits", 0)
            if current <= 0:
                raise ValueError("Insufficient credits")
            new = current - 1
            tx.update(ref, {"credits": new, "last_used": datetime.now(timezone.utc)})
            return new

        return _tx(db.transaction(), ref)

    @classmethod
    def refund_credit(cls, uid: str) -> int:
        ref = cls._ref(uid)
        doc = ref.get()
        if not doc.exists:
            return 0
        d = doc.to_dict()
        if d.get("isPaid", False):
            return d.get("credits", 0)
        new = d.get("credits", 0) + 1
        ref.update({"credits": new})
        logger.info(f"Refunded 1 credit to {uid}. Balance: {new}")
        return new

    @classmethod
    def initialize_user(cls, uid: str, email: str | None, display_name: str | None) -> None:
        ref = cls._ref(uid)
        if ref.get().exists:
            return
        ref.set({
            "uid": uid, "email": email, "displayName": display_name,
            "credits": FREE_TRIAL_CREDITS, "isPaid": False, "plan": "free",
            "createdAt": datetime.now(timezone.utc), "totalJobsCreated": 0,
        })
        logger.info(f"New user {uid} — {FREE_TRIAL_CREDITS} free credits granted")


credits = CreditService()
