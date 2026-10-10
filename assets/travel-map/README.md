# Pixel travel maps

Land geometry: [Natural Earth 1:50m physical land](https://www.naturalearthdata.com/downloads/50m-physical-vectors/50m-land/), from the project's [GeoJSON source](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_50m_land.geojson). Natural Earth data is [public domain](https://www.naturalearthdata.com/about/terms-of-use/).

These local SVGs sample the land geometry onto a coarse square, equirectangular grid, with no country borders. Pale squares are land; black pixel stamps mark the user's visited places. Approximate city centres are snapped to the same grid; Mallorca and Malta use island centres. Black marks are drawn even when a small island is below the land grid's resolution. The world view uses enlarged 3-by-3 pixel stamps for legibility; regional views use single coarse pixels. Nearby stamps overlap naturally.

- `world.svg`: a 100-column grid, all 23 places in 14 location cells, and 83 unique black pixels after stamps overlap.
- `europe.svg`: a 90-column grid, all 12 European places in 11 location cells. Heidelberg and Mannheim share a cell at this scale.
- `east-asia.svg`: a 90-column grid, all 10 East Asian places in 10 distinct cells.

Every marked cell includes a title naming its place(s), and each SVG has an accessible title and description. The HTML also provides a complete expandable place list. All assets are served locally; changing views requires no remote map service.

To regenerate, edit `PLACES` in `scripts/generate-travel-map.py` and run `python scripts/generate-travel-map.py` with Pillow installed. The script caches the public source data in the system temporary directory and prints the place and occupied-cell counts for each view. Keep the HTML place list, captions, and image descriptions in sync when adding locations. Python and Pillow are only needed for regeneration; the website itself has no new dependencies.
