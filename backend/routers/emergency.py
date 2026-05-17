"""
Emergency QR Health Card endpoint.
Extracts critical patient info from the report and returns structured data for QR generation.
"""
from __future__ import annotations

import json
import re

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.core.ai import get_summary_llm, _extract_text
from backend.core.config import EMERGENCY_CARD_PROMPT
from backend.session_store import get_session

router = APIRouter(prefix="/api", tags=["emergency"])


class EmergencyCardRequest(BaseModel):
    session_id: str


class EmergencyCardResponse(BaseModel):
    patient_name: str
    conditions: list[str]
    blood_type: str
    allergies: str
    medications: str
    emergency_notes: str
    urgency: str


@router.post("/emergency-card", response_model=EmergencyCardResponse)
async def generate_emergency_card(request: EmergencyCardRequest):
    """Extract critical medical info from an analyzed report for QR card generation."""
    session = get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or expired.")

    result = session.analysis_result
    prompt = EMERGENCY_CARD_PROMPT.format(
        summary=result.summary,
        report_text=result.report_text[:3000],
    )

    try:
        raw = _extract_text(get_summary_llm().invoke(prompt))
        # Extract JSON from response (handle markdown code blocks)
        json_match = re.search(r'\{[\s\S]*\}', raw)
        if not json_match:
            raise ValueError("No JSON found in response")
        data = json.loads(json_match.group())
    except Exception:
        # Fallback with basic info
        data = {
            "patient_name": result.patient_name,
            "conditions": ["See attached medical report"],
            "blood_type": "Not in report",
            "allergies": "Not in report",
            "medications": "Not in report",
            "emergency_notes": f"Urgency: {result.urgency.level}. Consult doctor immediately.",
            "urgency": result.urgency.level,
        }

    return EmergencyCardResponse(
        patient_name=data.get("patient_name", result.patient_name),
        conditions=data.get("conditions", []),
        blood_type=data.get("blood_type", "Not in report"),
        allergies=data.get("allergies", "Not in report"),
        medications=data.get("medications", "Not in report"),
        emergency_notes=data.get("emergency_notes", ""),
        urgency=data.get("urgency", result.urgency.level),
    )
