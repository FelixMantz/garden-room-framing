"use client";
import React, { useState } from 'react';
import { drawWindowCill } from './pdf/window-cill';
import { WINDOW_CILL_DEFAULTS, windowCillModel } from './window-cill';
import type { Settings } from './framing';
import { PDF_PARTS } from './framing-pdf';
import { drawSheathingDetails } from './pdf/sheathing';
import { svgCanvas } from './pdf/svg';
import { drawLowerWall } from './pdf/lower-wall';
import { wallBattenPlan } from './cladding-battens';
import { CLADDING_ORDER, CLADDING_GOODS, CLADDING_DELIVERY } from './cladding';
import { drawWiringWall, drawWiringCeiling, drawWiringBathroom } from './pdf/wiring';
import { WALL_SERVICES } from './wall-services';

export default function ConstructionDetails({settings}:{settings:Settings}){
  const [options, setOptions] = useState(WINDOW_CILL_DEFAULTS);
  const m = windowCillModel(settings, options);
  const battens = wallBattenPlan(settings);
  return <>
    <section className="diagram-card" aria-label="Wiring diagrams">
      <h2>Electrical and network wiring</h2>
      <p>Internal wall elevations, vaulted ceiling, separate bathroom ceiling, with electrical and network routes and a key on each page. One line per cable. Proposed fitting positions need confirming before first fix.</p>
      {(['front','rear','left','right'] as const).map(id=><details key={id}><summary>{id} wall — internal wiring view</summary><div className="shared-drawing" dangerouslySetInnerHTML={{__html:drawWiringWall(settings,id,1,1,svgCanvas())}}/></details>)}
      {[['Vaulted ceiling',drawWiringCeiling],['Bathroom ceiling and partitions',drawWiringBathroom]].map(([label,draw])=><details key={String(label)}><summary>{String(label)}</summary><div className="shared-drawing" dangerouslySetInnerHTML={{__html:(draw as typeof drawWiringCeiling)(settings,1,1,svgCanvas())}}/></details>)}
    </section>
    <section className="diagram-card" aria-label="Socket band and wall PIR cutting allowance">
      <h2>Socket band and wall PIR</h2>
      <p>The {WALL_SERVICES.bandHeight} mm-high band uses {WALL_SERVICES.servicePir} mm PIR, leaving a {settings.studDepth-WALL_SERVICES.servicePir} mm warm-side recess. Its underside is {WALL_SERVICES.bandBottom} mm and top {WALL_SERVICES.bandTop} mm above FFL, centred on the {WALL_SERVICES.centre} mm socket height. Retain {WALL_SERVICES.mainPir} mm PIR elsewhere.</p>
      <p>An {WALL_SERVICES.boxEnvelopeHeight} mm-high box envelope leaves 21 mm above and below. Check the actual box and cable bend radius; widen pockets locally for cable entries, switches and controls, and maintain the sealed VCL.</p>
      <p>Default-frame cutting allowance for the one 2400 × 1200 × 70 mm board: cut thirteen 1200 × 180 mm blanks with 3 mm kerfs. Trim eleven blanks to 125 mm, retaining a 1200 × 50 mm strip from each for drops (13.2 m total). Reserve the other two blanks; each can yield three further 1200 × 50 mm strips (7.2 m combined). Nominal total for vertical strips: 20.4 m. Measure the completed bays and retain offcuts; adjusted framing may change this allowance. Widen vertical channels locally around backboxes.</p>
      <div className="shared-drawing" dangerouslySetInnerHTML={{__html:drawLowerWall(settings,1,PDF_PARTS[1].pageCount,svgCanvas())}}/>
    </section>
    <section className="diagram-card" aria-label="Window cill depth assessment">
      <h2>Window cill and wall section</h2>
      <p>Assess the 150 mm cill against the brown softwood-clad wall. The initial position puts the outer window-frame face flush with the outer OSB face; this installation depth remains provisional.</p>
      <div className="advanced-grid">
        <label className="field"><span>Cill depth (mm)</span><select value={options.cillDepth} onChange={e=>setOptions(o=>({...o,cillDepth:Number(e.target.value)}))}>{[95,150,180].map(n=><option key={n} value={n}>{n} mm</option>)}</select></label>
        <label className="field"><span>Frame face outside studs (mm)</span><input type="number" min={-30} max={45} value={options.frameOuterOffset} onChange={e=>setOptions(o=>({...o,frameOuterOffset:Number(e.target.value)}))}/></label>
        <label className="field"><span>Maximum cladding lap depth (mm)</span><input type="number" min={5} max={40} value={options.claddingEnvelope} onChange={e=>setOptions(o=>({...o,claddingEnvelope:Number(e.target.value)}))}/></label>
        <label className="field"><span>Trim proud of cladding (mm)</span><input type="number" min={0} max={25} value={options.trimProud} onChange={e=>setOptions(o=>({...o,trimProud:Number(e.target.value)}))}/></label>
      </div>
      <p role="status"><strong>{m.projection.toFixed(1)} mm projection beyond the finished face.</strong> {m.meetsTarget?'Meets':'Below'} the master-spec 40 mm target. Frame offsets: 0 = flush with studs; {m.osb} = flush with OSB. The PDF uses the provisional 32 mm lap envelope and 3 mm trim projection. Measure an overlapping sample before installation.</p>
      <button onClick={()=>setOptions(WINDOW_CILL_DEFAULTS)}>Reset cill assessment</button>
      <div className="shared-drawing" dangerouslySetInnerHTML={{__html:drawWindowCill(settings,13,PDF_PARTS[1].pageCount,svgCanvas(),options)}}/>
      <p>Supplier dimensions: <a href="https://www.modernupvcwindows.co.uk/img/extras/diagram-cill150.jpg" target="_blank" rel="noreferrer">150 mm cill section</a>. The frame and cill profiles are schematic; confirm the drip line and solid support before installation.</p>
    </section>
    <section className="diagram-card shared-drawing" aria-label="Labelled external corner construction detail"
    dangerouslySetInnerHTML={{__html:drawSheathingDetails(settings,5,PDF_PARTS[1].pageCount,svgCanvas())}}/>
    <section className="diagram-card" aria-label="D2D cladding timber order">
      <h2>D2D brown cladding and trim order — 25136</h2>
      <table><thead><tr><th>Section</th><th>Stock</th><th>Quantity</th><th>Budget</th></tr></thead><tbody>
        {CLADDING_ORDER.map(item=><tr key={item.section}><td><a href={item.url}>{item.section}</a></td><td>{item.length} m</td><td>{item.quantity}</td><td>£{(item.quantity*item.unit).toFixed(2)}</td></tr>)}
      </tbody></table>
      <p>Brown visible timber; concealed battens may be green treated. Goods £{CLADDING_GOODS.toFixed(2)} + delivery allowance £{CLADDING_DELIVERY.toFixed(2)} = <strong>£{(CLADDING_GOODS+CLADDING_DELIVERY).toFixed(2)} paid</strong>. Ordered 27 October 2026; awaiting delivery.</p>
      <p>Reserve four 4.8 m gravel boards for corners: two full-width and two ripped to nominal 78 mm. Each stock length yields two corner legs up to just under 2.4 m after kerf. Measure corner heights before cutting. The remaining five 100 mm boards provide 24 m for face trims to four windows and the entrance door; concealed liners are separate.</p>
      <p>The 100 mm face and return ripped to 78 mm form an L with equal 100 mm outside widths. Measure the actual timber: return width = face width minus thickness. Extend the featheredge into the concealed corner, giving approximately 36 mm cover on both faces behind the corner boards. Leave 10 mm between each concealed end and the perpendicular cladding. The trim bears against the lap high points, with no added rear gap, and projects 22 mm beyond the laps. Avoid crushing the boards when fixing; keep drainage open. Select straight, sound boards suitable for visible trim.</p>
      <p>Wall batten allowance: {battens.totalMetres.toFixed(1)} m of cut pieces, packed into {battens.stockForCuts} × 2.1 m lengths with 3 mm saw kerfs. Ordered 74 reclaimed painted lengths for £74, leaving {battens.orderLengths-battens.stockForCuts} before the additional butt-joint backing shown on the Cladding layout page. Includes gables, opening jambs and single 50 mm-wide corner battens; joins at the wall-head plates have framing behind them. Adjusted settings require recalculating the purchase quantity.</p>
      <p>Keep all 36 received 4.8 m battens reserved for the roof: the conservative 64-run allowance uses 32 lengths, with four retained for ridge/verge details and defects. No unconfirmed roof surplus has been deducted from the wall order. Check the reclaimed stock for old metal, sound condition, actual 25 × 50 mm section and suitable exterior-cavity durability/treatment. Paint alone does not establish treatment; use true 25 × 50 mm treated stock if unsuitable.</p>
      <p>The Cladding layout page allocates the 60 ordered featheredge lengths, including overlap, supported joints, gable cuts and saw kerfs. Fixings, preservative, head and plinth flashings, concealed liners and ventilated insect closures are additional. Ripping exposes core wood: protect the ripped edge with compatible preservative and brown exterior finish; this does not restore factory impregnation. Keep the cut edge concealed.</p>
    </section>
  </>;
}
