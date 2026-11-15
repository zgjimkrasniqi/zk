# HAB 13 — Interactive 3D presentation prototype

A client-presentation prototype for **Kompleksi HAB 13** by HAB Engineering.
React + TypeScript + Tailwind CSS + Three.js + React Three Fiber (drei).

> **Prototype, not production.** The 3D building is **illustrative**, floor bands and
> unit zones are **simulated overlays**, and availability is **sample data**.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # outputs dist/
npm run preview    # serves dist/ on http://localhost:4173
```

`dist/` must be served over HTTP (any static host, or `npx serve dist`); opening
`dist/index.html` directly from disk will not work.

## The 3D model

* The app checks for `public/models/residential-complex.glb` on load.
  * **Present →** the GLB is loaded, scaled to the site (~84 m across), and given shadows.
    Because the downloaded model is a generic placeholder with no identifiable
    buildings/floors/apartments, selection uses invisible **bounding volumes**
    per entrance (Hyrja A, B, C) and per floor, with highlight overlays.
    Adjust positions/sizes in `src/three/layout.ts` (`LAYOUT`) so the volumes line up with the model.
  * **Missing (current default) →** a **procedural model** modelled after the catalogue
    cover render and fitted to the real plot: Hyrja C (south-east) is a charcoal tower
    (G+16) with an open frame crown, a navy G+13 volume and a white G+7 end block; Hyrja A
    (north) is a brown tower (G+13) with an open frame crown and a white G+8 wing; Hyrja B
    (east wing) is a white G+7 mid-rise with roof gardens. Which entrance sits in which
    wing is assumed. Towers carry a vertical strip of recessed, lit balconies. Dimensions are
    approximate and not taken from drawings (see `src/three/layout.ts`).
* The UI states this in the “Illustrative 3D model” chip (bottom left).

## Real surroundings (OpenStreetMap)

`public/context.json` holds the buildings, streets and parks within ~400 m of the
Google Maps pin for Kompleksi HAB 13 (42.65725, 21.17025), drawn in muted grey so
HAB 13 stands out. The C-shaped construction footprint at the pin is used as the
plot: the HAB 13 model is fitted to it (north wing, east wing, south wing; courtyard
open to the west) and the map is rotated to line up with it. Context heights come
from OSM tags where present, otherwise estimates. Map data © OpenStreetMap
contributors (ODbL); the attribution is shown in the app.

To refresh it, export the query below from overpass-turbo.eu (Export → raw OSM data)
and run `node scripts/osm-to-context.mjs export.json`:

```
[out:json][timeout:90];
(way["building"](around:400,42.6572453,21.1702514);
relation["building"](around:400,42.6572453,21.1702514);
way["highway"](around:450,42.6572453,21.1702514);
way["landuse"](around:400,42.6572453,21.1702514);
way["leisure"](around:400,42.6572453,21.1702514););
out body geom;
```

## Data

`src/data/apartments.ts`

* **From the HAB 13 catalogue:** all 24 apartment types (Hyrja A: 12, B: 7, C: 5) with
  net areas, room schedules, floor ranges, and penthouses. Imagery in `public/catalog/`:
  `<type>-render.jpg` (furnished 3D plan) and `<type>-plan.jpg` (dimensioned floor plan),
  extracted from the catalogue PDF; `cover.jpg`/`hero.jpg` from the cover.
* **Sample data:** availability (available / reserved / sold), generated with a fixed seed
  so it is stable between reloads. Replace `buildApartments()` with real data later.
* Contact details (phones, sales email, address) are those printed in the catalogue.
  The contact form does not send anything.

## Interactions

* Orbit / zoom / pan (CameraControls), smooth camera transitions.
* Click a building (or its label / card) → camera flies to it.
* Floor selector (left panel) or click a floor in 3D → floors above become ghosted and
  the floor shows colour-coded unit zones.
* Click a unit zone, a dot in the floor list, or a row in the list → specifications,
  room schedule, catalogue 3D plan and floor plan (tap to enlarge).
* Filters: bedrooms, net-area range, availability, penthouses only. Non-matching units dim.
* Contact button (header and per-apartment) opens an enquiry form pre-filled with the unit.
* Responsive: side panels on desktop, bottom sheet with tabs on mobile.

## Structure

```
src/
  data/apartments.ts     catalogue types + sample availability
  store.ts               zustand state, filters
  three/                 Scene, procedural Block, FloorTiles, GLB loader, facade textures, layout
  ui/                    panels, apartment detail, contact modal
public/catalog/          images extracted from the catalogue
public/models/           drop residential-complex.glb here
```
