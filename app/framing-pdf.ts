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
import { drawSheathing, drawSheathingCuts, drawSheathingCutsContinued, drawSheathingDetails } from "./pdf/sheathing";
import { drawFloor, drawBathroom, drawBathroomDoor } from "./pdf/bathroom";
import {drawRoofEnvelope,drawRoofEnvelopeCuts,drawRoofEnvelopeDetails,drawRoofBattens} from './pdf/roof-envelope';
import { drawTieConnection } from './pdf/tie-connection';
import { drawWindowCill } from './pdf/window-cill';
import { drawCladding, drawCladdingCuts, drawCladdingStock } from "./pdf/cladding";
export const FRAMING_PDF_PAGE_COUNT=35;
export const PDF_PARTS = [
  {id:'timber', label:'Part 1 - Timber framing', filename:'garden-room-timber-framing.pdf', pageCount:16},
  {id:'construction', label:'Part 2 - Sheathing, insulation & interiors', filename:'garden-room-construction-details.pdf', pageCount:20},
] as const;
export type PdfPart = typeof PDF_PARTS[number]['id'];
export function generateFramingPdf(settings:Settings,part?:PdfPart){
  const configs=wallOrder.map(id=>configForWall(settings,id));
  const errors=[...configs.flatMap(validate),...roofModel(settings).errors];
  if(errors.length)throw new Error(errors.join(" "));
  const pages:((page:number,total:number)=>string)[]=[];
  configs.forEach(cfg=>{const members=buildModel(cfg);pages.push((p,t)=>drawWallTechnical(cfg,members,p,t),(p,t)=>drawWallSchedule(cfg,members,p,t));if(cfg.gable)pages.push((p,t)=>drawWallSchedule(cfg,members,p,t,"Gable"));});
  pages.push((p,t)=>drawRoof(settings,p,t),(p,t)=>drawRoofSchedule(settings,p,t),(p,t)=>drawCuts(settings,p,t),
    (p,t)=>drawDoorVertical(settings,p,t),(p,t)=>drawDoorVertical(settings,p,t,true),(p,t)=>drawEaves(settings,p,t),(p,t)=>drawLowerWall(settings,p,t),drawPatternKey,(p,t)=>drawFramePosition(settings,p,t),(p,t)=>drawSheathing(settings,p,t),(p,t)=>drawSheathingCuts(settings,p,t),(p,t)=>drawSheathingCutsContinued(settings,p,t),(p,t)=>drawSheathingDetails(settings,p,t),(p,t)=>drawFloor(settings,p,t),(p,t)=>drawBathroom(settings,p,t),(p,t)=>drawBathroomDoor(settings,p,t),(p,t)=>drawRoofEnvelope(settings,p,t),(p,t)=>drawRoofEnvelopeCuts(settings,p,t),(p,t)=>drawRoofEnvelopeDetails(settings,p,t),(p,t)=>drawRoofBattens(settings,p,t));
  pages.push((p,t)=>drawTieConnection(settings,p,t));
  pages.push((p,t)=>drawWindowCill(settings,p,t));
  pages.push((p,t)=>drawCladding(settings,p,t),(p,t)=>drawCladdingCuts(settings,p,t),(p,t)=>drawCladdingStock(settings,p,t));
  // Original drawing order is retained for regression comparisons. Each published
  // part has its own numbering; include the material key in both for standalone use.
  const selected=part==='timber'
    ? [...pages.slice(0,13),pages[30],pages[17],pages[18]]
    : part==='construction'
      ? [...pages.slice(13,17),...pages.slice(19,30),pages[31],...pages.slice(32),pages[17]]
      : pages;
  const label=PDF_PARTS.find(item=>item.id===part)?.label;
  return buildPdf(selected.map((draw,i)=>{
    const stream=draw(i+1,selected.length);
    return label?stream.replaceAll('Garden room framing set |',`Garden room ${part==='timber'?'Part 1 - timber framing':'Part 2 - construction details'} |`):stream;
  }));
}
