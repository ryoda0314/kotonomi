"""The app's icons, drawn here until the maker chooses a picture (the sisters' icons are pictures the maker chose).

A twig with a leaf and two fruits (言の実): the accent blue, and the again violet of what comes back. Flat colours on
the paper of the app. Drawn four times larger and scaled down, so the edges are smooth.

    python design/make-icons.py

writes public/icons/icon-192.png, icon-512.png (a rounded card, transparent corners), maskable-512.png (the whole
square, the picture inside the safe circle), src/app/apple-icon.png and src/app/icon.png, and src/app/favicon.ico.
"""

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
PAPER = (252, 251, 248, 255)
LINE = (228, 231, 236, 255)
INK = (23, 32, 51, 255)
ACCENT = (10, 100, 240, 255)
AGAIN = (106, 79, 224, 255)
LEAF = (74, 154, 107, 255)
SHINE = (255, 255, 255, 90)

SS = 4  # drawn this many times larger


def bezier(p0, p1, p2, p3, n=64):
    out = []
    for i in range(n + 1):
        t = i / n
        a, b, c, d = (1 - t) ** 3, 3 * (1 - t) ** 2 * t, 3 * (1 - t) * t**2, t**3
        out.append((a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]))
    return out


def picture(draw: ImageDraw.ImageDraw, ox: float, oy: float, scale: float) -> None:
    """The twig, the leaf and the fruits, in a 512 space placed at (ox, oy) and scaled."""

    def P(x, y):
        return (ox + x * scale, oy + y * scale)

    def W(w):
        return max(1, round(w * scale))

    twig = bezier((92, 178), (190, 118), (320, 196), (428, 140))
    # The leaf, an almond from the twig up to the left.
    leaf = bezier((150, 162), (156, 108), (120, 80), (70, 76), 32) + bezier((70, 76), (80, 126), (108, 158), (150, 162), 32)
    draw.polygon([P(*q) for q in leaf], fill=LEAF)
    draw.line([P(*q) for q in twig], fill=INK, width=W(18), joint="curve")
    for end in (twig[0], twig[-1]):
        r = 9 * scale
        x, y = P(*end)
        draw.ellipse((x - r, y - r, x + r, y + r), fill=INK)
    # Two stems, two fruits.
    draw.line([P(214, 158), P(216, 224)], fill=INK, width=W(12))
    draw.line([P(372, 160), P(380, 248)], fill=INK, width=W(10))

    def fruit(cx, cy, r, colour):
        x, y = P(cx, cy)
        rr = r * scale
        draw.ellipse((x - rr, y - rr, x + rr, y + rr), fill=colour)
        sx, sy = P(cx - r * 0.42, cy - r * 0.42)
        sr = r * 0.2 * scale
        draw.ellipse((sx - sr, sy - sr * 0.8, sx + sr, sy + sr * 0.8), fill=SHINE)

    fruit(218, 322, 100, ACCENT)
    fruit(384, 304, 58, AGAIN)


def card(size: int, rounded: bool, inset: float) -> Image.Image:
    big = size * SS
    img = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img, "RGBA")
    if rounded:
        r = big * 0.22
        draw.rounded_rectangle((0, 0, big - 1, big - 1), radius=r, fill=PAPER, outline=LINE, width=max(1, round(big * 0.012)))
    else:
        draw.rectangle((0, 0, big, big), fill=PAPER)
    # The picture spans 92..440 across and 70..424 down in its 512 space: centred, `inset` of the side left around it.
    span = 512 * (1 - 2 * inset)
    scale = big / 512 * (1 - 2 * inset)
    ox = (big - span * big / 512) / 2 + (512 / 2 - 266) * scale
    oy = (big - span * big / 512) / 2 + (512 / 2 - 247) * scale
    picture(draw, ox, oy, scale)
    return img.resize((size, size), Image.LANCZOS)


def main() -> None:
    icons = ROOT / "public" / "icons"
    icons.mkdir(parents=True, exist_ok=True)
    card(192, True, 0.06).save(icons / "icon-192.png")
    card(512, True, 0.06).save(icons / "icon-512.png")
    card(512, False, 0.16).save(icons / "maskable-512.png")
    app = ROOT / "src" / "app"
    card(180, False, 0.1).save(app / "apple-icon.png")
    card(256, True, 0.06).save(app / "icon.png")
    card(48, True, 0.04).save(app / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    print("icons written")


if __name__ == "__main__":
    main()
