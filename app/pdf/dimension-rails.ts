export type RailDimension<T>={start:number;end:number;labelExtent:number;value:T};

/** Shorter overlapping dimensions occupy nearer rails; disjoint dimensions can share a rail. */
export function dimensionRails<T>(dimensions:RailDimension<T>[]){
  const placed:(RailDimension<T>&{rail:number;low:number;high:number})[]=[];
  for(const d of [...dimensions].sort((a,b)=>Math.abs(a.end-a.start)-Math.abs(b.end-b.start))){
    const centre=(d.start+d.end)/2,half=Math.max(Math.abs(d.end-d.start),d.labelExtent)/2+.8;
    const low=centre-half,high=centre+half;
    const overlapping=placed.filter(p=>low<p.high&&high>p.low);
    const rail=overlapping.length?Math.max(...overlapping.map(p=>p.rail))+1:0;
    placed.push({...d,rail,low,high});
  }
  return placed;
}
