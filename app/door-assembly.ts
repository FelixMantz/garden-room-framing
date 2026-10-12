import type { WallConfig } from "./framing";

// Ordered LPD DFC46 frame. Effective rebate shoulders are derived from the
// published overall/rebate sizes; the weathered cill level remains nominal.
export const frenchDoor = {
  frameWidth:1248, frameHeight:2062, frameDepth:68,
  rebateWidth:1170, rebateHeight:1985, fullHeadCillWidth:1326,
  cillHeight:38, cillDepth:130,
  leftLeafWidth:589, rightLeafWidth:588, meetingOverlap:12,
  leafHeight:1980, leafThickness:43,
} as const;

export function doorAssembly(cfg:WallConfig, door:WallConfig["computedOpenings"][number]) {
  const {frameWidth,frameHeight,rebateWidth,rebateHeight,cillHeight,leftLeafWidth,rightLeafWidth,meetingOverlap,leafHeight}=frenchDoor;
  const closedPairWidth=leftLeafWidth+rightLeafWidth-meetingOverlap;
  const lining=(frameWidth-rebateWidth)/2;
  const headHeight=frameHeight-rebateHeight-cillHeight;
  const sideFit=(door.width-frameWidth)/2;
  const operating=(rebateWidth-closedPairWidth)/2;
  const verticalOperating=(rebateHeight-leafHeight)/2;
  const openingBase=cfg.frameBase+door.sill, openingTop=openingBase+door.height;
  const cillTop=cfg.ffl,frameBottom=cillTop-cillHeight;
  const fit=frameBottom-openingBase,frameTop=frameBottom+frameHeight,topFit=openingTop-frameTop;
  const leafBottom=cillTop+verticalOperating,leafTop=leafBottom+leafHeight,headBottom=leafTop+verticalOperating;
  return {...frenchDoor,fit,topFit,sideFit,lining,headHeight,operating,verticalOperating,
    closedPairWidth,requiredWidth:frameWidth,requiredHeight:frameHeight,openingBase,openingTop,
    frameBottom,cillTop,leafBottom,leafTop,headBottom,frameTop,
    matchesOpening:sideFit>=0&&fit>=0&&topFit>=0};
}

