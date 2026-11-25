import type { Settings } from './framing';
import { roofEnvelope } from './roof-envelope';

export const FASCIA = { width:225, thickness:16, stockLength:5000, stockCount:4, kerf:3, trialBlank:2170, roofOsb:11, pir:100, batten:25 } as const;

/** Finishing boards fit the existing timber; do not move the 22 mm framing set-out. */
export function fasciaPlan(s:Settings){
 const roof=roofEnvelope(s),p=s.roofPitch*Math.PI/180,cos=Math.cos(p),tan=Math.tan(p);
 const ridgeFaceRun=roof.deck.deckSlope,halfRidge=s.ridgeWidth/(2*cos);
 const centreRun=ridgeFaceRun+halfRidge;
 const fasciaExtension=FASCIA.thickness/cos,endAllowance=FASCIA.width*tan;
 const edgeLength=centreRun+fasciaExtension,blankLength=edgeLength+endAllowance;
 // Eaves boards terminate between the bargeboard inner faces; barge ends lap them.
 const eavesRun=roof.width,eavesHalf=eavesRun/2;
 const gableReserve=FASCIA.stockLength-eavesHalf-FASCIA.kerf;
 const remaining=FASCIA.stockLength-eavesHalf-blankLength-2*FASCIA.kerf;
 const totalDepth=s.studDepth+FASCIA.roofOsb+FASCIA.pir+FASCIA.batten;
 return {roof,ridgeFaceRun,halfRidge,centreRun,fasciaExtension,endAllowance,edgeLength,blankLength,
  eavesRun,eavesHalf,gableReserve,remaining,totalDepth,uncovered:Math.max(0,totalDepth-FASCIA.width),
  trialSpare:FASCIA.trialBlank-blankLength,fits:remaining>=0,
  finishedEavesOverhang:roof.roof.eavesTailRun+FASCIA.thickness,
  finishedGableOverhang:roof.roof.gableOverhang-roof.roof.fasciaThickness+FASCIA.thickness,
  retainedTileProjection:roof.batten.tileProjection+roof.roof.fasciaThickness-FASCIA.thickness,
  quote:{boards:86.76,corners:6.92,joints:5.96,delivery:32.98,vat:26.52,total:159.14},
 };
}
