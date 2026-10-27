import type { Settings } from './framing';
import { CLADDING } from './cladding';
import { OSB_STOCK } from './sheathing';

/** External stud face = 0; positive offsets are towards the garden. */
export const WINDOW_CILL_DEFAULTS = {
  cillDepth: 150,
  frameOuterOffset: OSB_STOCK.thickness,
  claddingEnvelope: CLADDING.envelope,
  trimProud: CLADDING.trimProud,
};
export type WindowCillOptions = typeof WINDOW_CILL_DEFAULTS;
export function windowCillModel(s: Settings, options: Partial<WindowCillOptions> = {}) {
  const o = { ...WINDOW_CILL_DEFAULTS, ...options };
  const frameDepth = 70, cillHeight = 30, cavity = 25, target = 40;
  const osbOuter = OSB_STOCK.thickness, battenOuter = osbOuter + cavity;
  const claddingFace = battenOuter + o.claddingEnvelope;
  const weatherFace = claddingFace + o.trimProud;
  const frameBack = o.frameOuterOffset - frameDepth;
  const cillNose = frameBack + o.cillDepth;
  const projection = cillNose - weatherFace;
  return {
    ...o, studDepth: s.studDepth, osb: OSB_STOCK.thickness, osbOuter, cavity,
    battenOuter, claddingFace, weatherFace, frameDepth, cillHeight, frameBack,
    cillNose, projection, target, meetsTarget: projection >= target,
    requiredFrameOffset: weatherFace + target + frameDepth - o.cillDepth,
    options: [95, 150, 180].map(depth => ({ depth, projection: frameBack + depth - weatherFace })),
  };
}
