import { textWidth } from '../pdf-font-widths';
import type { Settings } from '../framing';
import { windowCillModel, type WindowCillOptions } from '../window-cill';
import { canvas, fmt, hTechnical, vTechnical, type Fill } from './layout';

/** Shared PDF/SVG section; window and cill internals are schematic, set-out is dimensional. */
export function drawWindowCill(s: Settings, page: number, total: number, c = canvas(), options: Partial<WindowCillOptions> = {}) {
  const m = windowCillModel(s, options), k = .5, ox = 92, oy = 129;
  const X = (x: number) => ox + x * k, Y = (z: number) => oy - z * k;
  const black = [0, 0, 0], white = [255, 255, 255];
  const line = (a: number, b: number, d: number, e: number, w = .2, dash: number[] | null = null) => c.line(X(a), Y(b), X(d), Y(e), black, w, dash);
  const rect = (x: number, z: number, w: number, h: number, fill: Fill = white) => c.rect(X(x), Y(z + h), w * k, h * k, fill, black, .2);
  const poly = (p: number[][], fill: Fill = white) => c.polygon(p.map(([x, z]) => [X(x), Y(z)]), fill, black, .25);
  const leader = (label: string, x: number, z: number, tx: number, ty: number) => {
    const end = tx < 90 ? tx + textWidth(label, 7, true) * 25.4 / 72 + 2 : tx - 2;
    c.line(X(x), Y(z), end, ty - 1, black, .13); c.rect(X(x) - .4, Y(z) - .4, .8, .8, black, black, 0); c.text(label, tx, ty, 7, true);
  };
  c.text('Window cill - wall section and front elevation', 12, 11, 14, true);
  c.text('All four brown softwood-clad elevations | vertical section through lower window | dimensions in mm | do not scale', 12, 18, 7.5);
  c.text('Frame position is a study assumption, not a confirmed installation datum. Profiles / seals shown schematically.', 12, 24, 7.2);
  c.text('INSIDE', 27, 33, 8, true); c.text('OUTSIDE', 146, 33, 8, true);
  // Wall beneath opening: sill saddle on cripple/bay, with lining and outer weathering.
  rect(-s.studDepth, -45, s.studDepth, 45, 'timber');
  rect(-s.studDepth, -120, s.studDepth - 5, 75);
  c.text('90 PIR*', X(-s.studDepth / 2), Y(-90), 7, true, 'center');
  rect(-s.studDepth - 12.5, -120, 12.5, 120, 'floor');
  rect(0, -120, m.osb, 120, 'floor');
  line(m.osbOuter, -120, m.osbOuter, -18, .55);
  for (const x of [m.osbOuter, m.battenOuter]) line(x, -120, x, -18, .15, [2, 1]);
  for (let z = -120; z < -15; z += 65) {
    const top = Math.min(z + 80, -15);
    poly([[m.battenOuter, z], [m.claddingFace, z], [m.battenOuter + 5, top], [m.battenOuter, top]], 'timber');
  }
  // Weather face is the maximum lap / trim envelope used in the projection calculation.
  line(m.weatherFace, -120, m.weatherFace, 24, .13, [2, 1]);
  if (m.trimProud > 0) rect(m.claddingFace, -42, m.trimProud, 27, 'timber');
  for (let x = m.osbOuter + 2; x < m.battenOuter; x += 4) line(x, -18, x + 1, -21, .18);
  // Window board is indicative, not an invented 150 mm deep reveal.
  rect(-s.studDepth - 24, 17, m.frameBack + s.studDepth + 24, 18, 'timber');
  // Cill 30 mm heel height and 5 mm illustrative bedding/packing zone.
  const f = m.frameOuterOffset, b = m.frameBack, n = m.cillNose;
  rect(b + 8, 0, 15, 5, 'plate');
  poly([[b, 5], [b, 35], [f - 4, 35], [f + 3, 29], [n - 3, 20], [n, 16], [n, -3], [n - 3, -3], [n - 3, 8], [f, 8], [f, 5]]);
  line(b + 3, 11, f - 5, 11, .13); line(b + 3, 25, f - 7, 25, .13);
  // Schematic outer frame, opening sash and double glazing; no proprietary sightline inferred.
  rect(b, 35, m.frameDepth, 60);
  rect(b + 7, 44, m.frameDepth - 14, 40);
  const glassCentre = (b + f) / 2;
  for (const dx of [-14, -10, 10, 14]) line(glassCentre + dx, 95, glassCentre + dx, 125, .25);
  line(glassCentre - 14, 95, glassCentre + 14, 95, .4);
  // Sill tray has rear upstand, laps onto breather membrane; VCL seals to inner frame.
  line(b - 2, 15, b - 2, 1, .4, [1, .7]); line(b - 2, 1, m.osbOuter, 1, .4, [1, .7]);
  line(m.osbOuter, 1, m.osbOuter, -25, .4, [1, .7]);
  line(-5, -120, -5, -45, .45, [2, .7]); line(-5, -45, -s.studDepth, -45, .45, [2, .7]);
  line(-s.studDepth, -45, -s.studDepth, 10, .45, [2, .7]); line(-s.studDepth, 10, b, 40, .45, [2, .7]);
  // Short rain arrow and drip; drainage outlet at front of frame must stay open.
  line(f + 7, 25, n - 5, 15, .35); line(n - 5, 15, n - 11, 14, .35); line(n - 5, 15, n - 10, 19, .35);
  line(n, -7, n, -18, .3); line(n, -18, n - 3, -13, .3); line(n, -18, n + 3, -13, .3);
  // Dimensions: frame/cill above, substrate chain below; avoid crossing notes.
  hTechnical(c, X(b), X(n), Y(35), 41, `${fmt(m.cillDepth)} cill overall`, 7.5);
  hTechnical(c, X(b), X(f), Y(95), 52, '70 frame', 7);
  hTechnical(c, X(f), X(n), Y(29), 62, `${fmt(m.cillDepth - m.frameDepth)} beyond frame`, 7);
  hTechnical(c, X(m.weatherFace), X(n), Y(-30), 163, `${fmt(m.projection)} clear`, 7.5);
  vTechnical(c, Y(5), Y(35), X(b), 43, '30 cill', 6.5, 'left');
  hTechnical(c, X(-s.studDepth), X(0), Y(-120), 188, `${fmt(s.studDepth)} stud / sill saddle`, 7);
  hTechnical(c, X(0), X(m.osbOuter), Y(-120), 178, fmt(m.osb), 6.5);
  hTechnical(c, X(m.osbOuter), X(m.battenOuter), Y(-120), 188, '25 cavity', 6.5);
  hTechnical(c, X(m.battenOuter), X(m.claddingFace), Y(-120), 178, fmt(m.claddingEnvelope), 6.5);
  leader('Double glazing (schematic)', glassCentre + 14, 116, 127, 70);
  leader('Flush uPVC frame', f, 65, 134, 85);
  leader('Window board', -s.studDepth - 17, 26, 12, 104);
  leader('Inner airtight / VCL seal', -s.studDepth, 5, 12, 122);
  leader('Sill saddle', -s.studDepth + 38, -22, 12, 151);
  leader('Drained cavity + mesh', m.battenOuter - 9, -19, 134, 146);
  hTechnical(c, X(-s.studDepth - 12.5), X(-s.studDepth), Y(-120), 178, '12.5', 6.5);
  leader('Breather membrane', m.osbOuter, -98, 134, 174);
  c.text('12.5 plasterboard | timber / PIR | 11 OSB | membrane | 25 cavity | brown softwood featheredge', 12, 196, 6.8);
  // Outside elevation: the right-hand front unit, with the fixed pane towards the door.
  // Frame sightlines and trim widths are indicative; only overall order sizes are dimensioned.
  c.line(185, 30, 185, 198, black, .2);
  c.text('FRONT ELEVATION', 193, 33, 8.5, true);
  c.text('Outside view - right-hand front window', 193, 39, 7.2);
  const ek = .065, ex = 210, ey = 65, fw = 1000 * ek, fh = 1000 * ek, ch = 30 * ek;
  const trim = 100 * ek, rim = 60 * ek, mullion = 60 * ek;
  // Horizontal featheredge courses stop against the external trims.
  c.rect(202, 58, 82, 86, white, black, .15);
  for (let yy = 62; yy < 144; yy += 125 * ek) c.line(202, yy, 284, yy, black, .18);
  c.rect(ex - trim, ey - trim, trim, fh + trim, 'timber', black, .2);
  c.rect(ex + fw, ey - trim, trim, fh + trim, 'timber', black, .2);
  c.rect(ex, ey - trim, fw, trim, 'timber', black, .2);
  // Dashed structural aperture and liner outline remain behind the exposed trim.
  for (const xx of [ex - 5 * ek, ex + fw + 5 * ek]) c.line(xx, ey - 5 * ek, xx, ey + fh + ch + 5 * ek, black, .18, [1, .7]);
  c.line(ex - 5 * ek, ey - 5 * ek, ex + fw + 5 * ek, ey - 5 * ek, black, .18, [1, .7]);
  c.rect(ex, ey, fw, fh, white, black, .35);
  c.rect(ex + rim, ey + rim, fw - 2 * rim, fh - 2 * rim, white, black, .2);
  const centre = ex + fw / 2;
  c.rect(centre - mullion / 2, ey + rim, mullion, fh - 2 * rim, white, black, .2);
  // Opening sash on the right, outer-edge hinges. Fixed glazing on the left.
  const sashX = centre + mullion / 2, sashY = ey + rim;
  const sashW = fw / 2 - mullion / 2 - rim, sashH = fh - 2 * rim;
  c.rect(sashX + 2.5, sashY + 2.5, sashW - 5, sashH - 5, white, black, .18);
  const gx = sashX + 2.5, gy = sashY + 2.5, gr = sashX + sashW - 2.5, gb = sashY + sashH - 2.5;
  c.line(gx, gy, gr, (gy + gb) / 2, black, .2, [1.3, .7]);
  c.line(gr, (gy + gb) / 2, gx, gb, black, .2, [1.3, .7]);
  const lx=ex+rim, lw=fw/2-mullion/2-rim;
  c.rect(lx+2.5,sashY+2.5,lw-5,sashH-5,white,black,.18);
  c.line(lx+lw-2.5,gy,lx+2.5,(gy+gb)/2,black,.2,[1.3,.7]);
  c.line(lx+2.5,(gy+gb)/2,lx+lw-2.5,gb,black,.2,[1.3,.7]);
  c.text('OPENER',lx+lw/2,ey+fh/2,7,true,'center');
  c.text('OPENER', (gx + gr) / 2, ey + fh / 2 + 10, 6.5, true, 'center');
  // Cill horns are the supplier's standard 50 mm each side, with end caps shown.
  const cx = ex - 50 * ek, cw = 1100 * ek, cy = ey + fh;
  c.rect(cx, cy, cw, ch, white, black, .3);
  c.line(cx, cy + ch * .65, cx + cw, cy + ch * .65, black, .15);
  for (const xx of [cx, cx + cw - .7]) c.rect(xx, cy, .7, ch, white, black, .2);
  // Head drip is tucked behind the membrane; not a dimensioned fabricated profile.
  c.line(ex - trim - 1, ey - trim - .8, ex + fw + trim + 1, ey - trim - .8, black, .45);
  c.line(ex + fw + trim + 1, ey - trim - .8, ex + fw + trim + 1, ey - trim + .4, black, .3);
  hTechnical(c, ex, ex + fw, ey, 49, '1000 overall frame', 7);
  vTechnical(c, ey, ey + fh + ch, ex + fw, 290, '1030 incl. cill', 7);
  hTechnical(c, cx, cx + cw, cy + ch, 150, '1100 cill incl. 50 horns', 7);
  const elevationLeader = (label: string, px: number, py: number, tx: number, ty: number) => {
    const end = tx + textWidth(label, 6.7, true) * 25.4 / 72 + 1.5;
    c.line(px, py, end, ty - 1, black, .13); c.rect(px - .3, py - .3, .6, .6, black, black, 0); c.text(label, tx, ty, 6.7, true);
  };
  elevationLeader('Head drip', ex + 12, ey - trim - .8, 193, 56);
  const keyedPart = (number: string, label: string, px: number, py: number, ty: number) => {
    c.rect(px - 1.7, py - 2.6, 3.4, 3.4, white, black, .15);
    c.text(number, px, py, 6.5, true, 'center');
    c.text(`${number}  ${label}`, 193, ty, 7, true);
  };
  keyedPart('1', 'External reveal trim', ex - trim / 2, ey + 23, 160);
  keyedPart('2', 'Reveal lining (concealed / dashed)', ex - 5 * ek, ey + 44, 169);
  keyedPart('3', 'uPVC outer frame and mullion', centre, ey + fh - 1, 178);
  keyedPart('4', 'Cill with sealed end caps', cx + cw - 1.5, cy + ch / 2 + .7, 187);
  c.text('* Cladding depth is the maximum installed lap / trim envelope; provisional 32 mm laps + 3 mm trim; verify on sample. PIR: 90 mm nominal wall specification.', 12, 202, 6.3);
  c.text(`Garden room framing set | window cill section | page ${page} of ${total}`, 148.5, 208, 6.4, false, 'center');
  return c.stream();
}
