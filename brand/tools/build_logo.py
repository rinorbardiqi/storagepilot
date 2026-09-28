"""Build the StoragePilot logo masters (symbol, lockups, wordmark) as outlined SVG.

The "Merge" mark: three lanes (GCS, S3, Azure) merge into one heading.
Lanes are drawn as round-capped strokes, then outlined and unioned with skia so
every master is a single filled path (no strokes, no live text).

Requires: skia-python, fonttools, uharfbuzz, and IBM Plex Sans SemiBold (OFL):
    pip install skia-python fonttools uharfbuzz
    python brand/tools/build_logo.py --font ibm-plex-sans-latin-600-normal.woff
"""
import argparse
import io
import re
from pathlib import Path

import skia
import uharfbuzz as hb
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

INK = "#0D1117"
AMBER = "#FFB224"
PAPER = "#F0F3F6"
WHITE = "#FFFFFF"
OUT = Path(__file__).resolve().parent.parent / "logo"


def _round(d: str) -> str:
    return re.sub(r"-?\d+\.\d+", lambda m: f"{float(m.group()):.2f}".rstrip("0").rstrip("."), d)


def merge_mark(width: float, lanes=(68, 128, 188), x0=40, x1=72, cx=112, xm=152, arrow=(162, 218, 56)) -> skia.Path:
    """Three lanes merging into an arrowhead, returned as one filled path."""
    mid = lanes[1]
    stroke = skia.Paint(Style=skia.Paint.kStroke_Style, StrokeWidth=width,
                        StrokeCap=skia.Paint.kRound_Cap, StrokeJoin=skia.Paint.kRound_Join)
    out = skia.Path()
    for y in lanes:
        p = skia.Path()
        p.moveTo(x0, y)
        if y == mid:
            p.lineTo(arrow[0] + 2, mid)
        else:
            p.lineTo(x1, y)
            p.cubicTo(cx, y, cx, mid, xm, mid)
        filled = skia.Path()
        stroke.getFillPath(p, filled)
        out = skia.Op(out, filled, skia.PathOp.kUnion_PathOp)
    base, tip, half = arrow
    head = skia.Path()
    head.moveTo(base, mid - half)
    head.lineTo(tip, mid)
    head.lineTo(base, mid + half)
    head.close()
    return skia.Op(out, head, skia.PathOp.kUnion_PathOp)


def fit(path: skia.Path, canvas=256, margin=None) -> skia.Path:
    """Centre the path in the canvas; optionally scale it to fill canvas - 2*margin."""
    b = path.computeTightBounds()
    m = skia.Matrix()
    s = 1.0
    if margin is not None:
        s = (canvas - 2 * margin) / max(b.width(), b.height())
    m.setTranslate(-b.centerX(), -b.centerY())
    m.postScale(s, s)
    m.postTranslate(canvas / 2, canvas / 2)
    out = skia.Path()
    path.transform(m, out)
    return out


def d_of(path: skia.Path) -> str:
    """Serialise a skia path to SVG path data (conics become quadratics)."""
    f = lambda pt: f"{pt.x():.2f} {pt.y():.2f}"
    out = []
    it = skia.Path.Iter(path, False)
    while True:
        verb, pts = it.next()
        if verb == skia.Path.Verb.kDone_Verb:
            break
        if verb == skia.Path.Verb.kMove_Verb:
            out.append(f"M{f(pts[0])}")
        elif verb == skia.Path.Verb.kLine_Verb:
            out.append(f"L{f(pts[1])}")
        elif verb == skia.Path.Verb.kQuad_Verb:
            out.append(f"Q{f(pts[1])} {f(pts[2])}")
        elif verb == skia.Path.Verb.kConic_Verb:
            q = skia.Path.ConvertConicToQuads(pts[0], pts[1], pts[2], it.conicWeight(), 2)
            for i in range(1, len(q), 2):
                out.append(f"Q{f(q[i])} {f(q[i + 1])}")
        elif verb == skia.Path.Verb.kCubic_Verb:
            out.append(f"C{f(pts[1])} {f(pts[2])} {f(pts[3])}")
        elif verb == skia.Path.Verb.kClose_Verb:
            out.append("Z")
    return _round("".join(out))


def svg(view_w, view_h, body, title):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {view_w:g} {view_h:g}" '
            f'width="{view_w:g}" height="{view_h:g}" role="img" aria-labelledby="title">\n'
            f'  <title id="title">{title}</title>\n{body}\n</svg>\n')


def wordmark(font_path: str, text="StoragePilot", tracking=-10):
    """Shape with HarfBuzz (kerning), outline with fontTools. Returns (d, width, cap_height, bottom) in font units, y-down."""
    tt = TTFont(font_path)
    tt.flavor = None  # HarfBuzz can't read WOFF; hand it plain sfnt bytes
    raw = io.BytesIO()
    tt.save(raw)
    hbfont = hb.Font(hb.Face(hb.Blob(raw.getvalue())))
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(hbfont, buf, {"kern": True, "liga": True})
    gs = tt.getGlyphSet()
    order = tt.getGlyphOrder()
    cap = tt["OS/2"].sCapHeight
    pen = SVGPathPen(gs)
    bounds = BoundsPen(gs)
    x = 0
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        t = (1, 0, 0, -1, x + pos.x_offset, cap)
        gs[order[info.codepoint]].draw(TransformPen(pen, t))
        gs[order[info.codepoint]].draw(TransformPen(bounds, t))
        x += pos.x_advance + tracking
    return pen.getCommands(), x - tracking, cap, bounds.bounds[3]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--font", required=True, help="IBM Plex Sans SemiBold (.ttf/.otf/.woff)")
    args = ap.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)

    regular = fit(merge_mark(28))
    reversed_ = fit(merge_mark(26))  # light-on-dark reads heavier; thin slightly
    small = fit(merge_mark(40, lanes=(60, 128, 196), x0=28, x1=52, cx=100, xm=146, arrow=(150, 218, 68)), margin=16)

    def sym(name, path, color, title="StoragePilot"):
        body = f'  <path fill="{color}" d="{d_of(path)}"/>'
        (OUT / name).write_text(svg(256, 256, body, title))

    sym("storagepilot-symbol.svg", regular, INK)
    sym("storagepilot-symbol-black.svg", regular, "#000000")
    sym("storagepilot-symbol-amber.svg", regular, AMBER)
    sym("storagepilot-symbol-reversed.svg", reversed_, AMBER)
    sym("storagepilot-symbol-white.svg", reversed_, WHITE)
    sym("storagepilot-symbol-small.svg", small, INK)
    sym("storagepilot-symbol-small-amber.svg", small, AMBER)

    # Wordmark in font units → scale to cap height 100.
    wd, ww, cap, bottom = wordmark(args.font)
    ws = 100 / cap
    wm_w = ww * ws
    wm_h = bottom * ws  # includes descenders (g, p)
    (OUT / "storagepilot-wordmark.svg").write_text(svg(
        round(wm_w + 0.5), round(wm_h + 0.5), f'  <path fill="{INK}" transform="scale({ws:.5f})" d="{wd}"/>', "StoragePilot"))

    # Symbol metrics (regular master): visible height drives lockup proportions.
    sb = regular.computeTightBounds()
    unit = 28  # lane width = clear-space / spacing unit, in symbol units

    def lockups(sym_path, sym_color, word_color, suffix):
        # Horizontal: symbol height = 1.45 × cap height; gap = 2 lane widths.
        ss = 145 / sb.height()
        gap = 2 * unit * ss
        sx = -sb.left() * ss
        sy = -sb.top() * ss
        wx = sb.width() * ss + gap
        wy = (145 - 100) / 2
        w = wx + wm_w
        body = (f'  <g id="symbol"><path fill="{sym_color}" transform="translate({sx:.2f} {sy:.2f}) scale({ss:.5f})" d="{d_of(sym_path)}"/></g>\n'
                f'  <g id="wordmark"><path fill="{word_color}" transform="translate({wx:.2f} {wy:.2f}) scale({ws:.5f})" d="{wd}"/></g>')
        h = max(145, wy + wm_h)
        (OUT / f"storagepilot-horizontal-{suffix}.svg").write_text(svg(round(w + 0.5), round(h + 0.5), body, "StoragePilot"))

        # Stacked: symbol height = 1.8 × cap height, centred over the wordmark.
        ss2 = 180 / sb.height()
        sw2 = sb.width() * ss2
        gap2 = 2 * unit * ss2
        w2 = max(sw2, wm_w)
        body2 = (f'  <g id="symbol"><path fill="{sym_color}" transform="translate({(w2 - sw2) / 2 - sb.left() * ss2:.2f} {-sb.top() * ss2:.2f}) scale({ss2:.5f})" d="{d_of(sym_path)}"/></g>\n'
                 f'  <g id="wordmark"><path fill="{word_color}" transform="translate({(w2 - wm_w) / 2:.2f} {180 + gap2:.2f}) scale({ws:.5f})" d="{wd}"/></g>')
        (OUT / f"storagepilot-stacked-{suffix}.svg").write_text(svg(round(w2 + 0.5), round(180 + gap2 + wm_h + 0.5), body2, "StoragePilot"))

    lockups(regular, INK, INK, "light")
    lockups(reversed_, AMBER, PAPER, "dark")
    lockups(regular, "#000000", "#000000", "black")
    lockups(reversed_, WHITE, WHITE, "white")
    print("wrote", len(list(OUT.glob("*.svg"))), "files to", OUT)


if __name__ == "__main__":
    main()
