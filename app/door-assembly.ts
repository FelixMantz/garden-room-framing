import type { WallConfig } from "./framing";

// Existing measured leaves and provisional lining/clearance allowances.
export const frenchDoor = {
  fit:5, lining:40, operating:5, leftLeafWidth:589, rightLeafWidth:588,
  meetingOverlap:12, leafHeight:1980, leafThickness:43,
} as const;

export function doorAssembly(cfg:WallConfig, door:WallConfig["computedOpenings"][number]) {
  const {fit,lining,operating,leftLeafWidth,rightLeafWidth,meetingOverlap,leafHeight}=frenchDoor;
  const closedPairWidth=leftLeafWidth+rightLeafWidth-meetingOverlap;
  const requiredWidth=closedPairWidth+2*(fit+lining+operating);
  const requiredHeight=leafHeight+2*(fit+lining+operating);
  const openingBase=cfg.frameBase+door.sill, openingTop=openingBase+door.height;
  const frameBottom=openingBase+fit, cillTop=frameBottom+lining, leafBottom=cillTop+operating;
  const leafTop=leafBottom+leafHeight, headBottom=leafTop+operating, frameTop=headBottom+lining;
  return {...frenchDoor,closedPairWidth,requiredWidth,requiredHeight,openingBase,openingTop,
    frameBottom,cillTop,leafBottom,leafTop,headBottom,frameTop,
    matchesOpening:Math.abs(door.width-requiredWidth)<.01&&Math.abs(door.height-requiredHeight)<.01};
}
