import type { Settings } from '../framing';
import { FASCIA, fasciaPlan } from '../fascia';
import { canvas, fmt, hTechnical } from './layout';

export function drawFascia(settings: Settings, page: number, total: number, c = canvas()) {
  const m = fasciaPlan(settings);
  c.text('Roofline cutting plan',12,12,14,true);
  c.text('Nominal dimensions in mm | mark from fitted faces | mirror the gable cuts on two boards',12,20,8);

  c.text('FASCIA / BARGEBOARD STOCK',12,34,9,true);
  c.text('Four white 5000 x 200 x 18 lipped boards. Preserve the bottom lip.',12,41,7.5);
  const drawStock = (y: number, cuts: [number,number], labels: [string,string]) => {
    const x = 14, length = 263, height = 12, scale = length / FASCIA.stockLength;
    c.rect(x,y,length,height);
    c.rect(x,y,cuts[0]*scale,height);
    const next = x + (cuts[0] + FASCIA.kerf)*scale;
    c.rect(next,y,cuts[1]*scale,height);
    c.text(labels[0],x+cuts[0]*scale/2,y+7.5,7.2,true,'center');
    c.text(labels[1],next+cuts[1]*scale/2,y+7.5,7.2,true,'center');
  };
  drawStock(49,[m.eavesHalf,m.blankLength],[`Eaves half ${fmt(m.eavesHalf)}`,`Main barge blank ${fmt(m.blankLength)}`]);
  c.text(`Two 3 mm kerfs; ${fmt(m.remaining)} spare per board. Eaves: 2 runs of ${fmt(m.eavesRun)}, each with a supported centre joint.`,12,69,7.5);
  c.text(`Gable blank = ${fmt(m.ridgeFaceRun)} to ridge face + ${fmt(m.halfRidge)} to centre + ${fmt(m.fasciaExtension)} eaves extension - ${fmt(m.boxFaceWidth / Math.cos(settings.roofPitch * Math.PI / 180))} box end + ${fmt(m.endAllowance)} end skew.`,12,77,7.5);
  const x = 15, y = 91, scale = 167 / Math.max(m.blankLength,FASCIA.trialBlank), h = 15;
  c.rect(x,y,FASCIA.trialBlank*scale,h);
  c.polygon([[x,y+h],[x+m.edgeLength*scale,y+h],[x+m.blankLength*scale,y],[x+m.endAllowance*scale,y]]);
  hTechnical(c,x,x+FASCIA.trialBlank*scale,y,y-5,`${FASCIA.trialBlank} check blank`,7);
  hTechnical(c,x,x+m.blankLength*scale,y+h,y+h+5,`${fmt(m.blankLength)} overall blank`,7);
  c.text(`Plumb cuts, ${fmt(m.edgeLength)} along either edge.`,192,94,7.3);
  c.text(`${fmt(m.trialSpare)} spare from 2170 before kerf.`,192,102,7.3);
  c.text('Plumb end stops at the box-end splice.',192,110,7.3,true);

  c.text('SOFFIT STOCK',12,126,9,true);
  c.text('Four white solid 5000 x 200 x 9 boards. Rip after checking the seated lip and wall finish.',12,133,7.5);
  drawStock(140,[m.eavesHalf,FASCIA.soffitGableBlank],[`Eaves half ${fmt(m.eavesHalf)}`,`Gable blank ${FASCIA.soffitGableBlank}`]);
  c.text(`Two 3 mm kerfs; ${fmt(m.soffitOffcut)} spare per board. Four eaves halves and four gable slopes.`,12,159,7.5);
  c.text(`Measured 215 to wall wrap - 25 battens - 32 featheredge = ${fmt(m.soffitDepth)} exposed. Add actual lip engagement.`,12,167,7.5);

  c.text('BOX-END STOCK',12,181,9,true);
  c.text(`One 1250 x 450 x 18 lipped blank yields 4 x 250 crosscuts. Keep the bottom lip horizontal; ${fmt(m.boxOffcut)} stock reserve.`,12,189,7.4);
  c.text('Cut rear fascia closures from offcuts. Dry-fit one complete corner before batch cutting. See box-end assembly sheet.',12,197,7.4);
  c.text(`Garden room framing set | roofline cutting | page ${page} of ${total}`,148.5,205,6.4,false,'center');
  return c.stream();
}

export function drawBoxEnd(settings: Settings, page: number, total: number, c = canvas()) {
  const m = fasciaPlan(settings);
  const rise = Math.tan(settings.roofPitch * Math.PI / 180);
  c.text('Box end - bargeboard finishing flush at the uphill edge',12,12,14,true);
  c.text('One corner shown; mirror at opposite slopes. Trim sections and lip seat are schematic.',12,20,8);
  c.text('GABLE ELEVATION',12,34,8.5,true);
  const x = 23, y = 124, k = Math.min(.25,40/m.boxFaceWidth);
  const X = (u:number) => x+u*k, Y = (v:number) => y-v*k;
  const bottom = (u:number) => (u-m.boxFaceWidth)*rise + m.soffitStep;
  const top = (u:number) => bottom(u) + FASCIA.width / Math.cos(settings.roofPitch*Math.PI/180);
  const end = m.boxFaceWidth + 108;
  c.polygon([[X(0),Y(0)],[X(m.boxFaceWidth),Y(0)],[X(m.boxFaceWidth),Y(top(m.boxFaceWidth))],[X(0),Y(top(0))]],'floor');
  c.polygon([[X(m.boxFaceWidth),Y(bottom(m.boxFaceWidth))],[X(end),Y(bottom(end))],[X(end),Y(top(end))],[X(m.boxFaceWidth),Y(top(m.boxFaceWidth))]],'timber');
  c.line(X(0),Y(5),X(m.boxFaceWidth),Y(5),[0,0,0],.55);
  c.line(X(m.boxFaceWidth),Y(5),X(m.boxFaceWidth),Y(m.soffitStep+5),[0,0,0],.9);
  c.polygon([[X(0),Y(0)],[X(29),Y(0)],[X(29),Y(top(29))],[X(0),Y(top(0))]],'corner');
  // A single face leg covers the full joint; the return survives below the barge.
  const splice = m.boxFaceWidth;
  c.polygon([[X(splice-11),Y(0)],[X(splice+11),Y(0)],
    [X(splice+11),Y(top(splice+11))],[X(splice-11),Y(top(splice-11))]],'corner');
  c.line(X(splice-11),Y(m.soffitStep),X(splice+11),Y(m.soffitStep),[0,0,0],.25,[1,1]);
  c.text('A',X(0)+2,83,7,true);
  c.text('B',X(splice)+6,91,7,true);
  c.line(X(splice)+5,89,X(splice)+1,89,[0,0,0],.25);
  c.rect(33,96,23,7); c.text('Box end',35,101,7,true);
  c.rect(69,75,17,7); c.text('Barge',71,80,7,true);
  hTechnical(c,X(0),X(m.boxFaceWidth),y,y+8,`~${fmt(m.boxFaceWidth)} box face`,7);
  c.text('Box-end lip and eaves fascia bottoms align.',12,144,7.2);
  c.text('B is one piece over the full joint and lower step.',12,150,7.2);

  c.text('PLAN AT THE CORNER AND SPLICE - VIEW FROM ABOVE',119,34,8.5,true);
  c.text('Outside gable face',119,42,7);
  c.rect(119,50,60,7,'floor');
  c.rect(179,50,53,7,'timber');
  c.rect(119,57,9,49);
  c.rect(128,57,51,39,'floor');
  // Show the actual face board in the cutaway below the gable soffit.
  c.rect(179,57,6,39,'plate',[0,0,0],.32);
  c.line(117,48,132,48,[0,0,0],.85);
  c.line(117,48,117,63,[0,0,0],.85);
  c.line(168,48,190,48,[0,0,0],.85);
  c.line(179,48,179,62,[0,0,0],.65,[1,1]);
  c.text('A',113,49,7,true); c.text('B',177,46,7,true);
  c.rect(130,74,37,8);
  c.text('Flat soffit return',132,80,7.5,true);
  c.line(182,76,189,85,[0,0,0],.22);
  c.text('18 mm fascia closure',190,87,7.1);
  c.text('under gable soffit',190,94,7.1);
  c.text('Eaves fascia',119,113,7.5);
  c.text('A  External 90 degree cover wraps both faces.',119,124,7.5);
  c.text('B  Notched corner cover across the full splice.',119,132,7.5);
  c.text('Dashed leg wraps the fascia closure below the barge.',119,140,7.5);
  c.text('Alternative B: rebate one leg only where the barge enters.',119,148,7.5);
  c.text('Keep the full corner below the bargeboard.',119,155,7.5);

  c.text('B - CORNER TRIM CUTAWAY',237,34,7.1,true);
  c.rect(242,47,10,63,'corner');
  c.polygon([[252,101],[268,94],[268,103],[252,110]],'corner');
  c.line(252,101,268,94,[0,0,0],.32);
  c.line(252,47,268,40,[0,0,0],.25,[1,1]);
  c.line(268,40,268,94,[0,0,0],.25,[1,1]);
  c.text('Return removed',261,68,6.7);
  c.text('above barge bottom',261,73,6.7);
  c.text('Full corner at bottom',237,118,6.7);

  c.text(`Measured eaves: 178 from PIR to rafter tail bottom + 9 soffit + ~5 fascia drop = ~${fmt(m.eavesFaceDepth)} vertically.`,12,163,7.5);
  c.text(`Measured gable: 202 square to slope. At the finished cladding line, the sloping soffit is ~${fmt(m.soffitStep)} above the flat return.`,12,171,7.5);
  c.text('Seat the 9 mm soffit on the horizontal box-end lip. Scribe the closure and lip relief with both boards in place.',12,179,7.5);
  c.text('Check SupaLite cover seating, timber fixing depth and membrane drainage before trimming. Allow board movement.',12,187,7.5);
  c.text('Trims: 4 corner covers A and 4 notched corner covers B. Use straight covers at eaves joints and gable apexes.',12,195,7.5);
  c.text(`Garden room framing set | box-end assembly | page ${page} of ${total}`,148.5,205,6.4,false,'center');
  return c.stream();
}
