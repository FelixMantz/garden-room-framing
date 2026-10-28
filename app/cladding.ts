import { wallBattenPlan } from './cladding-battens';
/** Shared cladding proposal. Verify the installed lap depth on a physical sample. */
export const CLADDING = {
  cavity: 25, envelope: 32, trimProud: 3, trimThickness: 22,
  cornerFront: 100, cornerReturn: 78, cornerClearance: 0, concealedEndClearance: 10,
};
export function claddingCorner() {
  const c = CLADDING;
  const battenOuter = -11 - c.cavity;
  const claddingOuter = battenOuter - c.envelope;
  const trimInner = claddingOuter - c.cornerClearance;
  const trimOuter = trimInner - c.trimThickness;
  return { ...c, battenOuter, claddingOuter, trimOuter, trimInner,
    cornerProud: c.trimThickness + c.cornerClearance,
    frontStart: battenOuter + c.concealedEndClearance,
    sideStart: battenOuter + c.concealedEndClearance,
    frontEnd: trimOuter + c.cornerFront,
    returnEnd: trimInner + c.cornerReturn,
    returnOverall: c.cornerReturn + c.trimThickness,
    frontBatten: { x: 0, y: battenOuter, w: 50, h: c.cavity },
    sideBatten: { x: battenOuter, y: 3, w: c.cavity, h: 50 } };
}
export const CLADDING_ORDER = [
  { section: '175 mm heavy featheredge (nominal 32 mm)', quantity: 60, length: 4.8, unit: 10, purpose: 'All four elevations and both gables; ordered D2D 25136', url: 'https://d2dtimber.co.uk/product/32mm-x-175mm-treated-featheredge-cladding-7/' },
  { section: '22 x 100 mm brown gravel boards', quantity: 9, length: 4.8, unit: 7, purpose: '4 lengths for corners (two full-width faces, two ripped to 78 mm); 5 for opening trims', url: 'https://d2dtimber.co.uk/product/22mm-x-100mm-treated-gravel-boards-4-x-1/' },
  { section: 'Reclaimed painted nominal 25 x 50 mm battens REC2121', quantity: wallBattenPlan().orderLengths, length: 2.1, unit: 1, purpose: 'Ordered wall stock; verify sound condition, usable section and exterior-cavity suitability', url: 'https://d2dtimber.co.uk/product/25mm-x-50mm-reclaimed-painted-timber-batten-2-x-1-2-1m/' },
];
export const CLADDING_DELIVERY = 40;
export const CLADDING_GOODS = CLADDING_ORDER.reduce((sum, item) => sum + item.quantity * item.unit, 0);
