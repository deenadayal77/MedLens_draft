from __future__ import annotations

import hashlib
import re
from collections.abc import Callable

import fitz

from backend.core.config import OCR_MAX_PAGES, OCR_MIN_TEXT_CHARS


def report_hash_from_bytes(pdf_bytes: bytes) -> str:
    return hashlib.sha256(pdf_bytes).hexdigest()


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    with fitz.open(stream=pdf_bytes, filetype="pdf") as document:
        pages = [page.get_text("text") for page in document]
    return normalize_report_text("\n".join(pages))


def has_meaningful_report_text(text: str, min_chars: int = OCR_MIN_TEXT_CHARS) -> bool:
    normalized = normalize_report_text(text)
    useful_chars = re.findall(r"[A-Za-z0-9]", normalized)
    return len(useful_chars) >= min_chars


def render_pdf_pages_to_png(
    pdf_bytes: bytes,
    *,
    max_pages: int = OCR_MAX_PAGES,
    zoom: float = 2.0,
) -> list[bytes]:
    page_images: list[bytes] = []
    matrix = fitz.Matrix(zoom, zoom)

    with fitz.open(stream=pdf_bytes, filetype="pdf") as document:
        for page in list(document)[:max_pages]:
            pixmap = page.get_pixmap(matrix=matrix, alpha=False)
            page_images.append(pixmap.tobytes("png"))

    return page_images


def extract_text_from_pdf_with_ocr_fallback(
    pdf_bytes: bytes,
    ocr_extractor: Callable[[list[bytes]], str],
) -> str:
    extracted_text = extract_text_from_pdf(pdf_bytes)
    if has_meaningful_report_text(extracted_text):
        return extracted_text

    page_images = render_pdf_pages_to_png(pdf_bytes)
    if not page_images:
        return extracted_text

    ocr_text = ocr_extractor(page_images)
    normalized_ocr_text = normalize_report_text(ocr_text)
    if has_meaningful_report_text(normalized_ocr_text, min_chars=40):
        return normalized_ocr_text

    return extracted_text


def normalize_report_text(text: str) -> str:
    text = text.replace("\x00", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\r\n?", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def remove_report_boilerplate(text: str) -> str:
    patterns = [
        r"(?im)^page \d+ of \d+\s*$",
        r"(?im)^report approved on\s*$",
        r"(?im)^nationalrad\s*\|.*$",
        r"(?im)^this report was electronically signed.*$",
        r"(?im)^\[\s*nationalrad.*\]\s*$",
    ]
    for pattern in patterns:
        text = re.sub(pattern, "", text)
    return normalize_report_text(text)


def extract_patient_name(text: str) -> str:
    patterns = [
        r"(?im)^(?:patient|patient name|name)\s*[:\-]\s*(.+)$",
        r"(?im)^name\s+of\s+patient\s*[:\-]\s*(.+)$",
    ]

    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            candidate = match.group(1).strip()
            return re.split(r"\s{2,}|\t", candidate)[0].strip()
    return "Not available"


def extract_findings_section(text: str) -> str:
    patterns = [
        r"(?is)findings\s*[:\-]?\s*(.+?)(?=\n(?:impression|conclusion|opinion|advice|recommendation)\b)",
        r"(?is)impression\s*[:\-]?\s*(.+?)(?=\n(?:recommendation|advice|clinical history)\b)",
    ]

    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return remove_report_boilerplate(match.group(1))
    return ""


def extract_impression_section(text: str) -> str:
    patterns = [
        r"(?is)impression\s*[:\-]?\s*(.+?)(?=\n(?:signed|electronically signed|\[|$))",
        r"(?is)conclusion\s*[:\-]?\s*(.+?)(?=\n(?:signed|electronically signed|\[|$))",
    ]

    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return remove_report_boilerplate(match.group(1))
    return ""


def derive_primary_context(text: str) -> str:
    findings = extract_findings_section(text)
    impression = extract_impression_section(text)

    sections = []
    if impression:
        sections.append(f"IMPRESSION\n{impression}")
    if findings:
        sections.append(f"FINDINGS\n{findings}")

    combined = "\n\n".join(section for section in sections if section.strip())
    if combined and len(combined) >= 80:
        return combined
    return remove_report_boilerplate(text)
