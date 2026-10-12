import {type Settings} from './framing';
import {roofModel,roofDeckNoggins} from './roof';

/** S follows the rafter plane from its upper ridge corner; OSB ends are square. */
export function roofEnvelope(s:Settings){
 const roof=roofModel(s),deck=roofDeckNoggins(s),p=s.roofPitch*Math.PI/180;
 const cos=Math.cos(p),sin=Math.sin(p),tan=Math.tan(p),thickness=100,gap=3,kerf=3;
 const left=s.roofGableOverhang!>0?-roof.gableOverhang+roof.fasciaThickness:0;
 const right=roof.length-left,width=right-left;
 const bounds=[left];let edge=left;
 while(right-edge>1220){const next=roof.rafters.filter(x=>x>edge+100&&x<=edge+1220).at(-1);if(next===undefined)throw Error('Roof OSB seam needs an additional supporting rafter.');bounds.push(next);edge=next;}bounds.push(right);
 const columns=bounds.slice(0,-1).map((a,i)=>({x:a+(i?gap/2:0),w:bounds[i+1]-(i<bounds.length-2?gap/2:0)-a-(i?gap/2:0)}));
 const lower=deck.deckSlope-deck.rowWidth-gap;
 const osb=columns.flatMap((q,i)=>[{id:`U${i+1}`,...q,y:0,h:deck.rowWidth,sheet:i+1},{id:`E${i+1}`,...q,y:deck.rowWidth+gap,h:lower,sheet:i+1}]);
 const bevel=thickness*tan,halfRidge=s.ridgeWidth/(2*cos),osbSetback=11*tan;
 // Both plumb ends have the same bevel. The rectangular blank includes the long ridge tip.
 const tip=halfRidge+bevel+osbSetback,pirEnd=deck.deckSlope-osbSetback,jointS=1200-tip,pirLower=pirEnd-jointS;
 const pirWidths=[2400,2400,width-4800];
 const upper=pirWidths.map((w,i)=>({id:`RU${i+1}`,x:left+pirWidths.slice(0,i).reduce((a,b)=>a+b,0),w,y:-tip,h:1200}));
 const lowerWidths=[width-4800,2400,2400];
 const eaves=lowerWidths.map((w,i)=>({id:`RE${i+1}`,x:left+lowerWidths.slice(0,i).reduce((a,b)=>a+b,0),w,y:jointS,h:pirLower}));
 const ridgeAboveRafter=s.ridgeDepth-s.studDepth/cos;
 const ridgeAboveDeck=ridgeAboveRafter-11/cos;
 // Board coordinates: u upslope, n normal above PIR underside. Origin is the
 // square OSB upper corner: x=-11*sin, z=11*cos relative to rafter ridge corner.
 const rebateDepth=Math.max(0,ridgeAboveDeck),rebateWidth=s.ridgeWidth/2;
 const ridgeSideFoot=[osbSetback,0];
 const ridgeSideTop=[ridgeAboveRafter*sin,ridgeAboveRafter*cos-11];
 const ridgeCentreTop=[rebateWidth*cos+ridgeAboveRafter*sin,ridgeAboveRafter*cos-rebateWidth*sin-11];
 const pirRidgePolygon=[[-150,0],[-150,100],[tip,100],ridgeCentreTop,ridgeSideTop,ridgeSideFoot];
 const structural=[...(roof.gableOverhang>0?[-roof.flyRafterProjection]:[]),...roof.rafters,...(roof.gableOverhang>0?[roof.length+roof.flyRafterProjection]:[])];
 const intermediate=roof.rafters.slice(1).flatMap((x,i)=>x-roof.rafters[i]>=200?[(x+roof.rafters[i])/2]:[]);
 const blocking=deck.blocks.map(b=>({...b,x:b.x,y:deck.fromRidgeSlope}));
 const osbSheets=columns.length*2,pirSheets=10;
 const fits=width>4800&&width<=6000&&pirLower>0&&pirLower<=1200&&deck.rowWidth+lower+kerf<=2440&&columns.every(q=>q.w<=1220);
 return {roof,deck,left,right,width,columns,osb,lower,bevel,halfRidge,tip,jointS,pirLower,upper,eaves,thickness,ridgeAboveDeck,ridgeAboveRafter,osbSetback,pirEnd,ridgeSideFoot,ridgeSideTop,ridgeCentreTop,pirRidgePolygon,rebateDepth,rebateWidth,structural,intermediate,blocking,osbSheets,pirSheets,fits,osbReserve:26-15-osbSheets,pirReserve:16-6-pirSheets,longScrews:2*(roof.rafters.length*3+(structural.length-roof.rafters.length)*2),shortScrews:intermediate.length*4};
}

