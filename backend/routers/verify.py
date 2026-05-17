"""
Report authenticity verification endpoint.
Stores hashes of analyzed reports and allows verification.
"""
from __future__ import annotations

import time

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api", tags=["verify"])

# In-memory hash store: {hash: {"timestamp": float, "patient_name": str}}
_hash_store: dict[str, dict] = {}


class VerifyRequest(BaseModel):
    report_hash: str


class VerifyResponse(BaseModel):
    verified: bool
    message: str
    analyzed_at: str | None = None


def register_hash(report_hash: str, patient_name: str = "") -> None:
    """Called after successful analysis to register a report hash."""
    _hash_store[report_hash] = {
        "timestamp": time.time(),
        "patient_name": patient_name,
    }


@router.post("/verify", response_model=VerifyResponse)
async def verify_report(request: VerifyRequest):
    """Check if a report hash exists in the verified store."""
    entry = _hash_store.get(request.report_hash)
    if entry:
        from datetime import datetime, timezone

        dt = datetime.fromtimestamp(entry["timestamp"], tz=timezone.utc)
        return VerifyResponse(
            verified=True,
            message="This report has been verified by MedLens.",
            analyzed_at=dt.strftime("%Y-%m-%d %H:%M UTC"),
        )
    return VerifyResponse(
        verified=False,
        message="This report hash was not found. The report may have been modified or not analyzed by MedLens.",
    )
