"""Bake small, dependency-free SVG maps for the static portfolio."""
import json
import math
import tempfile
import urllib.request
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets" / "travel-map"
ASSETS.mkdir(parents=True, exist_ok=True)
SOURCE = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_land.geojson"
CACHE = Path(tempfile.gettempdir()) / "aboutme-ne-50m-land.geojson"
if not CACHE.exists():
    urllib.request.urlretrieve(SOURCE, CACHE)
features = json.loads(CACHE.read_text(encoding="utf-8"))["features"]

# Approximate city centres; Mallorca and Malta use island centres.
PLACES = [
    ("Shanghai", 121.4737, 31.2304),
    ("Wuxi", 120.3119, 31.4912),
    ("Suzhou", 120.5853, 31.2989),
    ("Hangzhou", 120.1551, 30.2741),
    ("Chengdu", 104.0665, 30.5728),
    ("Chongqing", 106.5516, 29.5630),
    ("Beijing", 116.4074, 39.9042),
    ("Qinhuangdao", 119.6005, 39.9354),
    ("Zhenjiang", 119.4250, 32.1878),
    ("Tokyo", 139.6917, 35.6895),
    ("Munich", 11.5820, 48.1351),
    ("Zurich", 8.5417, 47.3769),
    ("Florence", 11.2558, 43.7696),
    ("Bologna", 11.3426, 44.4949),
    ("Venice", 12.3155, 45.4408),
    ("Mallorca", 3.0176, 39.6953),
    ("Malta", 14.3754, 35.9375),
    ("Karlsruhe", 8.4037, 49.0069),
    ("Heidelberg", 8.6724, 49.3988),
    ("Nuremberg", 11.0767, 49.4521),
    ("Mannheim", 8.4660, 49.4875),
    ("Stuttgart", 9.1829, 48.7758),
    ("Pittsburgh", -79.9959, 40.4406),
]
VIEWS = {
    "world": ((-180, -60, 180, 84), 220, "World"),
    "europe": ((-12, 33, 26, 56), 190, "Europe"),
    "east-asia": ((96, 22, 146, 44), 200, "East Asia"),
}
metadata = {}
for key, (bounds, columns, label) in VIEWS.items():
    west, south, east, north = bounds
    step = (east - west) / columns
    rows = math.ceil((north - south) / step)
    mask = Image.new("1", (columns * 4, rows * 4), 0)
    draw = ImageDraw.Draw(mask)
    def project(point):
        return ((point[0] - west) / step * 4, (north - point[1]) / step * 4)
    for feature in features:
        geom = feature["geometry"]
        polygons = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
        for polygon in polygons:
            for i, ring in enumerate(polygon):
                if max(p[0] for p in ring) < west or min(p[0] for p in ring) > east:
                    continue
                if max(p[1] for p in ring) < south or min(p[1] for p in ring) > north:
                    continue
                draw.polygon([project(p) for p in ring], fill=0 if i else 1)
    scale = min(1100 / (east - west), 450 / (north - south))
    unit = step * scale
    ox = (1100 - (east - west) * scale) / 2
    oy = (450 - (north - south) * scale) / 2
    size = unit * 0.78
    inset = (unit - size) / 2
    cells = []
    land_count = 0
    for row in range(rows):
        col = 0
        while col < columns:
            if not mask.getpixel((col * 4 + 2, row * 4 + 2)):
                col += 1
                continue
            start = col
            while col < columns and mask.getpixel((col * 4 + 2, row * 4 + 2)):
                col += 1
            land_count += col - start
            x, y = ox + start * unit, oy + row * unit
            run = (col - start) * unit
            cells.append(f"M{x:.2f} {y:.2f}h{run:.2f}v{unit:.2f}h-{run:.2f}z")
    visited = {}
    for name, lon, lat in PLACES:
        if west <= lon <= east and south <= lat <= north:
            cell = (math.floor((lon - west) / step), math.floor((north - lat) / step))
            visited.setdefault(cell, []).append(name)
    markers = []
    for (col, row), names in visited.items():
        x, y = ox + col * unit + inset, oy + row * unit + inset
        markers.append(f'<rect x="{x:.2f}" y="{y:.2f}" width="{size:.2f}" height="{size:.2f}"><title>{", ".join(names)}</title></rect>')
    title = f"{label}: visited places in black"
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 450" role="img" aria-labelledby="title desc">
<title id="title">{title}</title>
<desc id="desc">{'; '.join(name for names in visited.values() for name in names)}. A pixelated land map without borders.</desc>
<defs><pattern id="land-pixels" x="{ox:.6f}" y="{oy:.6f}" width="{unit:.6f}" height="{unit:.6f}" patternUnits="userSpaceOnUse"><rect x="{inset:.6f}" y="{inset:.6f}" width="{size:.6f}" height="{size:.6f}" fill="#c9c4b8"/></pattern></defs>
<path fill="url(#land-pixels)" d="{''.join(cells)}"/>
<g fill="#151515" stroke="#151515" stroke-width="1.25" paint-order="stroke" stroke-linejoin="miter">{''.join(markers)}</g>
</svg>
'''
    (ASSETS / f"{key}.svg").write_text(svg, encoding="utf-8", newline="\n")
    metadata[key] = {"places": sum(map(len, visited.values())), "blackPixels": len(visited), "landPixels": land_count}
print(json.dumps(metadata, indent=2))
