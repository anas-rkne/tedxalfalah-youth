#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
md2pdf — تحويل مستندات Markdown إلى PDF رسمي بهوية TEDxAlFalah Youth
====================================================================
- دعم كامل للعربية (RTL)، غلاف رسمي، جداول، أكواد، ترقيم صفحات، رأس وتذييل.
- اكتشاف ملفات .md في مجلد docs/ وعرض قائمة تفاعلية والتحويل بالتسلسل.

الاستخدام:
    python md2pdf.py                      # وضع تفاعلي: قائمة + اختيار
    python md2pdf.py --all                # تحويل كل الملفات دفعة واحدة
    python md2pdf.py --file 3             # تحويل الملف رقم 3 من القائمة
    python md2pdf.py --no-cover           # بدون صفحة غلاف
    python md2pdf.py --docs-dir docs --export-dir exports
"""

import argparse
import glob
import os
import pathlib
import sys

import markdown

SCRIPT_DIR = pathlib.Path(__file__).resolve().parent

FONT_ARABIC = "Noto Naskh Arabic"
FONT_HEADINGS = "Noto Kufi Arabic"
FONT_MONO = "DejaVu Sans Mono"

CSS_TEMPLATE = """
@page {{
  size: A4;
  margin: 1.8cm 1.2cm 1.6cm 1.2cm;
  @bottom-center {{
    content: "صفحة " counter(page) " من " counter(pages);
    font-family: "{fonts}", serif;
    font-size: 9pt;
    color: #6b7280;
  }}
  @top-left {{
    content: "TEDxAlFalah Youth — التوثيق الرسمي";
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
  font-size: 22pt;
  border-bottom: 3px solid #9f1239;
  padding-bottom: 8px;
  margin-top: 0;
}}

h2 {{
  font-size: 16pt;
  border-right: 5px solid #9f1239;
  padding-right: 10px;
  margin-top: 30px;
}}

h3 {{
  font-size: 13pt;
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
  margin: 16px 0;
  page-break-inside: auto;
  table-layout: fixed;
}}

thead {{
  display: table-header-group;
}}

th {{
  background-color: #9f1239;
  color: #ffffff;
  padding: 10px 12px;
  font-weight: bold;
  font-family: "{headings}", sans-serif;
  font-size: 10pt;
  text-align: center;
  border: 1px solid #881337;
  overflow-wrap: anywhere;
}}

td {{
  border: 1px solid #e5e7eb;
  padding: 8px 12px;
  vertical-align: top;
  font-size: 10pt;
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
  font-size: 9.5pt;
  direction: ltr;
  unicode-bidi: embed;
}}

pre {{
  background-color: #1f2937;
  color: #f9fafb;
  padding: 16px;
  border-radius: 10px;
  direction: ltr;
  text-align: left;
  font-size: 9.5pt;
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
  padding: 14px 18px;
  margin: 16px 0;
  border-radius: 8px;
  color: #4c1d24;
  font-size: 10.5pt;
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
  margin-top: 160px;
  page-break-after: always;
  border: 3px solid #9f1239;
  padding: 50px 30px;
  border-radius: 15px;
  background: linear-gradient(180deg, #fff1f2 0%, #ffffff 100%);
}}

.cover img.logo {{
  max-width: 180px;
  margin-bottom: 20px;
}}

.cover h1 {{
  font-size: 30pt;
  border: none;
  color: #881337;
  margin: 10px 0;
}}

.cover .theme {{
  font-size: 24pt;
  font-weight: bold;
  color: #9f1239;
  letter-spacing: 3px;
  margin-top: 15px;
}}

.cover .subtitle {{
  font-size: 16pt;
  color: #6b7280;
  margin-top: 8px;
}}

.cover .doc-title {{
  font-size: 18pt;
  color: #1f2937;
  margin-top: 40px;
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
  margin-top: 20px;
  font-weight: bold;
}}
"""


def resolve_logo():
    """إيجاد شعار الحدث في مواقع معروفة — لا يفشل أبدًا بدون شعار."""
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


def build_cover(logo_path, doc_title):
    """صفحة الغلاف الرسمية بهوية الحدث."""
    if logo_path:
        logo_html = (
            f'<img class="logo" src="{logo_path.as_posix()}" '
            f'alt="TEDxAlFalah Youth Logo" />'
        )
    else:
        logo_html = (
            '<div style="font-size: 28px; font-weight: bold; '
            'color: #9f1239; margin-bottom: 20px;">TEDxAlFalah Youth</div>'
        )
    return f"""
<div class="cover">
    {logo_html}
    <h1>TEDxAlFalah Youth</h1>
    <div class="theme">THE SPARK</div>
    <div class="subtitle">Tomorrow, Now.</div>
    <hr style="width: 60%; border: 1px solid #9f1239; margin: 30px auto;" />
    <div class="doc-title">التوثيق الرسمي للمشروع البرمجي</div>
    <div class="doc-sub">مستخرج من الكود الفعلي — مرجع تحقق كامل</div>
    <div class="doc-date">أغسطس 2026</div>
</div>
"""


def convert_md_to_pdf(md_path, export_dir, include_cover=True):
    """تحويل ملف Markdown واحد إلى PDF بالتنسيق الرسمي."""
    md_path = pathlib.Path(md_path)
    print(f"\n🔄 جاري معالجة: {md_path}")

    try:
        md_text = md_path.read_text(encoding="utf-8")
    except OSError as exc:
        print(f"❌ فشل قراءة الملف: {exc}")
        return None
    if not md_text.strip():
        print("❌ الملف فارغ — تم التخطي.")
        return None

    html_body = markdown.markdown(
        md_text,
        extensions=["tables", "toc", "fenced_code", "attr_list", "sane_lists"],
    )

    doc_title = md_path.stem
    logo_path = resolve_logo()
    cover_html = build_cover(logo_path, doc_title) if include_cover else ""

    css = CSS_TEMPLATE.format(
        fonts=FONT_ARABIC, headings=FONT_HEADINGS, mono=FONT_MONO
    )

    full_html = f"""<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8">
<title>{doc_title} — TEDxAlFalah Youth | التوثيق الرسمي</title>
<meta name="author" content="TEDxAlFalah Youth">
<style>{css}</style>
</head>
<body class="doc-{doc_title}">
{cover_html}
{html_body}
</body>
</html>"""

    try:
        from weasyprint import HTML
        from weasyprint.text.fonts import FontConfiguration
    except ImportError:
        print(
            "\n❌ مكتبة weasyprint غير مثبتة.\n"
            "   التثبيت عبر Conda:  conda create -n md2pdf -c conda-forge "
            "python=3.12 weasyprint markdown\n"
            "   التثبيت عبر pip:    pip install weasyprint markdown "
            "(يتطلب Pango ≥ 1.44 على النظام)"
        )
        sys.exit(1)

    font_config = FontConfiguration()
    html = HTML(string=full_html, base_url=str(SCRIPT_DIR))
    document = html.render(font_config=font_config)
    page_count = len(document.pages)

    output_path = export_dir / f"{doc_title}.pdf"
    document.write_pdf(str(output_path), font_config=font_config)

    size_kb = output_path.stat().st_size / 1024
    print(f"✅ تم إنشاء: {output_path}  ({size_kb:.0f} KB — {page_count} صفحة)")
    return output_path


def discover_md_files(docs_dir):
    """البحث عن ملفات .md في المجلد المحدد (بترتيب طبيعي)."""
    files = sorted(glob.glob(os.path.join(docs_dir, "**", "*.md"), recursive=True))
    return [pathlib.Path(f) for f in files]


def ask_single_file(files):
    """الحصول على اختيار الملف من المستخدم مع إعادة المحاولة عند الخطأ."""
    while True:
        choice = input("➡️  اختيارك: ").strip()
        if choice.lower() == "الكل":
            return "all"
        if choice.lower() in ("خروج", "exit", "q"):
            return None
        try:
            index = int(choice) - 1
            if 0 <= index < len(files):
                return index
        except ValueError:
            pass
        print("❌ إدخال غير مفهوم. أدخل رقم الملف أو 'الكل' أو 'خروج'.")


def ask_continue(next_file):
    """اقتراح الانتقال للملف التالي."""
    while True:
        answer = input(f"هل تريد تحويل الملف التالي '{next_file}'؟ (نعم/لا): ").strip().lower()
        if answer in ("نعم", "y", "yes", "ن"):
            return True
        if answer in ("لا", "n", "no", "ل"):
            return False
        print("❌ أجب بـ 'نعم' أو 'لا'.")


def interactive_mode(files, export_dir, no_cover):
    """الوضع التفاعلي الكامل حسب المواصفات."""
    print(f"📁 تم العثور على {len(files)} ملف(ات):\n")
    for i, f in enumerate(files, start=1):
        print(f"  {i}) {f}")

    print("\nاختر رقم الملف للتحويل، أو اكتب 'الكل' لتحويل جميع الملفات، "
          "أو 'خروج' للإنهاء.")

    choice = ask_single_file(files)

    if choice is None:
        print("👋 تم الإنهاء.")
        return

    if choice == "all":
        for idx, f in enumerate(files, start=1):
            print(f"\n=== الملف {idx} من {len(files)} ===")
            convert_md_to_pdf(
                f,
                export_dir,
                include_cover=(idx == 1) and not no_cover,
            )
        print("\n🎉 تم تحويل جميع الملفات بنجاح.")
        return

    current = choice
    while current is not None:
        f = files[current]
        convert_md_to_pdf(f, export_dir, include_cover=not no_cover)
        print(f"\nتم الانتهاء من هذا الملف.")
        if current + 1 >= len(files):
            print("🏁 هذا هو آخر ملف في القائمة.")
            break
        next_file = files[current + 1]
        if ask_continue(next_file):
            current += 1
            continue
        print("👋 تم الإنهاء.")
        break


def main():
    parser = argparse.ArgumentParser(
        description="تحويل مستندات Markdown إلى PDF رسمي بهوية TEDxAlFalah Youth"
    )
    parser.add_argument("--docs-dir", default="docs", help="مجلد ملفات .md (الافتراضي: docs)")
    parser.add_argument("--export-dir", default="exports", help="مجلد الإخراج (الافتراضي: exports)")
    parser.add_argument("--no-cover", action="store_true", help="بدون صفحة غلاف")
    parser.add_argument("--all", action="store_true", help="تحويل كل الملفات بدون تفاعل")
    parser.add_argument("--file", type=int, help="رقم الملف من القائمة للتحويل")
    args = parser.parse_args()

    if sys.stdout and hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass

    docs_dir = pathlib.Path(args.docs_dir)
    export_dir = pathlib.Path(args.export_dir)
    export_dir.mkdir(parents=True, exist_ok=True)

    if not docs_dir.is_dir():
        print(f"❌ المجلد '{docs_dir}' غير موجود.")
        sys.exit(1)

    print("🔍 جاري البحث عن ملفات Markdown...")
    files = discover_md_files(docs_dir)

    if not files:
        print("❌ لم يتم العثور على أي ملفات .md في المجلد المحدد.")
        sys.exit(1)

    if args.all:
        for idx, f in enumerate(files, start=1):
            print(f"\n=== الملف {idx} من {len(files)} ===")
            convert_md_to_pdf(
                f,
                export_dir,
                include_cover=(idx == 1) and not args.no_cover,
            )
        print("\n🎉 تم تحويل جميع الملفات بنجاح.")
        return

    if args.file is not None:
        if 1 <= args.file <= len(files):
            f = files[args.file - 1]
            convert_md_to_pdf(f, export_dir, include_cover=not args.no_cover)
        else:
            print(f"❌ رقم غير صالح. المتاح: 1 إلى {len(files)}.")
            sys.exit(1)
        return

    interactive_mode(files, export_dir, args.no_cover)


if __name__ == "__main__":
    main()