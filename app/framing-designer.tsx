"use client";
import { useMemo, useState } from "react";
import { buildModel, configForWall, defaultSettings, makeSchedule, scheduleGroups, validate, wallOrder, type Settings, type WallId } from "./framing";
import { roofModel, tieEndClearance } from "./roof";
import { drawWallTechnical } from "./pdf/walls";
import { drawTieChamfer } from "./pdf/ties";
import { drawRoof } from "./pdf/roof";
import { drawEaves } from "./pdf/eaves";
import { svgCanvas } from "./pdf/svg";
import ConstructionDetails from "./construction-details";
import { generateFramingPdf, FRAMING_PDF_PAGE_COUNT } from "./framing-pdf";
import { drawSheathing, drawSheathingCuts } from "./pdf/sheathing";
import { adjustmentFields } from "./specification";
export default function FramingDesigner(){
 const [settings,setSettings]=useState<Settings>(defaultSettings);
 const [active,setActive]=useState<WallId>("front");
 const [view,setView]=useState("walls");
 const cfg=useMemo(()=>configForWall(settings,active),[settings,active]);
 const errors=[...wallOrder.flatMap(id=>validate(configForWall(settings,id))),...roofModel(settings).errors];
 const members=useMemo(()=>buildModel(cfg),[cfg]);
 const schedules=scheduleGroups(cfg,members).map(group=>({...group,rows:makeSchedule(cfg,group.members)}));
 const tieClearance=tieEndClearance(settings);
 const drawing=errors.length?'':view==='roof'?drawRoof(settings,11,FRAMING_PDF_PAGE_COUNT,svgCanvas()):drawWallTechnical(cfg,members,[1,3,5,8][wallOrder.indexOf(active)],FRAMING_PDF_PAGE_COUNT,svgCanvas());
 const pdfUrl = `${import.meta.env.BASE_URL}garden-room-framing-set.pdf`;
 function exportAdjustedPdf(download: boolean){
  const pdf = generateFramingPdf(settings);
  const blob = new Blob([new Uint8Array(pdf)], {type:'application/pdf'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  if(download) link.download = 'garden-room-framing-set.pdf';
  else {link.target = '_blank';link.rel = 'noopener';}
  document.body.append(link);link.click();link.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),300000);
 }
 return <main className="designer-shell">
 <header className="app-header"><div><p className="eyebrow">Garden room framing set</p><h1>Garden room drawings</h1></div><div className="header-actions"><a className="primary-button" href={pdfUrl} target="_blank" rel="noreferrer">Open technical PDF</a><a className="download-button" href={pdfUrl} download>Download technical PDF</a></div></header>
 <details className="advanced"><summary>Advanced adjustments</summary><p>Overhangs are horizontal from outside wall framing to outside fascia faces, including 22 mm fascia thickness. The main PDF uses the default specification. Export an adjusted set below after changing the roof settings.</p><div className="advanced-grid">{adjustmentFields.map(([key,label,min,max,step])=><label className="field" key={key}><span>{label}</span><input type="number" min={min} max={max} step={step} value={Number.isFinite(settings[key])?settings[key]:''} onChange={e=>setSettings(s=>({...s,[key]:Number(e.target.value)}))}/></label>)}</div><div className="header-actions"><button onClick={()=>setSettings(defaultSettings())}>Reset defaults</button>{['inline','download'].map(output=><button key={output} onClick={()=>exportAdjustedPdf(output==='download')} disabled={errors.length>0}>{output==='inline'?'Open adjusted PDF':'Download adjusted PDF'}</button>)}</div><p>Wall dimensions, openings, California corners, two top plates, floor layers and stud grids are fixed in the garden-room specification.</p></details>
 {errors.length>0&&<div className="error-banner" role="alert">{errors.join(' ')}</div>}
 {errors.length===0&&tieClearance.projection>.01&&<p className="clearance-note" role="status"><strong>Tie-end chamfers:</strong> chamfer both top corners at {settings.roofPitch}°, removing {tieClearance.projection.toFixed(1)} mm vertically over {tieClearance.run.toFixed(1)} mm horizontally. Finished end depth: {tieClearance.remainingDepth.toFixed(1)} mm. Keep the underside flat. See the roof section for the cutting detail.</p>}
 <nav className="section-tabs" aria-label="Drawing sections">{['walls','roof','sheathing','details'].map(v=><button key={v} className={view===v?'active':''} onClick={()=>setView(v)}>{v==='walls'?'Wall elevations':v==='roof'?'Roof plan':v==='sheathing'?'OSB sheathing':'Construction details'}</button>)}</nav>
 {view==='sheathing'?<>{[drawSheathing,drawSheathingCuts].map((draw,i)=><section key={i} className="diagram-card shared-drawing" dangerouslySetInnerHTML={{__html:errors.length?'':draw(settings,20+i,FRAMING_PDF_PAGE_COUNT,svgCanvas())}}/>)}</>:view==='details'?<ConstructionDetails settings={settings}/>:<>{view==='walls'&&<nav className="wall-tabs" aria-label="Walls">{wallOrder.map(id=><button key={id} className={active===id?'active':''} onClick={()=>setActive(id)}>{settings.walls[id].name}</button>)}</nav>}<section className="diagram-card shared-drawing" dangerouslySetInnerHTML={{__html:drawing}}/>{view==='roof'&&errors.length===0&&<><section className="diagram-card shared-drawing" dangerouslySetInnerHTML={{__html:drawTieChamfer(settings,svgCanvas())}}/><section className="diagram-card shared-drawing" dangerouslySetInnerHTML={{__html:drawEaves(settings,16,FRAMING_PDF_PAGE_COUNT,svgCanvas())}}/></>}{view==='walls'&&schedules.map(group=><details className="schedule" key={group.name}><summary>{cfg.name}{cfg.gable?` — ${group.name.toLowerCase()}`:''} cutting schedule</summary>{cfg.gable&&group.name==='Gable'&&<p>Rafters show overall board length (see detail page 13). Other angled cuts show long side (short side), in mm.</p>}<div className="table-wrap"><table><thead><tr><th>Component</th><th>Quantity</th><th>Cut length (mm)</th><th>Section / notes</th></tr></thead><tbody>{group.rows.map((r,i)=><tr key={i}><td>{r.type}</td><td>{r.qty}</td><td>{r.lengthLabel}</td><td>{r.section}</td></tr>)}</tbody></table></div></details>)}</>}
 </main>;
}
