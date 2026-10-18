import {SUPER,POP,SuperPlan,clamp,mix,ease,popPose} from './motion.mjs';
import {RewardClock} from './reward-clock.mjs';
import {drawSuper} from './super.mjs';
export const rating=n=>n>=20?'FANTASTIC!':n>=12?'EXCELLENT!':n>=7?'VERY GOOD!':n>=4?'GOOD!':'POP!';
export class Effects{
 constructor(art,game){this.art=art;this.game=game;this.reset();}
 target(kind){const [x,y]=({time:[64,65],coin:[230,95],score:[270,49],skill:[72,885],fever:[270,887]})[kind];return{x,y};}
 reset(){this.rewards=new RewardClock();this.time=0;this.items=[];this.pending=[];this.badges=[];this.super=null;this.counts={};this.arrivals={};this.sounds=[];}
 count(k){this.counts[k]=(this.counts[k]||0)+1;}
 add(p){this.items.push({start:this.time,duration:.5,...p});
  // Retire decoration before rewards or waiting targets. Delayed explosions live
  // in the queue, so a full-board clear cannot evict its own future animation.
  if(this.items.length>480){let i=this.items.findIndex(p=>['debris','spark','wave','burst'].includes(p.kind));if(i<0)i=this.items.findIndex(p=>p.kind!=='ghost');if(i>=0)this.items.splice(i,1);}
 }
 later(delay,run){this.pending.push({at:this.time+Math.max(0,delay),run});}
 badge(text,detail='',x=270,y=330,duration=.9,delay=0){
  if(delay>0){this.later(delay,()=>this.badge(text,detail,x,y,duration));return;}
  x=Math.max(160,Math.min(380,x));y=Math.max(280,Math.min(710,y));
  this.badges=this.badges.filter(b=>this.time<b.start+b.duration);while(this.badges.length>=3)this.badges.shift();
  const options=[y,y-90,y+90,y-180,y+180,290,480,670].filter(a=>a>=275&&a<=725);
  y=options.find(a=>this.badges.every(b=>Math.abs(b.y-a)>78||Math.abs(b.x-x)>260))??y;
  this.badges.push({text,detail,x,y,start:this.time,duration});
 }
 wave(x,y,tone='mint',size=150,delay=0){this.add({kind:'wave',key:'fx_wave_'+tone,x,y,size,start:this.time+delay,duration:this.game.profile.motion?.3:.15});}
 sparkle(x,y,size=24,delay=0,destination=null){this.add({kind:'spark',key:'fx_stars',x,y,size,destination,start:this.time+delay,duration:.31});}
 flight(key,x,y,tx,ty,{delay=0,size=25,character=false,coin=false,destination=null}={}){
  const motion=this.game.profile.motion;
  this.add({kind:'flight',key,x,y,tx,ty,size,character,coin,destination,start:this.time+delay,duration:motion?(character?.59:coin?.85:.7):.16,bend:(Math.random()-.5)*150,scatterX:(Math.random()-.5)*70,scatterY:35+Math.random()*50});
 }
 impact(b){return this.super?this.super.plan.arrival(b):POP.impact;}
 pulse(kind){const age=this.time-(this.arrivals[kind]??-100);return this.game.profile.motion&&age<.19?1+.1*Math.sin(age/.19*Math.PI):1;}
 explosion(b,power){
  this.count('explosion');if(!this.game.profile.motion)return;
  this.add({kind:'burst',x:b.x,y:b.y,size:92,duration:.25});
  this.add({kind:'wave',key:'vfx_ring',x:b.x,y:b.y,size:power?138:108,duration:.19});
  const count=power?5:3,phase=Math.random()*Math.PI*2;
  for(let i=0;i<count;i++){const puff=i%4===0,a=phase+i*Math.PI*2/count,d=(55+Math.random()*50)*(power?1.15:1);
   this.add({kind:'debris',key:puff?'vfx_puff':['vfx_star','vfx_sparkle','vfx_confetti_gold'][i%3],x:b.x,y:b.y,dx:Math.cos(a)*d,dy:Math.sin(a)*d,size:puff?22:8+Math.random()*9,puff,duration:.25});}
 }
 event(e){const g=this.game,r=g.round,motion=g.profile.motion;this.count(e.kind);
  switch(e.kind){
   case'select':this.badges=this.badges.filter(b=>!b.text.startsWith('CONNECT'));this.sparkle(e.body.x,e.body.y,18);if(e.count===g.minimumChain)this.wave(e.body.x,e.body.y,'mint',70);break;
   case'rejected':if(e.body){this.wave(e.body.x,e.body.y,'coral',70);this.badge('CONNECT '+g.minimumChain,'',e.body.x,e.body.y-30,.45);}break;
   case'message':this.badge(e.text);break;
   case'fever':this.rewards.hold('feverStart',1,this.rewards.delay('fever'));this.later(this.rewards.delay('feverStart'),()=>{this.badge('FEVER!','TRIPLE POINTS',270,280,1.1);this.wave(270,490,'gold',420);if(motion)for(let i=0;i<14;i++)this.sparkle(45+i*35,220+i%3*26,28);});break;
   case'feverEnd':if(e.score)this.badge('FEVER BONUS',String(e.score),270,280,1);this.sparkle(0,0,44,0,'score');break;
   case'announcement':this.badge(e.text,'',270,350,e.text==='LAST BONUS'?1.1:.65);break;
   case'bubbleBorn':this.wave(e.body.x,e.body.y,'mint',85);break;
   case'bubble':{const b=e.body;this.wave(b.x,b.y,({time:'mint',coin:'gold',score:'lavender',blast:'coral'})[b.kind],234);if(motion)for(let i=0;i<8;i++)this.sparkle(b.x+Math.cos(i*Math.PI/4)*70,b.y+Math.sin(i*Math.PI/4)*70);break;}
   case'bonus':{
    this.rewards.hold(e.type==='coin'?'coins':e.type,e.amount,motion?.7:0);
    this.badge('+'+e.amount+' '+({time:'SEC',coin:'COINS',score:'POINTS'})[e.type],'',e.x,e.y);
    this.flight(e.type==='time'?'icon_clock':e.type==='coin'?'fx_coin0':'icon_trophy',e.x,e.y,0,0,{size:32,destination:e.type});break;
   }
   case'pop':{
    const count=e.bodies.filter(b=>b.type!=='bubble').length;let lastDelay=0,firstDelay=Infinity;
    let index=0;
    e.bodies.forEach((b,i)=>{const delay=motion?(e.power?this.impact(b):POP.impact+POP.stagger(i)):0;lastDelay=Math.max(lastDelay,delay);firstDelay=Math.min(firstDelay,delay);
     if(b.type!=='bubble'){const j=index++,n=Math.max(1,count);this.rewards.hold('score',Math.floor(e.score*(j+1)/n)-Math.floor(e.score*j/n),delay);this.rewards.hold('coins',Math.floor(e.coins*(j+1)/n)-Math.floor(e.coins*j/n),delay+(motion?.89:0));if(!e.power&&b.type===r.hero)this.rewards.hold('skill',1,delay+(motion?.59:0));this.rewards.hold('fever',1,delay+(motion?.59:0));}
     this.add({kind:'ghost',body:b,duration:delay+POP.vanish,impact:delay,power:e.power});
     this.later(delay,()=>{
      this.explosion(b,e.power);
      if(b.type!=='bubble'){
       const destination=!e.power&&b.type===r.hero?'skill':'fever';
       this.count('copy-flight');this.flight('char_'+b.type,b.x,b.y,0,0,{size:52*.58,character:true,destination});
       this.count('coin-flight');this.flight('fx_coin0',b.x,b.y,0,0,{delay:.04,coin:true,destination:'coin'});
      }
     });
    });
    if(Number.isFinite(firstDelay))this.later(firstDelay,()=>this.sounds.push(e.bubble?'bubble':e.power?'skill':'pop'));
    for(let i=0;i<Math.min(20,Math.max(0,e.coins-count));i++){const b=e.bodies[i%e.bodies.length];this.later(lastDelay,()=>this.flight('fx_coin0',b.x,b.y,0,0,{coin:true,destination:'coin'}));}
    if(count){const b=e.bodies.at(-1);this.badge(e.power?'SUPER!':rating(count),'+'+e.score,b.x,b.y-30,.9,lastDelay);}break;
   }
   case'super':{this.rewards.clear('skill');
    const plan=new SuperPlan(e.hero,e.targets);
    this.super={...e,plan,start:this.time,duration:motion?SUPER.duration:SUPER.reduced,cleared:new Set(e.clearIDs),targetIDs:new Set(e.targets.map(b=>b.id)),after:new Map(r.bodies.filter(b=>e.targets.some(a=>a.id===b.id)).map(b=>[b.id,{...b}])),name:g.data.characters.find(c=>c.id===e.hero)?.name||e.hero};
    this.later(motion?SUPER.cast:0,()=>this.sounds.push(e.spec.steps.some(s=>['transform','bubbles'].includes(s.kind))?'super_magic':e.spec.steps.some(s=>s.kind==='clear')?'super_dash':'super_soft'));break;
   }
   case'shuffle':if(motion)for(const sign of [-1,1])this.add({kind:'debris',key:'fx_swoosh',x:270+sign*90,y:560,dx:sign*55,dy:-90,size:160,duration:.35});break;
   case'results':this.super=null;this.badges=[];if(motion)for(let i=0;i<30;i++)this.add({kind:'confetti',key:i%2?'vfx_confetti_gold':'vfx_confetti_coral',x:20+i*17,y:120-(i%4)*20,dx:(i%5-2)*20,dy:520,size:17,duration:1.8});break;
  }
 }
 update(dt){
  this.time+=dt;this.rewards.advance(dt);if(!this.game.profile.motion)this.rewards.reset();
  const ready=this.pending.filter(p=>p.at<=this.time);this.pending=this.pending.filter(p=>p.at>this.time);ready.forEach(p=>p.run());
  const expired=this.items.filter(p=>this.time>=p.start+p.duration);
  this.items=this.items.filter(p=>this.time<p.start+p.duration);
  for(const p of expired)if(p.kind==='flight'&&p.destination){this.arrivals[p.destination]=this.time;this.sparkle(0,0,p.coin?18:24,0,p.destination);}
  this.badges=this.badges.filter(p=>this.time<p.start+p.duration);
  if(this.super&&this.time>=this.super.start+this.super.duration)this.super=null;
 }
 get fever(){return this.game.round?.feverLeft>0&&!this.rewards.pending('feverStart');}
 value(key){return this.rewards.value(key,this.game.round?.[key]||0);}
 get feverCharge(){return this.rewards.value('fever',this.game.round.fever+(this.game.round.feverLeft>0?30:0))/30;}
 displayBody(b){
  const s=this.super;if(!s||!s.targetIDs.has(b.id))return b;
  const before=s.targets.find(a=>a.id===b.id),at=this.game.profile.motion?s.plan.arrival(before):.12;
  return this.time-s.start<at+.4?null:b;
 }
 draw(ctx,{afterShade=false,targetsOnly=false}={}){
  const a=this.art,motion=this.game.profile.motion;
  for(const p of this.items){const t=(this.time-p.start)/p.duration;if(t<0||t>1)continue;
   if(targetsOnly){if(p.kind!=='ghost'||!p.power)continue;}
   else {if(p.kind==='ghost'&&p.power)continue;const front=p.kind!=='ghost';if(front!==afterShade)continue;}
   if(p.kind==='ghost'){
    const b=p.body,age=this.time-p.start,key=b.type==='bubble'?'bubble_'+b.kind:'char_'+b.type,diameter=b.type==='bubble'?64.8:52;
    const pose=motion?popPose(age,p.impact):{x:1,y:1,alpha:1-t};
    ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.angle);ctx.scale(pose.x,pose.y);ctx.globalAlpha*=pose.alpha;
    a.draw(ctx,key,0,0,diameter,diameter,{bodyDiameter:b.type==='bubble'?undefined:diameter});
    if(age<p.impact||!motion){const reveal=p.power?clamp((age-SUPER.reveal)/.22):1;ctx.globalAlpha*=reveal;a.silhouette(ctx,key,0,0,diameter,0,'white',3);
     ctx.rotate(-b.angle);a.draw(ctx,'fx_coin0',0,0,p.power?30:24,p.power?30:24,{scaleX:p.power?.91+.09*Math.cos(age*5):1,rainbow:false});}
    ctx.restore();continue;
   }
   if(p.kind==='flight'){
    if(!motion){a.draw(ctx,p.key,p.x,p.y,p.size,p.size,{alpha:1-t,bodyDiameter:p.character?p.size:undefined});continue;}
    const dest=p.destination?this.target(p.destination):{x:p.tx,y:p.ty};let x,y,size=p.size;
    const hop=p.character?.11:p.coin?.23:.15,u=clamp((t*p.duration-hop)/(p.duration-hop));
    const hx=p.x+(p.character?(p.x<270?-20:20):p.scatterX),hy=p.y-(p.character?28:p.scatterY);
    if(t*p.duration<hop){const v=ease(t*p.duration/hop);x=mix(p.x,hx,v);y=mix(p.y,hy,v);}
    else{const v=1-u;if(p.character){const c1x=hx+(p.x<270?-65:65),c1y=hy-30,c2x=dest.x+65,c2y=dest.y-100;x=v*v*v*hx+3*v*v*u*c1x+3*v*u*u*c2x+u*u*u*dest.x;y=v*v*v*hy+3*v*v*u*c1y+3*v*u*u*c2y+u*u*u*dest.y;}
     else{x=v*v*hx+2*v*u*(hx+p.bend)+u*u*dest.x;y=v*v*hy+2*v*u*(hy-160)+u*u*dest.y;}}
    if(p.character)size*=t*p.duration<hop?mix(1,.48/.58,ease(t*p.duration/hop)):mix(.48/.58,.18/.58,u);
    const key=p.coin?'fx_coin'+[0,1,2,3,0,3,2,1][Math.floor((this.time-p.start)/.065)%8]:p.key;
    a.draw(ctx,key,x,y,size,size,{bodyDiameter:p.character?size:undefined,alpha:Math.min(1,(1-t)*12),rainbow:p.coin?false:undefined});
   }else if(p.kind==='burst'){
    const age=t*p.duration,size=p.size*mix(1,1.35,clamp(age/.18));a.draw(ctx,'fx_pop'+Math.min(3,Math.floor(age/.045)),p.x,p.y,size,size,{alpha:age<.18?1:clamp((.25-age)/.07)});
   }else if(p.kind==='wave'){
    const size=p.size*(motion?.3+(1-(1-t)**3)*.9:1);a.draw(ctx,p.key,p.x,p.y,size,size,{alpha:(1-t)*.8});
   }else if(p.kind==='spark'){
    const target=p.destination?this.target(p.destination):p,size=p.size*(.55+Math.sin(t*Math.PI)*.7);a.draw(ctx,p.key,target.x,target.y-(motion?t*12:0),size,size,{alpha:Math.sin(t*Math.PI)});
   }else if(p.kind==='debris'||p.kind==='confetti'){
    const u=p.kind==='confetti'?t:t<.32?t/.32*.72:.72+(t-.32)/.68*.28,size=p.kind==='confetti'?p.size:p.size*mix(1,p.puff?1.25:.45,t);
    a.draw(ctx,p.key,p.x+p.dx*u,p.y+p.dy*u+(p.kind==='debris'?12*t:0),size,size,{alpha:t<.22?1:(1-t)/.78,angle:t*2});
   }
  }
  if(!afterShade)return;
  for(const b of this.badges){const t=(this.time-b.start)/b.duration;if(t<0)continue;const scale=motion?Math.min(1,.6+t*5):1,y=b.y-(motion?Math.max(0,t-.55)*45:0),alpha=Math.min(1,(1-t)*3);
   a.label(ctx,b.text,b.x,y,28,280,{alpha,scaleX:scale,scaleY:scale});if(b.detail)a.label(ctx,b.detail,b.x,y+26,23,240,{alpha});
  }
 }
 drawSuper(ctx){drawSuper(this,ctx);}
}
