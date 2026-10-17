import {RADIUS} from './rules.mjs';
const radius=b=>b.type==='bubble'?24:RADIUS;
export class World{
 constructor(geometry){
  this.accumulator=0;this.quiet=0;this.sleeping=false;
  this.left=geometry.left[0][0];this.right=geometry.right[0][0];
  const floor=geometry.floor,at=x=>{for(let i=1;i<floor.length;i++)if(x<=floor[i][0]){const [ax,ay]=floor[i-1],[bx,by]=floor[i];return ay+Math.max(0,(x-ax)/(bx-ax))*(by-ay);}return floor.at(-1)[1];};
  this.limits=new Map();for(const r of [RADIUS,24])this.limits.set(r,Float64Array.from({length:541},(_,x)=>Math.min(...Array.from({length:24},(_,i)=>at(x+Math.cos(i*Math.PI/12)*r)-Math.sin(i*Math.PI/12)*r))));
 }
 ground(b){const values=this.limits.get(radius(b)),x=Math.max(0,Math.min(539.99,b.x)),a=Math.floor(x);return values[a]+(values[a+1]-values[a])*(x-a);}
 wake(){this.sleeping=false;this.quiet=0;}
 contain(b){const r=radius(b);if(b.x<this.left+r){b.x=this.left+r;if(b.vx<0)b.vx*=-.12;}if(b.x>this.right-r){b.x=this.right-r;if(b.vx>0)b.vx*=-.12;}
  const floor=this.ground(b);if(b.y>floor){const values=this.limits.get(r),i=Math.max(1,Math.min(539,Math.round(b.x))),slope=(values[i+1]-values[i-1])/2;
   b.y=floor;if(b.vy>90)b.squash=Math.max(b.squash||0,Math.min(.18,b.vy/3500));
   if(b.vy>0){b.vx+=slope*b.vy*.25;b.vy*= -.04;}b.vx*=.97;
  }
 }
 advance(bodies,dt,motion=true,fever=false){
  for(const b of bodies)b.squash=Math.max(0,(b.squash||0)-dt*.9);
  if(this.sleeping)return;
  this.accumulator+=Math.min(.1,dt);while(this.accumulator>=1/120){this.step(bodies,1/120,motion,fever);this.accumulator-=1/120;}
 }
 step(bodies,dt,motion,fever){
  for(const b of bodies){b.px=b.x;b.py=b.y;b.vy=Math.min(760,b.vy+1100*dt);b.vx*=.997;b.x+=b.vx*dt;b.y+=b.vy*dt;
   const rest=b.type==='bubble'?0:((b.id*137)%101/100-.5)*1.3,lean=motion?Math.max(-.18,Math.min(.18,b.vx/1800)):0;
   b.angle+=(rest+lean-b.angle)*Math.min(1,dt*4);this.contain(b);
  }
  for(let iteration=0;iteration<8;iteration++){
   const grid=new Map();
   for(const b of bodies){const gx=Math.floor(b.x/55),gy=Math.floor(b.y/55);
    for(let x=gx-1;x<=gx+1;x++)for(let y=gy-1;y<=gy+1;y++)for(const a of grid.get(x+y*32)||[]){
     let dx=b.x-a.x,dy=b.y-a.y,d2=dx*dx+dy*dy;const sum=radius(a)+radius(b);if(d2>=sum*sum)continue;
     if(d2<1e-8){dx=.001;dy=.0001;d2=dx*dx+dy*dy;}const d=Math.sqrt(d2),nx=dx/d,ny=dy/d,correction=Math.max(0,sum-d-.08)*.48;
     a.x-=nx*correction;a.y-=ny*correction;b.x+=nx*correction;b.y+=ny*correction;
     const toward=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(toward<0){const impulse=-toward*.52;a.vx-=nx*impulse;a.vy-=ny*impulse;b.vx+=nx*impulse;b.vy+=ny*impulse;
      if(motion&&iteration===0&&impulse>100){a.squash=Math.max(a.squash||0,Math.min(.13,impulse/3000));b.squash=Math.max(b.squash||0,Math.min(.13,impulse/3000));}
     }
    }
    const key=gx+gy*32;if(!grid.has(key))grid.set(key,[]);grid.get(key).push(b);
   }
   for(const b of bodies)this.contain(b);
  }
  let fastest=0;for(const b of bodies){b.vx=((b.x-b.px)/dt*.85+b.vx*.15)*.997;b.vy=((b.y-b.py)/dt*.85+b.vy*.15)*.997;const speed=Math.hypot(b.vx,b.vy);if(speed>1000){b.vx*=1000/speed;b.vy*=1000/speed;}fastest=Math.max(fastest,speed);delete b.px;delete b.py;}
  this.quiet=fastest<6&&bodies.every(b=>b.y>200)?this.quiet+dt:0;
  if(this.quiet>.7){this.sleeping=true;for(const b of bodies)b.vx=b.vy=0;}
 }
}
