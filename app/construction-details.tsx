"use client";
import React, { useState } from 'react';
import { drawWindowCill } from './pdf/window-cill';
import { WINDOW_CILL_DEFAULTS, windowCillModel } from './window-cill';
import type { Settings } from './framing';
import { PDF_PARTS } from './framing-pdf';
import { drawSheathingDetails } from './pdf/sheathing';
import { svgCanvas } from './pdf/svg';

export default function ConstructionDetails({settings}:{settings:Settings}){
  const [options, setOptions] = useState(WINDOW_CILL_DEFAULTS);
  const m = windowCillModel(settings, options);
  return <>
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
