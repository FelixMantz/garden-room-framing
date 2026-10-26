"use client";
import React, { useState } from 'react';
import { drawWindowCill } from './pdf/window-cill';
import { WINDOW_CILL_DEFAULTS, windowCillModel } from './window-cill';
import type { Settings } from './framing';
import { PDF_PARTS } from './framing-pdf';
import { drawSheathingDetails } from './pdf/sheathing';
import { svgCanvas } from './pdf/svg';
import { drawLowerWall } from './pdf/lower-wall';
import { WALL_SERVICES } from './wall-services';

export default function ConstructionDetails({settings}:{settings:Settings}){
  const [options, setOptions] = useState(WINDOW_CILL_DEFAULTS);
  const m = windowCillModel(settings, options);
  return <>
    <section className="diagram-card" aria-label="Socket band and wall PIR cutting allowance">
      <h2>Socket band and wall PIR</h2>
      <p>The {WALL_SERVICES.bandHeight} mm-high band uses {WALL_SERVICES.servicePir} mm PIR, leaving a {settings.studDepth-WALL_SERVICES.servicePir} mm warm-side recess. Its underside is {WALL_SERVICES.bandBottom} mm and top {WALL_SERVICES.bandTop} mm above FFL, centred on the {WALL_SERVICES.centre} mm socket height. Retain {WALL_SERVICES.mainPir} mm PIR elsewhere.</p>
      <p>An {WALL_SERVICES.boxEnvelopeHeight} mm-high box envelope leaves 21 mm above and below. Check the actual box and cable bend radius; widen pockets locally for cable entries, switches and controls, and maintain the sealed VCL.</p>
      <p>Default-frame cutting allowance for the one 2400 × 1200 × 70 mm board: cut thirteen 1200 × 180 mm blanks with 3 mm kerfs. Trim eleven blanks to 125 mm, retaining a 1200 × 50 mm strip from each for drops (13.2 m total). Reserve the other two blanks; each can yield three further 1200 × 50 mm strips (7.2 m combined). Nominal total for vertical strips: 20.4 m. Measure the completed bays and retain offcuts; adjusted framing may change this allowance. Widen vertical channels locally around backboxes.</p>
      <div className="shared-drawing" dangerouslySetInnerHTML={{__html:drawLowerWall(settings,4,PDF_PARTS[1].pageCount,svgCanvas())}}/>
    </section>
    <section className="diagram-card" aria-label="Window cill depth assessment">
      <h2>Window cill and wall section</h2>
      <p>Assess the 150 mm cill against the oak-clad wall. The initial position puts the outer window-frame face flush with the outer OSB face; this installation depth remains provisional.</p>
      <div className="advanced-grid">
        <label className="field"><span>Cill depth (mm)</span><select value={options.cillDepth} onChange={e=>setOptions(o=>({...o,cillDepth:Number(e.target.value)}))}>{[95,150,180].map(n=><option key={n} value={n}>{n} mm</option>)}</select></label>
        <label className="field"><span>Frame face outside studs (mm)</span><input type="number" min={-30} max={45} value={options.frameOuterOffset} onChange={e=>setOptions(o=>({...o,frameOuterOffset:Number(e.target.value)}))}/></label>
        <label className="field"><span>Maximum cladding lap depth (mm)</span><input type="number" min={5} max={40} value={options.claddingEnvelope} onChange={e=>setOptions(o=>({...o,claddingEnvelope:Number(e.target.value)}))}/></label>
        <label className="field"><span>Trim proud of cladding (mm)</span><input type="number" min={0} max={25} value={options.trimProud} onChange={e=>setOptions(o=>({...o,trimProud:Number(e.target.value)}))}/></label>
      </div>
      <p role="status"><strong>{m.projection.toFixed(1)} mm projection beyond the finished face.</strong> {m.meetsTarget?'Meets':'Below'} the master-spec 40 mm target. Frame offsets: 0 = flush with studs; {m.osb} = flush with OSB. The PDF uses the initial study values.</p>
      <button onClick={()=>setOptions(WINDOW_CILL_DEFAULTS)}>Reset cill assessment</button>
      <div className="shared-drawing" dangerouslySetInnerHTML={{__html:drawWindowCill(settings,16,PDF_PARTS[1].pageCount,svgCanvas(),options)}}/>
      <p>Supplier dimensions: <a href="https://www.modernupvcwindows.co.uk/img/extras/diagram-cill150.jpg" target="_blank" rel="noreferrer">150 mm cill section</a>. The frame and cill profiles are schematic; confirm the drip line and solid support before installation.</p>
    </section>
    <section className="diagram-card shared-drawing" aria-label="Labelled external corner construction detail"
    dangerouslySetInnerHTML={{__html:drawSheathingDetails(settings,8,PDF_PARTS[1].pageCount,svgCanvas())}}/>
  </>;
}
