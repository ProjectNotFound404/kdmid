from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parent.parent
assets = root / "docs" / "store-assets"
assets.mkdir(parents=True, exist_ok=True)
size = 4
icon = Image.new("RGBA", (128 * size, 128 * size))
draw = ImageDraw.Draw(icon)

def box(values):
    return tuple(int(value * size) for value in values)

draw.rounded_rectangle(box((16, 16, 112, 112)), radius=24 * size, fill="#196487")
draw.ellipse(box((53, 33, 75, 55)), fill="white")
draw.rounded_rectangle(box((39, 62, 89, 92)), radius=15 * size, fill="white")
draw.ellipse(box((69, 68, 107, 106)), fill="#f4c867", outline="#196487", width=3 * size)
draw.rounded_rectangle(box((81, 76, 95, 93)), radius=7 * size, outline="#172e40", width=3 * size)
draw.rounded_rectangle(box((78, 85, 98, 99)), radius=3 * size, fill="#172e40")
draw.ellipse(box((86, 89, 90, 93)), fill="#f4c867")
for dimension in (16, 32, 48, 128):
    icon.resize((dimension, dimension), Image.Resampling.LANCZOS).save(root / "extension" / f"icon-{dimension}.png")

(assets / "icon.svg").write_text('''<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <rect x="16" y="16" width="96" height="96" rx="24" fill="#196487"/>
  <circle cx="64" cy="44" r="11" fill="white"/>
  <rect x="39" y="62" width="50" height="30" rx="15" fill="white"/>
  <circle cx="88" cy="87" r="18" fill="#f4c867" stroke="#196487" stroke-width="3"/>
  <rect x="81" y="76" width="14" height="17" rx="7" fill="none" stroke="#172e40" stroke-width="3"/>
  <rect x="78" y="85" width="20" height="14" rx="3" fill="#172e40"/>
  <circle cx="88" cy="91" r="2" fill="#f4c867"/>
</svg>
''')
promo = Image.new("RGB", (440 * size, 280 * size), "#103d57")
draw = ImageDraw.Draw(promo)
draw.ellipse(box((-80, -180, 430, 330)), fill="#196487")
draw.rounded_rectangle(box((248, 63, 392, 217)), radius=18 * size, fill="#ecf4f8")
for index, width in enumerate((87, 104, 73)):
    y = 98 + index * 28
    draw.rounded_rectangle(box((268, y, 268 + width, y + 8)), radius=4 * size, fill="#86a9bc")
draw.line(box((192, 139, 225, 139)), fill="#f4c867", width=7 * size)
draw.polygon([box((217, 125)), box((232, 139)), box((217, 153))], fill="#f4c867")
logo = icon.resize((176 * size, 176 * size), Image.Resampling.LANCZOS)
promo.paste(logo, (32 * size, 52 * size), logo)
promo.resize((440, 280), Image.Resampling.LANCZOS).save(assets / "small-promo.png")
def font(pixels, bold=False):
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
    ]
    for candidate in candidates:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, pixels * size)
    raise RuntimeError("Install Arial or DejaVu Sans to render the marquee text.")


marquee = Image.new("RGB", (1400 * size, 560 * size), "#103d57")
draw = ImageDraw.Draw(marquee)
draw.ellipse(box((850, -180, 1570, 660)), fill="#196487")
draw.rounded_rectangle(box((1050, 108, 1310, 412)), radius=24 * size, fill="#ecf4f8")
for index, width in enumerate((168, 190, 132, 170)):
    y = 156 + index * 40
    draw.rounded_rectangle(box((1082, y, 1082 + width, y + 10)), radius=5 * size, fill="#86a9bc")
logo = icon.resize((290 * size, 290 * size), Image.Resampling.LANCZOS)
marquee.paste(logo, (918 * size, 238 * size), logo)
texts = [
    (88, 120, "КД МИД — мои люди", 58, True, "white"),
    (88, 211, "Данные человека — один раз", 34, False, "white"),
    (88, 268, "Автозаполнение на notary.kdmid.ru", 26, False, "#c8e2ee"),
    (88, 375, "В вашем браузере. Зашифровано.", 27, True, "#f4c867"),
]
for x, y, text, pixels, bold, color in texts:
    face = font(pixels, bold)
    bounds = draw.textbbox((0, 0), text, font=face)
    assert x * size + bounds[2] < 900 * size, text
    draw.text((x * size, y * size), text, font=face, fill=color)
marquee.resize((1400, 560), Image.Resampling.LANCZOS).save(assets / "marquee-promo.png", optimize=True)
icon_markup = (assets / "icon.svg").read_text().split(">", 1)[1].rsplit("</svg>", 1)[0]
svg_texts = "\n".join(
    f'<text x="{x}" y="{y + pixels}" font-size="{pixels}" font-weight="{700 if bold else 400}" fill="{color}">{text}</text>'
    for x, y, text, pixels, bold, color in texts
)
lines = "\n".join(
    f'<rect x="1082" y="{156 + index * 40}" width="{width}" height="10" rx="5" fill="#86a9bc"/>'
    for index, width in enumerate((168, 190, 132, 170))
)
(assets / "marquee-promo.svg").write_text(f'''<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="560" viewBox="0 0 1400 560" font-family="Arial, DejaVu Sans, sans-serif">
  <rect width="1400" height="560" fill="#103d57"/>
  <ellipse cx="1210" cy="240" rx="360" ry="420" fill="#196487"/>
  <rect x="1050" y="108" width="260" height="304" rx="24" fill="#ecf4f8"/>
  {lines}
  <g transform="translate(918 238) scale(2.265625)">{icon_markup}</g>
  {svg_texts}
</svg>
''')
print("Generated four extension icons, a 440x280 tile, and a 1400x560 marquee.")
