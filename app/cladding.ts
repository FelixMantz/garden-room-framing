/** Shared cladding proposal. Verify the installed lap depth on a physical sample. */
export const CLADDING = {
  cavity: 25, envelope: 32, trimProud: 3, trimThickness: 22,
  cornerFront: 125, cornerReturn: 100, cornerClearance: 0, concealedEndClearance: 10,
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
    returnOverall: c.cornerReturn + c.trimThickness };
}
export const CLADDING_ORDER = [
  { section: '175 mm heavy featheredge (nominal 32 mm)', quantity: 60, length: 4.8, unit: 10, purpose: 'All four elevations and both gables; provisional cutting allowance', url: 'https://d2dtimber.co.uk/product/32mm-x-175mm-treated-featheredge-cladding-7/' },
  { section: '22 x 100 mm brown gravel boards', quantity: 7, length: 4.8, unit: 7, purpose: '2 lengths for four corner returns; 5 lengths for opening face trims', url: 'https://d2dtimber.co.uk/product/22mm-x-100mm-treated-gravel-boards-4-x-1/' },
  { section: '22 x 125 mm brown gravel boards', quantity: 2, length: 4.8, unit: 4.5, purpose: 'Four full-height corner faces; two pieces from each stock length', url: 'https://d2dtimber.co.uk/product/22mm-x-125mm-treated-brown-gravel-boards-5-x-1/' },
];
export const CLADDING_DELIVERY = 40;
export const CLADDING_GOODS = CLADDING_ORDER.reduce((sum, item) => sum + item.quantity * item.unit, 0);
