from datetime import datetime, timezone
from pathlib import Path
from uuid import UUID

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

from src.models.scan_session import ScanSession
from src.models.user import User
from src.utils.scan_classifier import ScanClassification


def generate_scan_report_pdf(
    *,
    upload_dir: Path,
    user: User,
    scan: ScanSession,
    classification: ScanClassification,
) -> str:
    relative_path = Path("reports") / str(user.id) / f"{scan.id}.pdf"
    absolute_path = upload_dir / relative_path
    absolute_path.parent.mkdir(parents=True, exist_ok=True)

    pdf = canvas.Canvas(str(absolute_path), pagesize=letter)
    width, height = letter
    y = height - inch

    pdf.setFont("Helvetica-Bold", 18)
    pdf.drawString(inch, y, "DermaScan Skin Analysis Report")
    y -= 0.35 * inch

    pdf.setFont("Helvetica", 10)
    pdf.drawString(inch, y, f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}")
    y -= 0.5 * inch

    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(inch, y, "Patient Information")
    y -= 0.25 * inch
    pdf.setFont("Helvetica", 11)
    pdf.drawString(inch, y, f"Name: {user.first_name} {user.last_name}")
    y -= 0.2 * inch
    pdf.drawString(inch, y, f"Email: {user.email}")
    y -= 0.2 * inch
    pdf.drawString(inch, y, f"Scan ID: {scan.id}")
    y -= 0.35 * inch

    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(inch, y, "Analysis Results")
    y -= 0.25 * inch
    pdf.setFont("Helvetica", 11)
    pdf.drawString(inch, y, f"Classification: {classification.label}")
    y -= 0.2 * inch
    pdf.drawString(inch, y, f"Confidence: {classification.confidence_score}%")
    y -= 0.2 * inch
    pdf.drawString(inch, y, f"Risk Level: {classification.risk_level}")
    y -= 0.35 * inch

    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(inch, y, "Summary")
    y -= 0.25 * inch
    pdf.setFont("Helvetica", 11)
    text = pdf.beginText(inch, y)
    text.setLeading(14)
    for line in _wrap_text(classification.report_summary, 90):
        text.textLine(line)
    pdf.drawText(text)

    pdf.setFont("Helvetica-Oblique", 9)
    pdf.drawString(
        inch,
        0.75 * inch,
        "Disclaimer: This report is for informational triage only and does not replace professional medical diagnosis.",
    )

    pdf.showPage()
    pdf.save()
    return relative_path.as_posix()


def _wrap_text(text: str, width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if len(candidate) <= width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines
