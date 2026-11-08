"""Builds the Zencode brand kit PDF.

Run from the repo root:  python brand/render.py
Writes logo colour variants to brand/build/, then prints brand/brandkit.html
to brand/Zencode-Brand-Kit.pdf with Playwright (Chromium).
"""
import pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
BRAND = ROOT / "brand"
BUILD = BRAND / "build"
BUILD.mkdir(exist_ok=True)

INK, CREAM, CORAL, PILL = "#2D2627", "#FFFDF5", "#E45258", "#EBE1D8"

full = (ROOT / "assets" / "fullLogoV2.svg").read_text(encoding="utf-8")
icon = (ROOT / "assets" / "icon.svg").read_text(encoding="utf-8")


def full_variant(pill, line, accent):
    s = full.replace(".st0{fill:#FFFDF5;}", f".st0{{fill:{pill};}}")
    s = s.replace(".st1{fill:#E45258;}", f".st1{{fill:{accent};}}")
    return s.replace("stroke:#E45258;", f"stroke:{line};")


def icon_variant(pill, line, accent):
    s = icon.replace('fill="#ebe1d8', f'fill="{pill}').replace('stroke="#e45258', f'stroke="{line}')
    return s.replace('fill="#e45258', f'fill="{accent}')


variants = {
    "logo-primary": (CREAM, CORAL, CORAL),      # on charcoal
    "logo-ink": (INK, CORAL, CORAL),            # on cream
    "logo-coral": (CREAM, INK, INK),            # on coral
    "logo-mono-ink": (INK, CREAM, INK),         # one colour on cream
    "logo-mono-cream": (CREAM, INK, CREAM),     # one colour on charcoal
}
for name, (p, l, a) in variants.items():
    (BUILD / f"{name}.svg").write_text(full_variant(p, l, a), encoding="utf-8")
    icon_pill = PILL if p == CREAM and a == CORAL else p
    (BUILD / f"{name.replace('logo', 'icon')}.svg").write_text(icon_variant(icon_pill, l, a), encoding="utf-8")

out = BRAND / "Zencode-Brand-Kit.pdf"
with sync_playwright() as pw:
    browser = pw.chromium.launch()
    page = browser.new_page()
    page.goto((BRAND / "brandkit.html").as_uri(), wait_until="networkidle")
    page.evaluate("document.fonts.ready")
    page.wait_for_timeout(400)
    page.pdf(path=str(out), prefer_css_page_size=True, print_background=True)
    browser.close()
print("wrote", out)
