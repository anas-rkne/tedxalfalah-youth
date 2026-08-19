#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
توليد أصول QR Code لرابط التقديم — حزمة طباعة/إيميل للعميل.

المخرجات (في exports/):
  apply-qr-print.png   1181x1181px  (~10 سم @ 300 DPI — للطباعة)
  apply-qr-email.png   512x512px    (للإيميل والسوشيال)
  apply-qr.svg         متجه (مع الشعار مضمّن Base64)
  apply-qr-poster.pdf  ورقة A4 — QR + التسميات
"""
import base64
import pathlib
import sys

QR_URL = "https://tedxalfalahyouth.com/apply"  # غيّره هنا فقط عند الحاجة
LOGO_PATH = "public/images/logo-black.png"
EXPORTS = pathlib.Path("exports")
SIZE_PRINT = 1181
SIZE_EMAIL = 512
LOGO_FRACTION = 0.18      # عرض الشعار نسبةً لعرض الـ QR
PAD_FRACTION = 0.22       # الوسادة البيضاء خلف الشعار
RED = (255, 0, 20)
RED_HEX = "#ff0014"

import qrcode
from qrcode.constants import ERROR_CORRECT_H
from PIL import Image, ImageDraw, ImageFont

import arabic_reshaper
from bidi.algorithm import get_display

FONT_AR = r"C:\Windows\Fonts\arial.ttf"
FONT_AR_BOLD = r"C:\Windows\Fonts\arialbd.ttf"
FONT_EN = r"C:\Windows\Fonts\segoeui.ttf"
FONT_EN_BOLD = r"C:\Windows\Fonts\segoeuib.ttf"

DEADLINE_AR = "آخر موعد للتقديم: 14 سبتمبر 2026"
DEADLINE_EN = "Deadline: September 14, 2026"
CAPTION_AR = "امسح الرمز للوصول إلى صفحة التقديم"


def ar(text: str) -> str:
    return get_display(arabic_reshaper.reshape(text))


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size)


def build_qr(size_px: int) -> Image.Image:
    qr = qrcode.QRCode(
        error_correction=ERROR_CORRECT_H, box_size=1, border=4
    )
    qr.add_data(QR_URL)
    qr.make(fit=True)
    total = qr.modules_count + 2 * qr.border
    box = max(1, size_px // total)
    img_px = total * box

    qr_final = qrcode.QRCode(
        error_correction=ERROR_CORRECT_H, box_size=box, border=qr.border
    )
    qr_final.add_data(QR_URL)
    qr_final.make(fit=True)
    base: Image.Image = qr_final.make_image(
        fill_color=RED, back_color="white"
    ).convert("RGBA")

    canvas = Image.new("RGBA", (size_px, size_px), "white")
    off = (size_px - img_px) // 2
    canvas.paste(base, (off, off), base)
    base = canvas

    logo = Image.open(LOGO_PATH).convert("RGBA")
    logo_w = int(size_px * LOGO_FRACTION)
    logo = logo.resize((logo_w, int(logo_w * logo.height / logo.width)), Image.LANCZOS)

    pad_w = int(size_px * PAD_FRACTION)
    draw = ImageDraw.Draw(base)
    x0 = (size_px - pad_w) // 2
    y0 = (size_px - pad_w) // 2
    draw.rounded_rectangle(
        (x0, y0, x0 + pad_w, y0 + pad_w),
        radius=int(pad_w * 0.2), fill="white",
    )
    base.alpha_composite(logo, (
        (size_px - logo.width) // 2,
        (size_px - logo.height) // 2,
    ))
    return base


def make_svg(qr: qrcode.QRCode, size_mm: float = 55.0) -> str:
    matrix = qr.get_matrix()
    n = len(matrix)
    b = qr.border
    total = n + 2 * b
    m = 1.0  # وحدة لكل موديول
    parts = []
    for i, row in enumerate(matrix):
        for j, cell in enumerate(row):
            if cell:
                x, y = (j + b) * m, (i + b) * m
                parts.append(f'<rect x="{x:.3f}" y="{y:.3f}" width="{m:.3f}" height="{m:.3f}"/>')
    logo = Image.open(LOGO_PATH).convert("RGBA")
    logo_w = total * LOGO_FRACTION
    ratio = logo.height / logo.width
    logo = logo.resize((int(logo_w), int(logo_w * ratio)), Image.LANCZOS)
    buf = pathlib.Path("__qr_logo_tmp.png")
    logo.save(buf)
    b64 = base64.b64encode(buf.read_bytes()).decode()
    buf.unlink()

    d = total * PAD_FRACTION
    pad = (
        f'<rect x="{total / 2 - d / 2:.3f}" y="{total / 2 - d / 2:.3f}" '
        f'width="{d:.3f}" height="{d:.3f}" rx="{d * 0.2:.3f}" fill="#ffffff"/>'
    )
    img = (
        f'<image x="{total / 2 - logo.width / 2:.3f}" y="{total / 2 - logo.height / 2:.3f}" '
        f'width="{logo.width}" height="{logo.height}" '
        f'xlink:href="data:image/png;base64,{b64}"/>'
    )
    rects = "".join(parts)
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '
        f'width="{size_mm}mm" height="{size_mm}mm" viewBox="0 0 {total} {total}" '
        f'fill="{RED_HEX}">'
        f'{rects}{pad}{img}</svg>'
    )


def make_poster(qr: Image.Image) -> None:
    W, H = 2480, 3508  # A4 @300dpi
    poster = Image.new("RGB", (W, H), "white")
    d = ImageDraw.Draw(poster)

    def center_text(y: int, text: str, fnt: ImageFont.FreeTypeFont, fill):
        bbox = d.textbbox((0, 0), text, font=fnt)
        tw = bbox[2] - bbox[0]
        d.text(((W - tw) / 2 - bbox[0], y), text, font=fnt, fill=fill)

    center_text(250, ar("سجّل الآن"), font(FONT_AR_BOLD, 130), RED)
    center_text(470, "TEDxAlFalah Youth", font(FONT_EN_BOLD, 62), (20, 20, 20))
    d.rectangle((W // 2 - 260, 620, W // 2 + 260, 624), fill=RED)

    qr_y = 700
    poster.paste(qr.convert("RGB"), ((W - SIZE_PRINT) // 2, qr_y))

    center_text(1980, ar(CAPTION_AR), font(FONT_AR, 46), (20, 20, 20))
    center_text(2120, QR_URL, font(FONT_EN, 38), (110, 110, 110))
    center_text(2290, ar(DEADLINE_AR), font(FONT_AR_BOLD, 44), RED)
    center_text(2400, DEADLINE_EN, font(FONT_EN, 34), (110, 110, 110))

    poster.save(EXPORTS / "apply-qr-poster.pdf", "PDF", resolution=300.0)


def main() -> int:
    EXPORTS.mkdir(exist_ok=True)
    qr_big = build_qr(SIZE_PRINT)
    qr_big.save(EXPORTS / "apply-qr-print.png")
    build_qr(SIZE_EMAIL).save(EXPORTS / "apply-qr-email.png")

    qr = qrcode.QRCode(error_correction=ERROR_CORRECT_H, box_size=1, border=4)
    qr.add_data(QR_URL)
    qr.make(fit=True)
    (EXPORTS / "apply-qr.svg").write_text(make_svg(qr), encoding="utf-8")

    make_poster(qr_big)

    for f in sorted(EXPORTS.glob("apply-qr*")):
        print(f"Created: {f.name}  ({f.stat().st_size / 1024:.0f} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())