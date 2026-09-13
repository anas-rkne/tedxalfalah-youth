#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
convert_proposal.py — تحويل ملف مقترح Markdown إلى PDF رسمي بهوية TEDxAlFalah Youth
لمستندات موجهة للعميل (بغلاف مخصص لوصف العميل بدل الغلاف التقني).
"""
import pathlib
import sys

import markdown

SCRIPT_DIR = pathlib.Path(__file__).resolve().parent

FONT_ARABIC = "Noto Naskh Arabic"
FONT_HEADINGS = "Noto Kufi Arabic"
FONT_MONO = "DejaVu Sans Mono"

CSS_TEMPLATE = """
@page {{
  size: A4 landscape;
  margin: 1.5cm 1.2cm 1.4cm 1.2cm;
  @bottom-center {{
    content: "صفحة " counter(page) " من " counter(pages);
    font-family: "{fonts}", serif;
    font-size: 9pt;
    color: #6b7280;
  }}
  @top-left {{
    content: "مقترح مشروع — جدار الأسئلة الحية | TEDxAlFalah Youth";
    font-family: "{headings}", sans-serif;
    font-size: 9pt;
    color: #9f1239;
  }}
}}

@page :first {{
  @top-left {{ content: none; }}
  @bottom-center {{ content: none; }}
}}

body {{
  font-family: "{fonts}", "Amiri", "Times New Roman", serif;
  direction: rtl;
  line-height: 1.9;
  color: #1f2937;
  font-size: 11pt;
}}

h1, h2, h3, h4 {{
  font-family: "{headings}", sans-serif;
  color: #9f1239;
  font-weight: bold;
  page-break-after: avoid;
}}

h1 {{
  font-size: 20pt;
  border-bottom: 3px solid #9f1239;
  padding-bottom: 8px;
  margin-top: 0;
}}

h2 {{
  font-size: 15pt;
  border-right: 5px solid #9f1239;
  padding-right: 10px;
  margin-top: 26px;
}}

h3 {{
  font-size: 12.5pt;
  color: #be123c;
}}

p {{
  margin: 8px 0;
  text-align: justify;
}}

strong {{
  color: #111827;
}}

table {{
  width: 100%;
  border-collapse: collapse;
  margin: 14px 0;
  page-break-inside: auto;
  table-layout: fixed;
}}

thead {{
  display: table-header-group;
}}

th {{
  background-color: #9f1239;
  color: #ffffff;
  padding: 9px 11px;
  font-weight: bold;
  font-family: "{headings}", sans-serif;
  font-size: 10pt;
  text-align: center;
  border: 1px solid #881337;
  overflow-wrap: anywhere;
}}

td {{
  border: 1px solid #e5e7eb;
  padding: 7px 11px;
  vertical-align: top;
  font-size: 9.8pt;
  overflow-wrap: anywhere;
}}

td code, th code {{
  word-break: break-all;
}}

tr:nth-child(even) {{
  background-color: #f9fafb;
}}

tr {{
  page-break-inside: avoid;
}}

code {{
  background-color: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: "{mono}", "Courier New", monospace;
  font-size: 9pt;
  direction: ltr;
  unicode-bidi: embed;
}}

pre {{
  background-color: #1f2937;
  color: #f9fafb;
  padding: 14px;
  border-radius: 10px;
  direction: ltr;
  text-align: left;
  font-size: 9pt;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}}

pre code {{
  background-color: transparent;
  color: inherit;
  padding: 0;
  font-size: inherit;
}}

blockquote {{
  border-right: 5px solid #9f1239;
  background-color: #fdf2f8;
  padding: 13px 17px;
  margin: 14px 0;
  border-radius: 8px;
  color: #4c1d24;
  font-size: 10pt;
}}

blockquote p {{
  margin: 0;
}}

ul, ol {{
  margin: 8px 0;
  padding-right: 25px;
}}

li {{
  margin: 4px 0;
}}

a {{
  color: #be123c;
  text-decoration: none;
}}

pre, blockquote {{
  page-break-inside: avoid;
}}

.cover {{
  text-align: center;
  margin-top: 120px;
  page-break-after: always;
  border: 3px solid #9f1239;
  padding: 40px 30px;
  border-radius: 15px;
  background: linear-gradient(180deg, #fff1f2 0%, #ffffff 100%);
}}

.cover img.logo {{
  max-width: 160px;
  margin-bottom: 16px;
}}

.cover h1 {{
  font-size: 26pt;
  border: none;
  color: #881337;
  margin: 10px 0;
}}

.cover .theme {{
  font-size: 22pt;
  font-weight: bold;
  color: #9f1239;
  letter-spacing: 3px;
  margin-top: 12px;
}}

.cover .subtitle {{
  font-size: 15pt;
  color: #6b7280;
  margin-top: 6px;
}}

.cover .doc-title {{
  font-size: 20pt;
  color: #1f2937;
  margin-top: 36px;
  font-weight: bold;
}}

.cover .doc-sub {{
  font-size: 12pt;
  color: #6b7280;
  margin-top: 10px;
}}

.cover .doc-date {{
  font-size: 12pt;
  color: #9f1239;
  margin-top: 18px;
  font-weight: bold;
}}
"""


def resolve_logo():
    candidates = [
        SCRIPT_DIR / "public" / "images" / "logo-black.png",
        SCRIPT_DIR / "logo-black.png",
        pathlib.Path.cwd() / "public" / "images" / "logo-black.png",
        pathlib.Path.cwd() / "logo-black.png",
    ]
    for candidate in candidates:
        if candidate.is_file():
            return candidate
    return None


def build_cover(logo_path):
    if logo_path:
        logo_html = (
            f'<img class="logo" src="{logo_path.as_posix()}" '
            f'alt="TEDxAlFalah Youth Logo" />'
        )
    else:
        logo_html = (
            '<div style="font-size: 26px; font-weight: bold; '
            'color: #9f1239; margin-bottom: 16px;">TEDxAlFalah Youth</div>'
        )
    return f"""
<div class="cover">
    {logo_html}
    <h1>TEDxAlFalah Youth</h1>
    <div class="theme">THE SPARK</div>
    <div class="subtitle">Tomorrow, Now.</div>
    <hr style="width: 60%; border: 1px solid #9f1239; margin: 26px auto;" />
    <div class="doc-title">مقترح المشروع</div>
    <div class="doc-title" style="color:#9f1239;">نظام «جدار الأسئلة الحية»</div>
    <div class="doc-sub">Live Q&A Wall — التفاعل المباشر مع جمهور الفعالية</div>
    <div class="doc-date">سبتمبر 2026</div>
</div>
"""


def main():
    sys.stdout.reconfigure(encoding="utf-8") if hasattr(sys.stdout, "reconfigure") else None

    md_path = SCRIPT_DIR / "live-qa-wall-proposal.md"
    export_dir = SCRIPT_DIR.parent / "exports"
    export_dir.mkdir(parents=True, exist_ok=True)

    md_text = md_path.read_text(encoding="utf-8")
    html_body = markdown.markdown(
        md_text,
        extensions=["tables", "toc", "fenced_code", "attr_list", "sane_lists"],
    )

    logo_path = resolve_logo()
    cover_html = build_cover(logo_path)
    css = CSS_TEMPLATE.format(fonts=FONT_ARABIC, headings=FONT_HEADINGS, mono=FONT_MONO)

    full_html = f"""<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8">
<title>مقترح المشروع — جدار الأسئلة الحية | TEDxAlFalah Youth</title>
<meta name="author" content="TEDxAlFalah Youth">
<style>{css}</style>
</head>
<body>
{cover_html}
{html_body}
</body>
</html>"""

    from weasyprint import HTML
    from weasyprint.text.fonts import FontConfiguration

    font_config = FontConfiguration()
    html = HTML(string=full_html, base_url=str(SCRIPT_DIR))
    document = html.render(font_config=font_config)
    page_count = len(document.pages)
    output_path = export_dir / "live-qa-wall-proposal.pdf"
    document.write_pdf(str(output_path), font_config=font_config)

    size_kb = output_path.stat().st_size / 1024
    print(f"✅ تم إنشاء: {output_path}  ({size_kb:.0f} KB — {page_count} صفحات)")
    return output_path


if __name__ == "__main__":
    main()
