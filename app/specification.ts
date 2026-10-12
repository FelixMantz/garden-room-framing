/**
 * MASTER SPECIFICATION SYNC - REQUIRED FOR PROJECT CHANGES
 *
 * Garden Room Design Specification - MASTER:
 * https://docs.google.com/document/d/1ILhSBko2Po7cq2c5KZfn3nbhcgPIh1S5PD6NR_BnrPw/edit
 *
 * Read the current master spec before changing dimensions, materials, openings,
 * roof/wall/floor layers, cutting quantities, fixings or construction details.
 * Update the relevant master-spec sections in the same task as the app, including
 * dependent schedules, quantities and budget allocations. Update all affected
 * app diagrams and regenerate the technical PDF too.
 *
 * Resolve discrepancies using the owner's latest confirmed/as-built decisions;
 * neither an older spec paragraph nor an older app drawing is automatically right.
 * If the master spec cannot be read or updated, report that limitation explicitly.
 * Do not claim the app and master spec are synchronised without checking both.
 * See repository AGENTS.md for the maintenance workflow.
 */
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
