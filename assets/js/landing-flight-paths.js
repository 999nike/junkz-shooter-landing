// Original authored landing choreography, restored from 9cd71bc / battle-scene.js.
// Coordinates and time remapping are retained; the renderer adapts the flight plane.
(() => {
 const points=Object.freeze({"player":[[-7.1,-3.2,0.8],[-4.8,-1.45,0.15],[-2.35,1.75,-0.45],[0.15,2.85,-0.8],[3.25,1.85,-0.15],[4.2,-0.1,0.55],[2.25,-2.8,0.8],[-0.8,-3.25,0.35],[-3.15,-0.45,-0.35],[-1.05,2.45,-0.7],[2.35,2.7,-0.3],[4.65,1.35,0.2],[7.15,0.45,0.85]],"bossDesktop":[[3.65,1.9,-1.15],[3.25,2.3,-1.05],[3.95,1.55,-0.75],[4.45,0.75,-0.45],[4.0,0.25,-0.65],[3.15,1.05,-0.95]],"bossMobile":[[2.12,1.78,-1.15],[1.84,2.08,-1.05],[2.26,1.48,-0.75],[2.48,0.72,-0.45],[2.24,0.28,-0.65],[1.82,1.0,-0.95]]});
 const playerProgress=time=>{
  const p=(time%12)/12;if(p<=.88)return p*.9;
  const b=(p-.88)/.12,b2=b*b,b3=b2*b;
  return (2*b3-3*b2+1)*(.88*.9)+(b3-2*b2+b)*(.9*.12)+(-2*b3+3*b2);
 };
 const bossProgress=time=>(time/12+.02*Math.sin(time/12*Math.PI*2))%1;
 const pulse=(time,start,duration)=>{const t=(time-start)/duration;return t>=0&&t<=1?Math.sin(t*Math.PI):0;};
 window.LandingFlightPaths=Object.freeze({points,playerProgress,bossProgress,pulse,
  create(T){const curve=(p,closed,type,tension)=>new T.CatmullRomCurve3(p.map(v=>new T.Vector3(...v)),closed,type,tension);return {player:curve(points.player,false,'catmullrom',.48),bossDesktop:curve(points.bossDesktop,true,'centripetal'),bossMobile:curve(points.bossMobile,true,'centripetal')};}
 });
})();
