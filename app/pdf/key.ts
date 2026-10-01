import { canvas, BRICK_DATUM_DASH, type Material } from "./layout";
export function drawPatternKey(page:number,total:number){
  const c=canvas();
  c.text("Black-and-white drawing key",16,16,16,true);
  c.text("Patterns identify component groups throughout this monochrome technical export.",16,25,8);
  const rows:[string,Material][]=[
    ['General framing and rafters',"timber"],['Corner framing',"corner"],
    ['Lintels / headers',"lintel"],['Brick dwarf wall (course outlines only; no individual bricks)',"masonry"],
    ['Floor build-up',"floor"],['Tie beams',"tie"],
    ['Ridge beam',"ridge"],['Wall top plates in roof plan / bearing plate in detail',"plate"],
    ['Gable outriggers',"outrigger"],
  ];
  rows.forEach(([name,colour],i)=>{const y=36+i*16;c.rect(18,y,32,10,colour);c.text(name,58,y+6.5,10);});
  c.text("White areas indicate openings or unfilled drawing backgrounds.",16,180,7);
  c.line(18,186,50,186,[0,0,0],.2,BRICK_DATUM_DASH);
  c.text("Dot-dash: brick datum and brick setting-out witness lines.",58,187,7.5);
  c.line(18,192,50,192,[0,0,0],.2);
  c.text("Solid: timber-frame setting-out witnesses and dimension bars.",58,193,7.5);
  c.line(18,198,50,198,[0,0,0],.2,[2,1]);
  c.text("Dashed: finished-floor datum (FFL), hidden edges and cutaway details.",58,199,7.5);
  c.text(`Garden room framing set | monochrome technical export | page ${page} of ${total}`,148.5,205,7,false,"center");
  return c.stream();
}
