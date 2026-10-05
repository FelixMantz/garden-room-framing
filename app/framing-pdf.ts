import { buildModel, configForWall, validate, wallOrder, type Settings } from "./framing";
import { roofModel } from "./roof";
import { buildPdf } from "./pdf/document";
import { drawWallTechnical, drawWallSchedule } from "./pdf/walls";
import { drawRoof, drawRoofSchedule, drawCuts } from "./pdf/roof";
import { drawDoorVertical } from "./pdf/door";
import { drawPatternKey } from "./pdf/key";
import { drawEaves } from "./pdf/eaves";
import { drawLowerWall } from "./pdf/lower-wall";
import { drawFramePosition } from "./pdf/frame-position";
export const FRAMING_PDF_PAGE_COUNT=19;
export function generateFramingPdf(settings:Settings){
  const configs=wallOrder.map(id=>configForWall(settings,id));
  const errors=[...configs.flatMap(validate),...roofModel(settings).errors];
  if(errors.length)throw new Error(errors.join(" "));
  const pages:((page:number,total:number)=>string)[]=[];
  configs.forEach(cfg=>{const members=buildModel(cfg);pages.push((p,t)=>drawWallTechnical(cfg,members,p,t),(p,t)=>drawWallSchedule(cfg,members,p,t));if(cfg.gable)pages.push((p,t)=>drawWallSchedule(cfg,members,p,t,"Gable"));});
  pages.push((p,t)=>drawRoof(settings,p,t),(p,t)=>drawRoofSchedule(settings,p,t),(p,t)=>drawCuts(settings,p,t),
    (p,t)=>drawDoorVertical(settings,p,t),(p,t)=>drawDoorVertical(settings,p,t,true),(p,t)=>drawEaves(settings,p,t),(p,t)=>drawLowerWall(settings,p,t),drawPatternKey,(p,t)=>drawFramePosition(settings,p,t));
  return buildPdf(pages.map((draw,i)=>draw(i+1,pages.length)));
}
