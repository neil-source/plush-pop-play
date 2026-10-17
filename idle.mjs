// Cosmetic poses never change the physics world, scores, or saved bodies.
export class Idle {
 constructor(game,art,chirp){this.game=game;this.art=art;this.chirp=chirp;this.poses=new Map();this.quiet=0;this.next=5;this.chirpCooldown=0;}
 reset(){this.poses.clear();this.quiet=0;this.next=5;}
 begin(body){
  if(!body||body.type==='bubble'||this.poses.has(body.id))return;
  const artID=body.skin?'skin_'+body.skin:body.type;
  if(!this.art.images['idle_'+artID+'_0'])return;
  this.poses.set(body.id,{type:body.type,skin:body.skin,artID,age:0,duration:1.8,chirped:false});
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
   if(!b||b.type!==p.type||b.skin!==p.skin||p.age>=p.duration||Math.hypot(b.vx,b.vy)>30){this.poses.delete(id);continue;}
   if(['owl','penguin'].includes(p.type)&&p.age>=p.duration*.25&&!p.chirped&&this.chirpCooldown<=0){this.chirp();p.chirped=true;this.chirpCooldown=5;}
  }
 }
 pose(body){
  const p=this.poses.get(body.id);if(!p||p.type!==body.type||p.skin!==body.skin)return null;
  // Anticipation, wink/wave, alternating wave, then settle. Only drawn pixels move.
  const sequence=[0,1,2,1,2,3],frame=sequence[Math.min(5,Math.floor(p.age/p.duration*6))];
  return{key:'idle_'+p.artID+'_'+frame,angle:0,x:0,y:0,xScale:1,yScale:1};
 }
}
