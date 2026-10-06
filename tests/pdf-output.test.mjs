import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("serves one twenty-two-page monochrome technical PDF with a door-level sheet", async () => {
  const pdf = (await readFile(new URL('../dist/garden-room-framing-set.pdf', import.meta.url))).toString('latin1');
  assert.equal((pdf.match(/\/Type \/Page\b/g) ?? []).length, 22);
  assert.match(pdf, /French-door front elevation and vertical build-up/);
  assert.match(pdf, /1400 LEAF HEIGHT OMITTED/);
  assert.match(pdf, /HARDWOOD CILL 40/);
  assert.match(pdf, /5 FRAME-FIT GAP/);
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
  assert.match(pdf, /door front elevation \| page 14 of 22/);
  assert.doesNotMatch(pdf, /colour PDF/);
});

test("shows only the technical PDF controls", async () => {
  const source = await readFile(new URL("../app/framing-designer.tsx", import.meta.url), "utf8");
  assert.match(source, /Open technical PDF/);
  assert.match(source, /Download technical PDF/);
  assert.doesNotMatch(source, /Open six-page PDF|Open B&amp;W PDF|name="style"/);
});
