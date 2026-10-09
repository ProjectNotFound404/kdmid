from pathlib import Path
from PIL import Image, ImageDraw

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
print("Generated four extension icons and a 440x280 promotional tile.")
