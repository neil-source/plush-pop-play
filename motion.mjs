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
 constructor(hero,targets=[],pattern=null){this.hero=hero;this.targets=targets;this.pattern=pattern;this.indices=new Map(targets.map((b,i)=>[b.id,i]));}
 get shape(){const groups={radial:['center','bottomCenter','ring'],horizontal:['row'],vertical:['column'],arc:['arch','diagonal','fan'],returning:['cross','diagonalCross','split'],rolling:['bottom','lowest'],spiral:['spiral','spokes'],volley:['scatter','corners','threePools','left','right'],zigzag:['zigzag','ladder','checker'],petals:['petals','heart','triangle'],reveal:['hero','heroColumn','largest','smallest']};for(const [shape,patterns]of Object.entries(groups))if(patterns.includes(this.pattern))return shape;return 'projectiles';}
 get traveling(){return !['radial','horizontal','vertical'].includes(this.shape);}
 get accent(){return ['horizontal','vertical','arc','rolling','returning','zigzag'].includes(this.shape)?'slash':['petals','radial'].includes(this.shape)?'flower':this.shape==='reveal'?'wrap':'spiral';}
 get origin(){return ['radial','petals'].includes(this.shape)?{x:270,y:610}:this.shape==='horizontal'?{x:40,y:610}:this.shape==='rolling'?{x:40,y:730}:this.shape==='vertical'?{x:270,y:770}:this.shape==='returning'?{x:70,y:380}:{x:270,y:285};}
 get radius(){const o=this.origin;return Math.max(160,...this.targets.map(b=>Math.hypot(b.x-o.x,b.y-o.y)));}
 progress(b){const o=this.origin;return clamp(this.shape==='radial'?Math.hypot(b.x-o.x,b.y-o.y)/this.radius:this.shape==='horizontal'?(b.x-40)/460:this.shape==='vertical'?(770-b.y)/590:0);}
 launch(b){return SUPER.cast+(this.traveling?(this.indices.get(b.id)||0)/Math.max(1,this.targets.length-1)*(this.shape==='volley'?.48:this.shape==='reveal'?.38:.28):0);}
 arrival(b){const o=this.origin;return this.traveling?this.launch(b)+Math.min(.82,Math.max(.42,Math.hypot(b.x-o.x,b.y-o.y)/650)):SUPER.cast+this.progress(b)*SUPER.travel;}
 point(b,u){u=clamp(u);const v=1-u,o=this.origin,sign=b.x<270?-1:1;let x=mix(o.x,b.x,u),y=mix(o.y,b.y,u);switch(this.shape){
 case'arc':y-=Math.sin(u*Math.PI)*145;x+=Math.sin(u*Math.PI)*sign*35;break;
 case'returning':x+=Math.sin(u*Math.PI*2)*95;y-=Math.sin(u*Math.PI)*45;break;
 case'rolling':y-=Math.abs(Math.sin(u*Math.PI*3))*35*v;break;
 case'spiral':x+=Math.sin(u*Math.PI*4)*85*Math.sin(u*Math.PI);y+=Math.cos(u*Math.PI*4)*55*Math.sin(u*Math.PI);break;
 case'volley':x+=Math.sin(u*Math.PI)*sign*80;y-=Math.sin(u*Math.PI)*95;break;
 case'zigzag':x+=Math.sin(u*Math.PI*5)*55*Math.sin(u*Math.PI);break;
 case'petals':x+=Math.sin(u*Math.PI)*sign*110;y-=Math.sin(u*Math.PI)*75;break;
 case'reveal':x=b.x;y=b.y-95*v*v;break;
 default:x=v*v*o.x+2*v*u*((o.x+b.x)/2+sign*28)+u*u*b.x;y=v*v*o.y+2*v*u*((o.y+b.y)/2-28)+u*u*b.y;
 }return{x,y,u};}
 projectile(b,t){return this.point(b,clamp((t-this.launch(b))/(this.arrival(b)-this.launch(b))));}
 direction(b){if(this.shape==='radial')return Math.atan2(b.y-this.origin.y,b.x-this.origin.x);if(this.shape==='horizontal')return 0;if(this.shape==='vertical')return -Math.PI/2;const p=this.point(b,.94);return Math.atan2(b.y-p.y,b.x-p.x);}
 front(t){const u=clamp((t-SUPER.cast)/SUPER.travel),o=this.origin;return{x:this.shape==='horizontal'?mix(o.x,500,u):o.x,y:this.shape==='vertical'?mix(o.y,180,u):o.y,radius:this.radius*u,u};}
}
export function actingFrame(t){return t<.8?0:t<1.15?1:t<2.2?3:t<2.45?0:t<2.75?2:t<3.65?1:3;}

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
  else if(t>3.65){const u=clamp((t-3.65)/.85);x=mix(o.x,start.x,ease(u));y=mix(o.y,start.y,ease(u));sx=sy=mix(.3,.1,u);alpha=1-u;}
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
