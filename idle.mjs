// Cosmetic poses never change the physics world, scores, or saved bodies.
export class Idle {
 constructor(game,art,chirp){this.game=game;this.art=art;this.chirp=chirp;this.poses=new Map();this.quiet=0;this.next=5;this.chirpCooldown=0;}
 reset(){this.poses.clear();this.quiet=0;this.next=5;}
 begin(body){
  if(!body||body.type==='bubble'||this.poses.has(body.id))return;
  const frames=!body.skin&&!!this.art.images['idle_'+body.type+'_0'];
  this.poses.set(body.id,{type:body.type,age:0,duration:frames?(['stitch','mint','ember'].includes(body.type)?1.12:1.9):1.6,frames,chirped:false});
 }
 update(dt,blocked=false){
  const g=this.game;this.chirpCooldown=Math.max(0,this.chirpCooldown-dt);
  if(blocked||!g.profile.motion||!g.canAct||g.has('stop')||g.chain.length||g.feedback.some(e=>['pop','super','shuffle','fever','bubbleBorn'].includes(e.kind))){this.reset();return;}
  this.quiet+=dt;
  if(this.quiet>=this.next&&this.poses.size<3){
   const candidates=g.round.bodies.filter(b=>b.type!=='bubble'&&!this.poses.has(b.id)&&b.y>230&&b.y<760&&Math.hypot(b.vx,b.vy)<12);
   if(candidates.length)this.begin(candidates[Math.floor(Math.random()*candidates.length)]);
   this.next=this.quiet+.65+Math.random()*.45;
  }
  for(const [id,p]of this.poses){
   const b=g.round.bodies.find(b=>b.id===id);p.age+=dt;
   if(!b||b.type!==p.type||p.age>=p.duration||Math.hypot(b.vx,b.vy)>30){this.poses.delete(id);continue;}
   if(['owl','penguin'].includes(p.type)&&p.age>=p.duration*.25&&!p.chirped&&this.chirpCooldown<=0){this.chirp();p.chirped=true;this.chirpCooldown=5;}
  }
 }
 pose(body){
  const p=this.poses.get(body.id);if(!p||p.type!==body.type)return null;
  const t=p.age/p.duration,envelope=Math.sin(t*Math.PI),wiggle=Math.sin(t*Math.PI*4)*envelope;
  const puff=1+envelope*.14;
  return{key:p.frames?'idle_'+p.type+'_'+Math.min(3,Math.floor(t*4)):null,angle:wiggle*.18,x:wiggle*2.5,y:-envelope*7.5,xScale:puff+wiggle*.06,yScale:puff-wiggle*.06};
 }
}
