import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("serves separate timber and construction PDFs with all original drawing content", async () => {
  const timber = (await readFile(new URL('../dist/garden-room-timber-framing.pdf', import.meta.url))).toString('latin1');
  const construction = (await readFile(new URL('../dist/garden-room-construction-details.pdf', import.meta.url))).toString('latin1');
  const pdf=timber+construction;
  assert.equal((timber.match(/\/Type \/Page\b/g) ?? []).length, 16);
  assert.equal((construction.match(/\/Type \/Page\b/g) ?? []).length, 17);
  assert.match(timber,/Roof framing/);
  assert.match(timber,/M10 x 180 A2 coach bolt/);
  assert.match(timber,/28 dia. counterbore/);
  assert.doesNotMatch(construction,/tie beam connection/);
  assert.match(timber,/Timber frame positioning on the dwarf wall/);
  assert.doesNotMatch(timber,/OSB wall sheet nests|Bathroom/);
  assert.match(construction,/OSB wall sheet nests/);
  assert.doesNotMatch(construction,/proposed timber order/);
  assert.match(construction,/Featheredge extends into dead corner/);
  assert.doesNotMatch(construction,/Front wall - dimensioned elevation/);
  assert.match(pdf, /French-door front elevation and vertical build-up/);
  assert.match(pdf, /1400 LEAF HEIGHT OMITTED/);
  assert.match(pdf, /PROFILED CILL 38 MAX/);
  assert.match(pdf, /7 BOTTOM FRAME-FIT GAP/);
  assert.match(pdf, /Cill top \+137 slab = 0 above FFL/);
  assert.doesNotMatch(pdf, /CRIPPLE GAP/);
  assert.match(pdf, /WALL FRAME & DOOR COMPONENTS - TOP DOWN/);
  assert.match(pdf, /FLOOR COMPONENTS - TOP DOWN/);
  assert.match(pdf, /Thickness/);
  assert.match(pdf, /Top above slab/);
  assert.match(pdf, /BRICK THRESHOLD COURSE 70/);
  assert.match(pdf, /Brick threshold course/);
  assert.match(pdf, /Brick top to opening base/);
  assert.match(pdf, /Brick threshold top \+70 slab; structural opening base \+92; 22 between/);
  assert.match(pdf, /Door threshold is one brick course: top \+70 slab; structural opening base \+92 slab/);
  assert.match(pdf, /50 mm plumb fascia face/);
  assert.match(pdf, /horizontal soffit cut/);
  assert.match(pdf, /117\.6 horizontal underside cut/);
  assert.doesNotMatch(pdf, /Concrete threshold kicker/);
  assert.ok(pdf.indexOf("Tie beam") < pdf.indexOf("Brick threshold course"), "component schedule should run from top to bottom");
  const floorSchedule = pdf.slice(pdf.indexOf("FLOOR COMPONENTS - TOP DOWN"), pdf.indexOf("DOOR ASSEMBLY"));
  assert.match(floorSchedule, /parquet/i);
  assert.doesNotMatch(floorSchedule, /Tie beam|Door lintel|Brick threshold course/);
  assert.match(pdf, /door front elevation \| page 1 of 17/);
  assert.doesNotMatch(pdf, /colour PDF/);
});

test("shows both PDF parts and adjusted export controls", async () => {
  const source = await readFile(new URL("../app/framing-designer.tsx", import.meta.url), "utf8");
  assert.match(source, /PDF_PARTS.map/);
  assert.match(source, /Open PDF/);
  assert.match(source, /Download PDF/);
  assert.match(source, /exportAdjustedPdf\(part.id/);
  assert.doesNotMatch(source, /Open six-page PDF|Open B&amp;W PDF|name="style"/);
});

