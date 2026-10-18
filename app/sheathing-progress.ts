// Wall OSB pieces confirmed cut by Felix on 14 October 2026.
// This record is scoped to wall OSB; roof PIR uses some of the same IDs.
export const CUT_WALL_OSB_IDS = [
 'RU2','RU3','B2','B3','B4','RB3','LU4','RU1',
 'RU4','B5','LU1','LB1','FH1','FH2','B1','RB4',
] as const;
const cutWallOsbIds:ReadonlySet<string>=new Set(CUT_WALL_OSB_IDS);
export const wallOsbLabel=(id:string)=>cutWallOsbIds.has(id)?`${id} [DONE]`:id;
