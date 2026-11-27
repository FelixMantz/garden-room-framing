import type { Settings } from './framing';
import { roofEnvelope } from './roof-envelope';

export const FASCIA = {
  width: 200, thickness: 18, stockLength: 5000, stockCount: 4, kerf: 3,
  trialBlank: 2170, boxStockLength: 1250, boxStockWidth: 450, boxBlankLength: 250,
  soffitWidth: 200, soffitThickness: 9, soffitGableBlank: 2100,
  eavesPIRDepth: 178, vergePIRDepth: 202, wallWrapGap: 215,
  wallBatten: 25, claddingEnvelope: 32, lipDrop: 5,
} as const;

export function fasciaPlan(settings: Settings) {
  const roof = roofEnvelope(settings);
  const pitch = settings.roofPitch * Math.PI / 180;
  const cos = Math.cos(pitch), tan = Math.tan(pitch);
  const ridgeFaceRun = roof.deck.deckSlope;
  const halfRidge = settings.ridgeWidth / (2 * cos);
  const centreRun = ridgeFaceRun + halfRidge;
  const fasciaExtension = FASCIA.thickness / cos;
  const endAllowance = FASCIA.width * tan;
  const soffitDepth = FASCIA.wallWrapGap - FASCIA.wallBatten - FASCIA.claddingEnvelope;
  const boxFaceWidth = soffitDepth + FASCIA.thickness;
  const edgeLength = centreRun + fasciaExtension - boxFaceWidth / cos;
  const blankLength = edgeLength + endAllowance;
  const eavesRun = roof.width, eavesHalf = eavesRun / 2;
  const remaining = FASCIA.stockLength - eavesHalf - blankLength - 2 * FASCIA.kerf;
  const levelSoffitDepth = FASCIA.eavesPIRDepth + FASCIA.soffitThickness;
  const slopeSoffitDepth = (FASCIA.vergePIRDepth + FASCIA.soffitThickness) / cos;
  return {
    eavesRun, eavesHalf, ridgeFaceRun, halfRidge, centreRun, fasciaExtension,
    endAllowance, edgeLength, blankLength, remaining, fits: remaining >= 0,
    trialSpare: FASCIA.trialBlank - blankLength,
    soffitDepth, levelSoffitDepth,
    eavesFaceDepth: levelSoffitDepth + FASCIA.lipDrop,
    boxFaceWidth,
    soffitStep: levelSoffitDepth - slopeSoffitDepth + soffitDepth * tan,
    boxOffcut: FASCIA.boxStockLength - FASCIA.stockCount * (FASCIA.boxBlankLength + FASCIA.kerf),
    soffitOffcut: FASCIA.stockLength - eavesHalf - FASCIA.soffitGableBlank - 2 * FASCIA.kerf,
    finishedEavesOverhang: roof.roof.eavesTailRun + FASCIA.thickness,
    finishedGableOverhang: roof.roof.gableOverhang - roof.roof.fasciaThickness + FASCIA.thickness,
    retainedTileProjection: roof.batten.tileProjection + roof.roof.fasciaThickness - FASCIA.thickness,
  };
}
