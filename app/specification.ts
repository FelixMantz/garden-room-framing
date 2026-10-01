/** Supported adjustments. All other dimensions are the named garden-room specification. */
export const adjustmentFields = [
 ['roofPitch','Roof pitch (degrees)',15,45,1],
 ['gableOverhang','Eaves to outer fascia (mm)',22,750,1],
 ['roofGableOverhang','Gable to outer fascia (mm)',0,750,1],
 ['ridgeWidth','Ridge width (mm)',45,200,1],
 ['ridgeDepth','Ridge depth (mm)',95,400,1],
 ['rafterCentres','Rafter centres (mm)',200,600,1],
 ['tieCount','Tie count',1,9,1],
 ['tieEvery','Tie every N bays',1,6,1],
 ['tieWidth','Tie width (mm)',45,150,1],
 ['tieDepth','Tie depth (mm)',45,200,1],
] as const;
export type AdjustmentKey = typeof adjustmentFields[number][0];
