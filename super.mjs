import {SUPER,clamp,mix,ease,heroPose} from './motion.mjs';

// Uses the native character's four generated power cels. No generic icon shower.
export function drawSuper(fx,ctx){
 const s=fx.super;if(!s)return;
 const a=fx.art,t=fx.time-s.start,motion=fx.game.profile.motion,plan=s.plan;
 const power=(phase,x,y,w,options={})=>a.draw(ctx,'power_'+s.hero+'_'+phase,x,y,w,w,options);
 const animated=(x,y,w,options={})=>power(Math.floor(Math.max(0,t-SUPER.cast)/.085)%4,x,y,w,options);
 ctx.save();ctx.beginPath();ctx.rect(0,174,540,642);ctx.clip();
 fx.draw(ctx,{targetsOnly:true});
 // The original body stays visible until the travelling effect actually arrives.
 for(const b of s.targets){
  if(s.cleared.has(b.id))continue; // pop ghosts are drawn above the dim, separately
  const after=s.after.get(b.id);if(!after)continue;
  const age=t-(motion?plan.arrival(b):.12);if(age>=.4)continue;
  let shown=b,sx=1,sy=1,angle=b.angle;
  if(motion&&age>=0){
   if(age<.13){const u=ease(age/.13);sx=mix(1,.08,u);sy=mix(1,1.12,u);angle+=.15*u;}
   else{shown=after;if(age<.28){const u=ease((age-.13)/.15);sx=mix(.08,1.16,u);sy=mix(1.12,.88,u);angle+=.15*(1-u);}else{const u=ease((age-.28)/.12);sx=mix(1.16,1,u);sy=mix(.88,1,u);}}
  }else if(!motion&&age>=0)shown=after;
  const bubble=shown.type==='bubble',key=bubble?'bubble_'+shown.kind:'char_'+shown.type,size=bubble?64.8:52;
  ctx.save();ctx.translate(b.x,b.y);ctx.rotate(angle);ctx.scale(sx,sy);
  a.draw(ctx,key,0,0,size,size,{bodyDiameter:bubble?undefined:52});
  if(age<0)a.silhouette(ctx,key,0,0,size,0,'white',3);
  ctx.restore();
 }
 if(motion){
  const o=plan.origin,cast=t-SUPER.cast;
  if(cast>=0&&cast<.18)a.draw(ctx,'vfx_ring',o.x,o.y,58*(1+cast/.18*.5),58*(1+cast/.18*.5),{alpha:1-cast/.18,rainbow:false});
  if(plan.shape==='projectiles'){
   for(const b of plan.targets){if(t<plan.launch(b)||t>=plan.arrival(b))continue;const p=plan.projectile(b,t);animated(p.x,p.y,52,{angle:p.u*1.4});}
  }else if(cast>=0&&cast<SUPER.travel+.15){
   const p=plan.front(t),alpha=clamp((SUPER.travel+.15-cast)/.15);
   if(plan.shape==='radial')power(0,p.x,p.y,Math.max(.1,p.radius*2/.84),{alpha});
   else animated(p.x,p.y,180,{alpha,angle:plan.shape==='vertical'?-Math.PI/2:0});
  }
  for(const b of plan.targets){const age=t-plan.arrival(b);if(age<0||age>.24)continue;
   const size=86*(age<.12?mix(.45,1,age/.12):mix(1,1.2,(age-.12)/.12));power(3,b.x,b.y,size,{alpha:age<.12?1:1-(age-.12)/.12});
  }
  // Buff-only powers have a visible delivery to the appropriate meter too.
  if(s.spec.steps.some(step=>step.kind==='buff')&&cast>=0&&cast<.93){
   const u=clamp(cast/.75),dest=fx.target(s.spec.steps.some(step=>step.pattern==='time'||step.pattern==='stop'||step.pattern==='slow')?'time':'skill');
   // Leave the bowl crop before drawing this flight in drawSuperRewards below.
   s.gift={x:(1-u)**2*o.x+2*(1-u)*u*420+u*u*dest.x,y:(1-u)**2*o.y+2*(1-u)*u*200+u*u*dest.y,size:90*mix(1,.45,u),alpha:clamp((.93-cast)/.18),frame:Math.floor(cast/.085)%4};
  }else s.gift=null;
  if(t<1.1)a.draw(ctx,'fx_rays',270,425,380*mix(.4,1,ease(t/.7)),380*mix(.4,1,ease(t/.7)),{alpha:.3*clamp((1.1-t)/.4),angle:t*.4});
  // Small sparkles follow the actual approach path and retire in a quarter second.
  for(let i=0;i<12;i++){const at=1.16+i*.085,age=t-at;if(age<0||age>.25)continue;const pose=heroPose(plan,at);a.draw(ctx,'vfx_sparkle',pose.x,pose.y,14*(1-age/.25*.8),14*(1-age/.25*.8),{alpha:1-age/.25});}
 }
 const pose=motion?heroPose(plan,t):{x:270,y:425,scaleX:.7,scaleY:.7,angle:0,alpha:clamp((.3-t)/.14)};
 if(pose.alpha>0){
  ctx.save();ctx.translate(pose.x,pose.y);ctx.rotate(pose.angle);ctx.scale(pose.scaleX,pose.scaleY);ctx.globalAlpha*=pose.alpha;
  ctx.save();ctx.globalAlpha*=.65;a.silhouette(ctx,'char_'+s.hero,0,0,240,0,'white',3);ctx.restore();
  a.draw(ctx,'char_'+s.hero,0,0,240,240,{bodyDiameter:240});power(0,91,-30,122);ctx.restore();
 }
 if(motion&&t>=.25&&t<1.3){const alpha=Math.min(clamp((t-.25)/.2),clamp((1.3-t)/.2)),scale=mix(.7,1,ease((t-.25)/.2));
  a.label(ctx,s.spec.name.toUpperCase(),270,610,36,425,{alpha,scaleX:scale,scaleY:scale});
  a.label(ctx,s.name.toUpperCase(),270,660,22,425,{alpha,scaleX:scale,scaleY:scale});
 }
 ctx.restore();
 if(s.gift){const p=s.gift;power(p.frame,p.x,p.y,p.size,{alpha:p.alpha});}
}
