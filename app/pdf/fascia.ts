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
  // Project both soffit underside levels from the splice to the step dimension.
  const upperSoffit = Y(FASCIA.lipDrop + m.soffitStep);
  const lowerSoffit = Y(FASCIA.lipDrop);
  c.line(X(splice),upperSoffit,92,upperSoffit,[0,0,0],.18,[1,1]);
  c.line(X(splice),lowerSoffit,92,lowerSoffit,[0,0,0],.18,[1,1]);
  c.line(91,upperSoffit,91,lowerSoffit,[0,0,0],.28);
  for (const level of [upperSoffit,lowerSoffit]) c.line(90,level-1,92,level+1,[0,0,0],.28);
  c.text(`~${fmt(m.soffitStep)} step`,94,(upperSoffit+lowerSoffit)/2+1,7,true);
  c.text('Box-end lip and eaves fascia bottoms align.',12,144,7.2);
  c.text('B is one piece over the full joint and lower step.',12,150,7.2);

  c.text('PLAN AT THE CORNER AND SPLICE - VIEW FROM ABOVE',119,34,8.5,true);
  c.text('Eaves fascia',119,45,7.5);
  const planY = (originalY: number) => 156 - originalY;
  const planBoard = (x: number, y: number, width: number, height: number, fill?: 'floor' | 'timber' | 'plate') =>
    c.rect(x,planY(y+height),width,height,fill);
  const planLine = (x1: number, y1: number, x2: number, y2: number, weight: number, dash: number[] | null = null) =>
    c.line(x1,planY(y1),x2,planY(y2),[0,0,0],weight,dash);
  planBoard(119,50,60,7,'floor');
  planBoard(179,50,53,7,'timber');
  planBoard(119,57,9,49);
  planBoard(128,57,51,39,'floor');
  // Show the actual face board in the cutaway below the gable soffit.
  planBoard(179,57,6,39,'plate');
  planLine(117,48,132,48,.85);
  planLine(117,48,117,63,.85);
  planLine(168,48,190,48,.85);
  planLine(179,48,179,62,.65,[1,1]);
  c.text('A',113,110,7,true); c.text('B',177,115,7,true);
  c.rect(130,74,37,8);
  c.text('Flat soffit return',132,80,7.5,true);
  planLine(182,76,189,85,.22);
  c.text('18 mm fascia closure',190,68,7.1);
  c.text('under gable soffit',190,75,7.1);
  c.text('Outside gable face',119,119,7);
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

  c.text('EAVES CUTAWAY - VERTICAL DATUMS',12,158,7.5,true);
  const eavesTop = 164, eavesScale = .13;
  const tailBottom = eavesTop + FASCIA.eavesPIRDepth * eavesScale;
  const soffitBottom = eavesTop + m.levelSoffitDepth * eavesScale;
  const fasciaBottom = eavesTop + m.eavesFaceDepth * eavesScale;
  c.line(47,eavesTop,68,eavesTop,[0,0,0],.4);
  c.line(54,eavesTop,54,fasciaBottom,[0,0,0],.28);
  c.line(54,tailBottom,70,tailBottom,[0,0,0],.4);
  c.line(54,soffitBottom,70,soffitBottom,[0,0,0],.38);
  c.line(47,fasciaBottom,54,fasciaBottom,[0,0,0],.55);
  vTechnical(c,eavesTop,fasciaBottom,47,22,`~${fmt(m.eavesFaceDepth)}`,6.5,'left');
  vTechnical(c,eavesTop,tailBottom,54,37,`${FASCIA.eavesPIRDepth}`,6.5,'left');
  c.text('PIR top',71,165,6.6);
  c.line(68,tailBottom,76,174,[0,0,0],.25);
  c.text('Rafter tail bottom',78,175,6.6);
  c.line(69,(tailBottom+soffitBottom)/2,76,181,[0,0,0],.25);
  c.text(`${FASCIA.soffitThickness} soffit thickness`,78,182,6.6);
  c.line(54,(soffitBottom+fasciaBottom)/2,76,189,[0,0,0],.25);
  c.text(`~${FASCIA.lipDrop} to fascia bottom`,78,190,6.6);

  c.text('GABLE CUTAWAY - SQUARE TO ROOF SLOPE',150,158,7.5,true);
  const vergeTop = 164, vergeBottom = vergeTop + FASCIA.vergePIRDepth*.122;
  c.line(182,vergeTop,202,vergeTop,[0,0,0],.45);
  c.line(182,vergeBottom,202,vergeBottom,[0,0,0],.45);
  c.line(197,vergeTop,197,vergeBottom,[0,0,0],.22,[1,1]);
  vTechnical(c,vergeTop,vergeBottom,182,163,`${FASCIA.vergePIRDepth}`,6.5,'left');
  c.text('PIR top',205,165,6.6);
  c.text('Fly-rafter underside',205,189,6.6);

  c.text('Seat soffit on the horizontal lip. Dry-fit the closure, both trims and SupaLite cover before cutting.',12,196,7.2);
  c.text('Allow movement and drainage. Use straight covers at eaves centre joints and gable apexes.',12,201,7.2);
  c.text(`Garden room framing set | box-end assembly | page ${page} of ${total}`,148.5,205,6.4,false,'center');
  return c.stream();
}
