// Port of PlushMotion.swift. Presentation uses the same clocks as the Mac app;
// these poses never change the physics circles, body coordinates or rewards.
export const clamp=x=>Math.max(0,Math.min(1,x));
export const mix=(a,b,t)=>a+(b-a)*t;
export const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
export const SUPER={duration:5,cast:2.55,travel:1.1,reveal:.4,reduced:.3};
export const POP={squeeze:.055,snap:.035,impact:.09,vanish:.065,stagger:i=>Math.min(.07,i*.012)};
export class SoftPose{
 constructor(){this.compression=0;this.velocity=0;this.selected=false;}
 bump(strength,horizontal=false){this.velocity=Math.max(-5,Math.min(5,this.velocity+Math.min(3.5,Math.max(0,strength))*(horizontal?-1:1)));}
 step(dt,falling=0,enabled=true){
  if(!enabled){this.compression=this.velocity=0;return;}
  const target=-Math.min(.075,Math.max(0,falling-100)/7000),steps=Math.max(1,Math.ceil(dt/.008)),h=dt/steps;
  for(let i=0;i<steps;i++){this.velocity+=((target-this.compression)*240-this.velocity*15)*h;this.compression+=this.velocity*h;
   if(Math.abs(this.compression)>.22){this.compression=Math.max(-.22,Math.min(.22,this.compression));this.velocity*=.5;}}
  if(Math.abs(this.compression-target)<.0002&&Math.abs(this.velocity)<.002){this.compression=target;this.velocity=0;}
 }
 get xScale(){return 1+this.compression;}
 get yScale(){return 1/(1+this.compression);}
}
export class SuperPlan{
 constructor(hero,targets=[]){this.hero=hero;this.targets=targets;this.indices=new Map(targets.map((b,i)=>[b.id,i]));const o=this.origin;this._radius=Math.max(hero==='sunny'?160:150,...targets.map(b=>Math.hypot(b.x-o.x,b.y-o.y)));}
 get shape(){return ['sunny','splash'].includes(this.hero)?'radial':['mint','byte'].includes(this.hero)?'horizontal':this.hero==='ember'?'vertical':'projectiles';}
 get origin(){const [x,y]=({sunny:[270,610],splash:[270,615],mint:[40,730],byte:[40,610],ember:[270,770]})[this.hero]||[270,285];return{x,y};}
 get radius(){return this._radius;}
 progress(b){const o=this.origin;return clamp(this.shape==='radial'?Math.hypot(b.x-o.x,b.y-o.y)/this.radius:this.shape==='horizontal'?(b.x-40)/460:this.shape==='vertical'?(770-b.y)/590:0);}
 launch(b){return SUPER.cast+(this.shape==='projectiles'?(this.indices.get(b.id)||0)/Math.max(1,this.targets.length-1)*.28:0);}
 arrival(b){const o=this.origin;return this.shape==='projectiles'?this.launch(b)+Math.min(.82,Math.max(.42,Math.hypot(b.x-o.x,b.y-o.y)/650)):SUPER.cast+this.progress(b)*SUPER.travel;}
 projectile(b,t){const o=this.origin,u=clamp((t-this.launch(b))/(this.arrival(b)-this.launch(b))),cx=(o.x+b.x)/2+(b.x<270?-28:28),cy=(o.y+b.y)/2-28;return{x:(1-u)**2*o.x+2*(1-u)*u*cx+u*u*b.x,y:(1-u)**2*o.y+2*(1-u)*u*cy+u*u*b.y,u};}
 front(t){const u=clamp((t-SUPER.cast)/SUPER.travel),o=this.origin;return{x:this.shape==='horizontal'?mix(o.x,500,u):o.x,y:this.shape==='vertical'?mix(o.y,180,u):o.y,radius:this.radius*u,u};}
}
export function heroPose(plan,t){
 const start={x:71,y:810},center={x:270,y:425},o=plan.origin;
 let x=center.x,y=center.y,sx=.9,sy=.94,angle=0,alpha=1;
 if(t<.6){const u=ease(t/.6);x=mix(start.x,center.x,u);y=mix(start.y,center.y,u);sx=mix(.12,.98,u);sy=mix(.12,.86,u);}
 else if(t<.8){const u=ease((t-.6)/.2);sx=mix(.98,.9,u);sy=mix(.86,.94,u);}
 else if(t<1.15){}
 else if(t<2.2){const u=clamp((t-1.15)/1.05),v=1-u,c2={x:Math.min(455,Math.max(85,o.x+90)),y:Math.max(225,o.y-100)};
  x=v*v*v*270+3*v*v*u*430+3*v*u*u*c2.x+u*u*u*o.x;y=v*v*v*425+3*v*v*u*220+3*v*u*u*c2.y+u*u*u*o.y;
  sx=mix(.9,.3,ease(u));sy=mix(.94,.3,ease(u));angle=.12*u;
 }else{x=o.x;y=o.y;sx=sy=.3;
  if(t<2.45){const u=ease((t-2.2)/.25);sx=mix(.3,.34,u);sy=mix(.3,.24,u);angle=.12*(1-u);}
  else if(t<2.55){const u=clamp((t-2.45)/.1);sx=mix(.34,.26,u);sy=mix(.24,.38,u);}
  else if(t<2.67){const u=ease((t-2.55)/.12);sx=mix(.26,.3,u);sy=mix(.38,.3,u);}
  else if(t>3.07){const u=clamp((t-3.07)/.8);x=mix(o.x,start.x,ease(u));y=mix(o.y,start.y,ease(u));sx=sy=mix(.3,.1,u);alpha=1-u;}
 }
 return{x,y,scaleX:sx,scaleY:sy,angle,alpha};
}
export function popPose(age,impact){
 if(age>=impact){const u=clamp((age-impact)/POP.vanish);return{x:mix(1,1.35,u),y:mix(1,1.35,u),alpha:1-u};}
 const t=age-(impact-POP.impact);
 if(t<=0)return{x:1,y:1,alpha:1};
 if(t<POP.squeeze){const u=ease(t/POP.squeeze);return{x:mix(1,1.16,u),y:mix(1,.85,u),alpha:1};}
 const u=clamp((t-POP.squeeze)/POP.snap);return{x:mix(1.16,.94,u),y:mix(.85,1.1,u),alpha:1};
}
