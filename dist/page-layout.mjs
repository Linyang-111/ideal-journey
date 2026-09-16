// Align printed footers in the existing perspective view without changing the book.
export function footerBaseline(pageIndex){
 if(pageIndex%2===1)return 2020;
 const spread=pageIndex/2,angle=.015,c=Math.cos(angle),s=Math.sin(angle);
 const rightZ=.135-spread*.004+.0006;
 const rightY=(.5-2020/2100)*2.91;
 const projectedY=(c*rightY-s*rightZ)/(6.4-s*rightY-c*rightZ);
 const leftZ=spread===0?.145+.0175:.21+(spread-1)*.004+.0006;
 const leftY=(projectedY*(6.4-c*leftZ)+s*leftZ)/(c+projectedY*s);
 return (.5-leftY/(spread===0?3.02:2.91))*2100;
}
