"use client";

import { configForWall, type Settings } from "./framing";
import { doorAssembly } from "./door-assembly";

const Dim=({x1,y1,x2,y2,label,fromY,fromX,brickDatum=false}:{x1:number;y1:number;x2:number;y2:number;label:string;fromY?:number;fromX?:number;brickDatum?:boolean})=>{
 const vertical=x1===x2;
 return <g className="detail-dim">
 {fromY!==undefined&&<><line x1={x1} y1={fromY} x2={x1} y2={y1} strokeDasharray={brickDatum?'6 2 1 2':undefined}/><line x1={x2} y1={fromY} x2={x2} y2={y2} strokeDasharray={brickDatum?'6 2 1 2':undefined}/></>}
 {fromX!==undefined&&<><line x1={fromX} y1={y1} x2={x1} y2={y1} strokeDasharray={brickDatum?'6 2 1 2':undefined}/><line x1={fromX} y1={y2} x2={x2} y2={y2} strokeDasharray={brickDatum?'6 2 1 2':undefined}/></>}
 <line x1={x1} y1={y1} x2={x2} y2={y2}/>
 {[{x:x1,y:y1},{x:x2,y:y2}].map((p,i)=><line key={i} x1={p.x-4} y1={p.y+4} x2={p.x+4} y2={p.y-4}/>)}
 <text x={vertical?x1-8:(x1+x2)/2} y={vertical?(y1+y2)/2:y1-8} transform={vertical?`rotate(-90 ${x1-8} ${(y1+y2)/2})`:undefined} style={{paintOrder:'stroke',stroke:'white',strokeWidth:4,strokeLinejoin:'round'}}>{label}</text>
 </g>;
};
const mm=(n:number)=>Number(n.toFixed(1));

function OutsideDatum({s}:{s:Settings}){
  const brickLength=s.brickInternalLength+2*s.brickThickness,brickDepth=s.brickInternalDepth+2*s.brickThickness;
  const frameLength=s.internalLength+2*s.studDepth,frameDepth=s.internalDepth+2*s.studDepth;
  const projection=(brickLength-frameLength)/2;
  const outer={x:95,y:75,w:570,h:250},sx=outer.w/brickLength,sy=outer.h/brickDepth;
  const inner={x:outer.x+s.brickThickness*sx,y:outer.y+s.brickThickness*sy,w:s.brickInternalLength*sx,h:s.brickInternalDepth*sy};
  const frame={x:outer.x+(brickLength-frameLength)/2*sx,y:outer.y+(brickDepth-frameDepth)/2*sy,w:frameLength*sx,h:frameDepth*sy};
  const frameInner={x:frame.x+s.studDepth*sx,y:frame.y+s.studDepth*sy,w:s.internalLength*sx,h:s.internalDepth*sy};
  const ring=(o:{x:number;y:number;w:number;h:number},i:{x:number;y:number;w:number;h:number})=>`M${o.x} ${o.y}H${o.x+o.w}V${o.y+o.h}H${o.x}Z M${i.x} ${i.y}H${i.x+i.w}V${i.y+i.h}H${i.x}Z`;
  return <article className="detail-card"><div className="detail-copy"><p className="detail-kicker">Setting-out datum</p><h2>{s.brickInternalLength} × {s.brickInternalDepth} mm inside the brickwork</h2><p>Centre the 5,190 × 3,200 mm timber frame on the measured brickwork. Timber inner faces project 2.5 mm into the room beyond the brick inner faces on all four sides.</p></div><svg className="detail-svg" viewBox="0 0 760 510" role="img" aria-label="Plan showing inside brick dimensions and centred timber frame with 2.5 mm internal overhang">
    <rect className="slab-plan" x={outer.x} y={outer.y} width={outer.w} height={outer.h}/>
    <path className="brick-plan-band" d={ring(outer,inner)}/><path className="frame-plan-band" d={ring(frame,frameInner)}/>
    <Dim x1={outer.x} y1={48} x2={outer.x+outer.w} y2={48} fromY={outer.y} brickDatum label={`${brickLength} mm outside brick`}/>
    <Dim x1={inner.x} y1={355} x2={inner.x+inner.w} y2={355} label={`${s.brickInternalLength} mm clear inside brick`}/>
    <text className="rotated-detail" transform="rotate(-90 54 200)" x="54" y="200">{brickDepth} mm outside</text>
    <text className="rotated-detail" transform="rotate(-90 700 200)" x="700" y="200">{s.brickInternalDepth} mm clear inside brick</text>
    <g className="detail-labels"><text x="445" y="115">Brickwork · {s.brickThickness} mm</text><text x="445" y="145">Timber frame · {s.studDepth} mm</text></g>
    <line className="leader brick-leader" x1="440" y1="110" x2={outer.x+outer.w-36} y2={outer.y+8}/><line className="leader frame-leader" x1="440" y1="140" x2={frame.x+frame.w-46} y2={frame.y+15}/>
    <Dim x1={frame.x} x2={frame.x+frame.w} y1={387} y2={387} fromY={frame.y+frame.h} label={`${frameLength} outside frame`}/>
    <Dim x1={736} x2={736} y1={frame.y} y2={frame.y+frame.h} fromX={frame.x+frame.w} label={`${frameDepth} outside frame`}/>
    <line className="brick-inside-edge" x1={inner.x} y1={inner.y} x2={inner.x+inner.w} y2={inner.y+inner.h}/>
    <line className="brick-inside-edge" x1={inner.x+inner.w} y1={inner.y} x2={inner.x} y2={inner.y+inner.h}/>
    <rect x="215" y="172" width="335" height="55" fill="white"/>
    <text className="detail-label" x="380" y="192" textAnchor="middle">Inside diagonals: both {mm(Math.hypot(s.brickInternalLength,s.brickInternalDepth))}</text>
    <text className="detail-label" x="380" y="214" textAnchor="middle">Outside brick diagonals: both {mm(Math.hypot(brickLength,brickDepth))}</text>
    <Dim x1={inner.x} x2={inner.x+inner.w/2} y1={279} y2={279} fromY={inner.y+inner.h} label={`${mm(s.brickInternalLength/2)} to centre`}/>
    <Dim x1={inner.x+inner.w/2} x2={inner.x+inner.w} y1={279} y2={279} fromY={inner.y+inner.h} label={`${mm(s.brickInternalLength/2)} to centre`}/>
    <text className="detail-note" x="380" y="459" textAnchor="middle">Dot-dash: outside brick witnesses · solid: timber-frame witnesses · outside brick projection {projection} mm; internal timber overhang 2.5 mm</text>
    <text className="detail-note" x="380" y="484" textAnchor="middle">Derived timber-frame outside: {frameLength} × {frameDepth} mm</text>
  </svg></article>;
}

function CornerPlan({s}:{s:Settings}){
  const x=120,y=70,insideX=x+s.studDepth,insideY=y+s.studDepth;
  return <article className="detail-card"><div className="detail-copy"><p className="detail-kicker">Plan detail — boards only</p><h2>Insulated three-stud California corner</h2><p>The third stud is turned along the inside face: it gives the front-wall plasterboard a fixing edge while leaving the shaded pocket open for insulation.</p></div><svg className="detail-svg" viewBox="0 0 760 410" role="img" aria-label="Simplified plan of the boards forming the timber wall corner">
    <path className="brick-underlay" d={`M${insideX-2.5-s.brickThickness} ${insideY-2.5-s.brickThickness}H680V${insideY-2.5}H${insideX-2.5}V350H${insideX-2.5-s.brickThickness}Z`}/>
    <line className="brick-inside-edge" x1={insideX-2.5} y1={insideY-2.5} x2={insideX-2.5} y2="350"/><line className="brick-inside-edge" x1={insideX-2.5} y1={insideY-2.5} x2="680" y2={insideY-2.5}/>
    {<rect className="insulation-pocket" x={x+s.studFace} y={y} width={s.studDepth} height={Math.max(0,s.studDepth-s.studFace)}/>}
    <rect className="front-stud" x={x} y={y} width={s.studFace} height={s.studDepth}/>
    <rect className="side-stud" x={x} y={insideY} width={s.studDepth} height={s.studFace}/>
    <rect className="backing-stud" x={x+s.studFace} y={insideY-s.studFace} width={s.studDepth} height={s.studFace}/>
    <line className="drywall-line front-drywall" x1={x+s.studFace} y1={insideY+8} x2="660" y2={insideY+8}/><line className="drywall-line side-drywall" x1={insideX+8} y1={insideY+8} x2={insideX+8} y2="340"/><text className="detail-label" x="520" y="195">Plasterboard fixing line</text>
    <Dim x1={x} y1={25} x2={insideX} y2={25} label={`${s.studDepth} mm wall depth`}/>
    <text className="detail-label front-label" x="410" y="102">Front/rear wall →</text><text className="detail-label side-label" transform="rotate(-90 173 310)" x="173" y="310">Side wall →</text>
    <Dim x1={x} x2={x+s.studFace} y1={55} y2={55} fromY={y} label={`${s.studFace} face`}/>
    <Dim x1={x+s.studFace} x2={x+s.studFace+s.studDepth} y1={235} y2={235} fromY={insideY} label={`${s.studDepth} return`}/>
    <Dim x1={x} x2={x+s.studFace+s.studDepth} y1={268} y2={268} fromY={insideY+s.studFace} label={`${s.studFace+s.studDepth} corner run`}/>
    <Dim x1={90} x2={90} y1={insideY} y2={insideY+s.studFace} fromX={x} label={`${s.studFace} side face`}/>
    <Dim x1={285} x2={285} y1={y} y2={insideY-s.studFace} fromX={x+s.studFace+s.studDepth} label={`${s.studDepth-s.studFace} pocket`}/>
    <Dim x1={315} x2={315} y1={insideY-s.studFace} y2={insideY} fromX={x+s.studFace+s.studDepth} label={`${s.studFace} backing`}/>
    <text className="detail-note" x="85" y="340">Internal timber overhang: 2.5 mm</text>
    <g className="corner-legend"><rect className="front-stud" x="350" y="235" width="28" height="18"/><text x="388" y="249">Front-wall end stud</text><rect className="side-stud" x="350" y="265" width="28" height="18"/><text x="388" y="279">Side-wall end stud</text><rect className="backing-stud" x="350" y="295" width="28" height="18"/><text x="388" y="309">Turned plasterboard backing stud</text>{<><rect className="insulation-pocket" x="350" y="325" width="28" height="18"/><text x="388" y="339">Insulation pocket — open from next bay</text></>}</g>
    <text className="detail-note" x="380" y="382" textAnchor="middle">Brick is below the timber; timber inner faces overhang the brick inner datums by 2.5 mm</text>
  </svg></article>;
}

function FloorSection({s}:{s:Settings}){
  const cfg=configForWall(s,'front'),door=cfg.computedOpenings.find(o=>o.type==='door')!;
  const assembly=doorAssembly(cfg,door);
  const total=s.layers.reduce((a,l)=>a+l.thickness,0),masonry=s.brickCourses*s.courseHeight;
  const scale=.7,baseY=330,fflY=baseY-total*scale,brickTopY=baseY-masonry*scale,soleY=brickTopY-0*scale-s.studFace*scale,thresholdTopY=baseY-s.courseHeight*scale;
  const depthScale=1.4,insideFaceX=340,brickWidth=s.brickThickness*depthScale,timberWidth=s.studDepth*depthScale;
  const brickX=insideFaceX-brickWidth,timberX=insideFaceX+2.5*depthScale-timberWidth;
  let cursor=baseY;
  return <article className="detail-card wide"><div className="detail-copy"><p className="detail-kicker">Wall and door threshold sections</p><h2>Floor build-up and dwarf wall</h2><p>Wall section at left and door threshold at right share the slab and finished-floor datums. Dimensions use the same cill and leaf clearances as the door assembly.</p></div><svg className="detail-svg floor-detail-svg" viewBox="0 0 1180 480" role="img" aria-label="Floor build-up and dwarf wall cross section">
    <rect className="concrete" x="90" y={baseY} width="900" height="80"/><text className="material-label" x="110" y="378">Concrete slab</text>
    <g>{s.layers.map((l,i)=>{const h=l.thickness*scale;cursor-=h;return <g key={i}><rect className={`floor-layer-detail layer-${i}`} x={insideFaceX} y={cursor} width={850-insideFaceX} height={h}/><text className="material-label" x="545" y={350+i*25}>{l.name} · {l.thickness} mm</text><line className="brick-inside-edge" x1="535" y1={345+i*25} x2="495" y2={cursor+h/2}/></g>;})}</g>
    {<g>{Array.from({length:s.brickCourses}).map((_,i)=><rect key={i} className="brick-course" x={brickX} y={baseY-(i+1)*s.courseHeight*scale} width={brickWidth} height={s.courseHeight*scale}/>)}</g>}
    <line className="dpc-detail" x1={timberX} y1={soleY+s.studFace*scale} x2={insideFaceX+2.5*depthScale} y2={soleY+s.studFace*scale} stroke="#37443f" strokeWidth="3"/><rect className="sole-detail" x={timberX} y={soleY} width={timberWidth} height={s.studFace*scale}/><rect className="stud-detail" x={timberX} y="25" width={timberWidth} height={Math.max(10,soleY-25)}/>
    <line className="brick-inside-edge" x1={insideFaceX} y1="18" x2={insideFaceX} y2={baseY}/><text className="detail-note" x={insideFaceX+10} y="43">Brick inner face; timber +2.5 mm</text>
    <line className="ffl-detail" x1="80" y1={fflY} x2="1010" y2={fflY}/><text className="ffl-text" x="800" y={fflY-10} textAnchor="end">FFL · {total} mm above slab</text>
    {<g><rect className="brick-course" x="850" y={thresholdTopY} width="140" height={s.courseHeight*scale}/><text className="detail-label" x="910" y={thresholdTopY+28} textAnchor="middle">Brick course</text></g>}
    <rect className="sole-detail" x="842" y={fflY} width="156" height={assembly.lining*scale}/>
    <rect className="front-stud" x="885" y={fflY-145} width={assembly.leafThickness*depthScale} height={145-(assembly.leafBottom-total)*scale}/>
    <text className="detail-label" x="842" y={fflY-164}>Door leaf / hardwood cill</text>
    <Dim x1={110} x2={110} y1={baseY} y2={brickTopY} fromX={brickX} label={`${masonry} masonry`}/>
    <Dim x1={72} x2={72} y1={baseY} y2={soleY} fromX={timberX} label={`${masonry+s.studFace} sole top / slab`}/>
    <Dim x1={375} x2={375} y1={fflY} y2={brickTopY} fromX={insideFaceX} label={`${masonry-total} FFL - brick top`}/>
    <Dim x1={410} x2={410} y1={brickTopY} y2={soleY} fromX={insideFaceX} label={`${s.studFace} sole`}/>
    <Dim x1={1035} x2={1035} y1={baseY} y2={fflY} fromX={998} label={`${total} FFL / slab`}/>
    <Dim x1={1070} x2={1070} y1={thresholdTopY} y2={baseY-assembly.frameBottom*scale} fromX={998} label={`${mm(assembly.frameBottom-s.courseHeight)} to cill U/S`}/>
    <Dim x1={1105} x2={1105} y1={baseY-assembly.frameBottom*scale} y2={fflY} fromX={998} label={`${assembly.lining} cill`}/>
    <Dim x1={1140} x2={1140} y1={baseY} y2={baseY-assembly.leafBottom*scale} fromX={998} label={`${mm(assembly.leafBottom)} leaf bottom / slab`}/>
    <text className="detail-note" x="842" y="385">Cill top = FFL; leaf gap {assembly.operating} mm</text>
    <text className="detail-note" x="842" y="410">Threshold brick top +{s.courseHeight} mm</text>
    <text className="detail-label" x="60" y="15">Stud and sole plate · {s.studDepth} mm deep</text><text className="detail-label" x={brickX-10} y={brickTopY+5} textAnchor="end">Brick · {s.brickThickness} mm</text><text className="detail-label" x={timberX-10} y={soleY+20} textAnchor="end">Sole plate over DPC</text><text className="detail-note" x="580" y="455" textAnchor="middle">Timber overhangs brick inside by 2.5 mm · brick projects 2.5 mm outside timber · dwarf wall {masonry} mm · floor build-up {total} mm</text>
  </svg></article>;
}

export default function ConstructionDetails({settings}:{settings:Settings}){
  return <section className="details-view"><div className="details-intro"><div><p className="eyebrow">Supporting diagrams</p><h1>Construction details</h1></div><p>Diagrammatic set-out details driven by the same inputs as the wall elevations. Dimensions are nominal and should be checked against the actual slab, bricks and timber before cutting.</p></div><div className="details-grid"><OutsideDatum s={settings}/><CornerPlan s={settings}/><FloorSection s={settings}/></div></section>;
}
