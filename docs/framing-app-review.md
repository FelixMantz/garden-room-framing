# Garden room drawing set: maintenance guide

The default specification is the primary output. `npm run build` generates `public/garden-room-framing-set.pdf` before building the app. The direct PDF link and the default HTTP export use the same deterministic generator. The generated file is a build artifact, not a second maintained drawing.

## Specification and supported adjustments

`app/framing.ts` owns the named garden-room specification and wall member calculations. The fixed set-out is 4,995 × 2,995 mm inside 100 mm brickwork, 45 × 95 mm framing, California corners, two top plates, four 70 mm brick courses, 137 mm floor build-up and the measured openings. Grid offsets are front 45, rear 45, left 45 and right 205 mm. The live optimiser has been removed.

`app/specification.ts` lists the ten supported roof adjustments and their input ranges. These cover pitch, eaves/gable overhangs, ridge section, rafter spacing and tie arrangement/section. `app/settings-schema.ts` validates these adjustments and rejects changed fixed fields, unknown fields and unsafe numeric values. Geometry validation checks whether the resulting arrangement fits. Changing the footprint, openings or floor specification is a deliberate code change requiring a new default PDF review.

## Drawing and document architecture

- `app/framing-pdf.ts`: ordered page registry and validation.
- `app/pdf/walls.ts`: shared wall elevations and separate cutting schedules.
- `app/pdf/roof.ts`: shared roof plan, roof schedules and rafter detail.
- `app/pdf/door.ts`: door elevation and separate component/level schedule.
- `app/pdf/layout.ts`: semantic material hatches, text metrics and dimension helpers.
- `app/pdf/svg.ts`: SVG adapter consuming the same geometry and annotations as PDF pages.
- `app/pdf/document.ts`: PDF serialization.
- `app/door-assembly.ts`: measured leaf, frame, clearance and level calculations.

The screen wall elevations and roof plan call the same page functions as PDF export. There is no independently maintained screen elevation or overview-PDF drawing. The construction-detail sketches remain explanatory views of the same specification.

## PDF page order

Each technical wall elevation is immediately followed by its cutting schedule: front (1–2), rear (3–4), left gable (5–6), right gable (7–8). Roof plan and schedules occupy pages 9–10, rafter cut detail page 11, door elevation and component schedules pages 12–13, drawing key page 14. Page numbering follows the registry, not hard-coded page offsets.

Wall schedules count all plates and the four gable rafters. `roofCutSchedule` counts only additional roof members: 26 field rafters, four fly rafters, three ties, one ridge and eight outriggers at defaults. This avoids double-counting. Cut lengths follow the drawing model; procurement waste, stock optimisation and unmodelled fixings/cladding are outside the schedule.

## Repository scope

Unused UI catalog components, database examples, image optimisation plumbing and their dependencies have been removed. The app retains its existing React/Vinext hosting architecture. No database or image service is required.

## Verification workflow

Run `npm run build`, `node --test tests/*.test.mjs` and `npx tsc --noEmit`. Tests cover member intersections, ridge/birdsmouth geometry, symmetry, roof counts, rejected unsupported settings, GET/POST/download equivalence, default artifact equality and PDF page order. Render all default PDF pages after changes to layout or specification and inspect their text bounds and visual spacing.

The established default datums remain: slab 0, threshold top 70, door opening base 92, FFL/cill top 137, dwarf wall 280, wall frame 2,077 and wall top 2,220 above FFL. Full-height stud length is 1,942 mm. Schedule lengths retain 0.1 mm precision.

This is a drawing/model consistency tool. The existing provisional door allowances and structural member sizing remain design assumptions; the software checks do not establish structural adequacy. In particular, the full-width 95 mm birdsmouth at 25 degrees removes approximately 40.1 mm normal to the rafter. Ridge/tie/rafter joints and fixing design are not specified by these drawings.
