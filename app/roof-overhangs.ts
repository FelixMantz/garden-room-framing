/** Horizontal projections from outside wall framing to outside fascia faces. */
export const ROOF_FASCIA_THICKNESS = 22;

export function roofOverhangs(eaves:number,gable:number,rafterWidth:number){
  return {
    fasciaThickness:ROOF_FASCIA_THICKNESS,
    eavesTailRun:eaves-ROOF_FASCIA_THICKNESS,
    flyRafterProjection:gable-ROOF_FASCIA_THICKNESS-rafterWidth/2,
    outriggerRun:gable-ROOF_FASCIA_THICKNESS-rafterWidth,
  };
}
