import pathlib
import sys

from pypdf import PdfReader

exports = pathlib.Path("exports")
files = sorted(exports.glob("*.pdf"))
print(f"=== فحص {len(files)} ملف PDF ===\n")
ok = True
for f in files:
    try:
        reader = PdfReader(str(f))
        pages = len(reader.pages)
        meta = reader.metadata
        title = (meta.title or "-")[:70] if meta else "-"
        author = (meta.author or "-")[:40] if meta else "-"
        fonts = set()
        for p in reader.pages:
            res = p.get("/Resources", {})
            fdict = res.get("/Font", {})
            if isinstance(fdict, dict):
                for fn in fdict.values():
                    try:
                        base = fn.get_object().get("/BaseFont", "?")
                        fonts.add(str(base))
                    except Exception:
                        pass
        size = f.stat().st_size / 1024
        font_line = ", ".join(sorted(fonts))[:110]
        print(f"OK  {f.name:<28} {pages:>2} pages  {size:>6.0f} KB")
        print(f"    title : {title}")
        print(f"    fonts : {font_line}")
    except Exception as exc:
        ok = False
        print(f"FAIL {f.name}: {exc}")
print("\n=== النتيجة ===")
print("كل الملفات سليمة" if ok else "هناك أخطاء!")
sys.exit(0 if ok else 1)
