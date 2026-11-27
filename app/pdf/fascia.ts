import type { Settings } from '../framing';
import { FASCIA, fasciaPlan } from '../fascia';
import { canvas, fmt, hTechnical, vTechnical } from './layout';

export function drawFascia(settings: Settings, page: number, total: number, c = canvas()) {
  const m = fasciaPlan(settings);
  c.text('Roofline cutting plan',12,12,14,true);
  c.text('Nominal dimensions in mm | mark from fitted faces | mirror the gable cuts on two boards',12,20,8);

  c.text('FASCIA / BARGEBOARD STOCK',12,34,9,true);
  c.text('Four white 5000 x 200 x 18 lipped boards. Preserve the bottom lip.',12,41,7.5);
  const drawStock = (y: number, cuts: [number,number], labels: [string,string]) => {
    const x = 14, length = 263, height = 12, scale = length / FASCIA.stockLength;
    c.rect(x,y,length,height);
    c.rect(x,y,cuts[0]*scale,height,'floor');
    const next = x + (cuts[0] + FASCIA.kerf)*scale;
    c.rect(next,y,cuts[1]*scale,height,'timber');
    c.text(labels[0],x+cuts[0]*scale/2,y+7.5,7.2,true,'center');
    c.rect(next+2,y+3,cuts[1]*scale-4,6);
    c.text(labels[1],next+cuts[1]*scale/2,y+7.5,7.2,true,'center');
  };
  drawStock(49,[m.eavesHalf,m.blankLength],[`Eaves half ${fmt(m.eavesHalf)}`,`Full gable blank ${fmt(m.blankLength)}`]);
  c.text(`Two 3 mm kerfs; ${fmt(m.remaining)} spare per board. Eaves: 2 runs of ${fmt(m.eavesRun)}, each with a supported centre joint.`,12,69,7.5);
  c.text(`Gable blank = ${fmt(m.ridgeFaceRun)} to ridge face + ${fmt(m.halfRidge)} to centre + ${fmt(m.fasciaExtension)} eaves extension + ${fmt(m.endAllowance)} end skew.`,12,77,7.5);
  const x = 15, y = 91, scale = 167 / Math.max(m.blankLength,FASCIA.trialBlank), h = 15;
  c.rect(x,y,FASCIA.trialBlank*scale,h);
  c.polygon([[x,y+h],[x+m.edgeLength*scale,y+h],[x+m.blankLength*scale,y],[x+m.endAllowance*scale,y]],'floor');
  hTechnical(c,x,x+FASCIA.trialBlank*scale,y,y-5,`${FASCIA.trialBlank} check blank`,7);
  hTechnical(c,x,x+m.blankLength*scale,y+h,y+h+5,`${fmt(m.blankLength)} overall blank`,7);
  c.text(`Plumb cuts, ${fmt(m.edgeLength)} along either edge.`,192,94,7.3);
  c.text(`${fmt(m.trialSpare)} spare from 2170 before kerf.`,192,102,7.3);
  c.text('Keep full length for the box-end overlap.',192,110,7.3,true);

  c.text('SOFFIT STOCK',12,126,9,true);
  c.text('Four white solid 5000 x 200 x 9 boards. Rip after checking the seated lip and wall finish.',12,133,7.5);
  drawStock(140,[m.eavesHalf,FASCIA.soffitGableBlank],[`Eaves half ${fmt(m.eavesHalf)}`,`Gable blank ${FASCIA.soffitGableBlank}`]);
  c.text(`Two 3 mm kerfs; ${fmt(m.soffitOffcut)} spare per board. Four eaves halves and four gable slopes.`,12,159,7.5);
  c.text(`Measured 215 to wall wrap - 25 battens - 32 featheredge = ${fmt(m.soffitDepth)} exposed. Add actual lip engagement.`,12,167,7.5);

  c.text('BOX-END STOCK',12,181,9,true);
  c.text(`One 1250 x 450 x 18 lipped blank yields 4 x 250 crosscuts. Keep the bottom lip horizontal; ${fmt(m.boxOffcut)} stock reserve.`,12,189,7.4);
  c.text('Trim closures from offcuts. Dry-fit one complete corner before batch cutting. See box-end assembly sheet.',12,197,7.4);
  c.text(`Garden room framing set | roofline cutting | page ${page} of ${total}`,148.5,205,6.4,false,'center');
  return c.stream();
}

export function drawBoxEnd(settings: Settings, page: number, total: number, c = canvas()) {
  const m = fasciaPlan(settings);
  const rise = Math.tan(settings.roofPitch * Math.PI / 180);
  c.text('Box end - bargeboard overlapping the return',12,12,14,true);
  c.text('One corner shown; mirror at opposite slopes. The overlap and lip seat are schematic.',12,20,8);
  c.text('GABLE ELEVATION',12,34,8.5,true);
  const x = 20, y = 126, k = Math.min(.25,37/m.boxFaceWidth);
  const X = (u:number) => x+u*k, Y = (v:number) => y-v*k;
  const top = (u:number) => FASCIA.width+(u-28)*rise;
  const bottom = (u:number) => (u-m.boxFaceWidth)*rise + m.soffitStep;
  const end = m.boxFaceWidth + 115;
  // Return face behind the rake board. Its upper cut and depth are fit on site.
  c.polygon([[X(0),Y(0)],[X(m.boxFaceWidth),Y(0)],[X(m.boxFaceWidth),Y(top(m.boxFaceWidth)-22)],[X(0),Y(top(0)-22)]],'floor');
  c.line(X(0),Y(5),X(m.boxFaceWidth),Y(5),[0,0,0],.7);
  c.line(X(m.boxFaceWidth),Y(5),X(m.boxFaceWidth),Y(Math.max(5,m.soffitStep+5)),[0,0,0],.9);
  const levelCutEnd = rise > 0 ? Math.max(0,Math.min(end,m.boxFaceWidth-m.soffitStep/rise)) : 0;
  c.polygon([[X(0),Y(Math.max(0,bottom(0)))],[X(levelCutEnd),Y(Math.max(0,bottom(levelCutEnd)))],[X(end),Y(Math.max(0,bottom(end)))],[X(end),Y(top(end))],[X(0),Y(top(0))]],'timber');
  c.line(X(m.boxFaceWidth),Y(bottom(m.boxFaceWidth)),X(m.boxFaceWidth),Y(top(m.boxFaceWidth)-22),[0,0,0],.25,[1,1]);
  c.rect(22,71,56,8);
  c.text('Full-length outer bargeboard',24,77,8,true);
  c.rect(23,107,30,8);
  c.text('Box end behind',25,113,7.5,true);
  hTechnical(c,X(0),X(m.boxFaceWidth),y,y+8,`~${fmt(m.boxFaceWidth)} exposed run`,7);
  c.text('Box-end lip and eaves fascia bottoms align.',12,144,7.2);
  c.text('Dashed edge is concealed behind the barge.',12,150,7.2);

  c.text('PLAN AT THE OVERLAP',119,34,8.5,true);
  c.text('Outside gable face',119,42,7);
  c.rect(119,50,89,7,'timber');
  c.rect(128,57,51,7,'floor');
  c.rect(119,57,9,49);
  c.rect(128,64,51,32,'floor');
  c.line(179,64,179,96,[0,0,0],.65);
  c.text('Bargeboard',214,55,7.5);
  c.text('Box-end face behind',214,62,7.5);
  c.rect(130,76,37,8);
  c.text('Flat soffit return',132,82,7.5,true);
  c.text('Eaves fascia',119,113,7.5);
  c.text('Closure across soffit',184,96,7.2);
  c.text('Outside corner cover at eaves / box end.',119,126,7.5);
  c.text('Fit solid backing for each piece and the closure.',119,134,7.5);
  c.text('Set back the box end so the barge stays in the verge plane.',119,142,7.5);

  c.text(`Measured eaves: 178 from PIR to rafter tail bottom + 9 soffit + ~5 fascia drop = ~${fmt(m.eavesFaceDepth)} vertically.`,12,163,7.5);
  c.text(`Measured gable: 202 square to slope. At the finished cladding line, the sloping soffit is ~${fmt(m.soffitStep)} above the flat return.`,12,171,7.5);
  c.text('Seat the 9 mm soffit on the horizontal box-end lip. Mark the lap and any lip relief with both boards in place.',12,179,7.5);
  c.text('Check SupaLite cover seating, timber fixing depth and membrane drainage before trimming. Allow board movement.',12,187,7.5);
  c.text('Trims: 4 x 450 external corners; 2 x 450 straight trims for 2 eaves joints and 2 shaped apex covers. Check an apex first.',12,195,7.5);
  c.text(`Garden room framing set | box-end assembly | page ${page} of ${total}`,148.5,205,6.4,false,'center');
  return c.stream();
}
