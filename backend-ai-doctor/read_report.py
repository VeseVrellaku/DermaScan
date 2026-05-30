import fitz # PyMuPDF

with fitz.open("melanoma_hospital_report.pdf") as doc:
    text = ""
    for page in doc:
        text += page.get_text()

report = text