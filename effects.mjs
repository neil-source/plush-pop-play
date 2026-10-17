const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>1-(1-x)**3;
const mix=(a,b,t)=>a+(b-a)*t;
export const rating=n=>n>=20?'FANTASTIC!':n>=12?'EXCELLENT!':n>=7?'VERY GOOD!':n>=4?'GOOD!':'POP!';
export class Effects{
 constructor(art,game){this.art=art;this.game=game;this.reset();}
 reset(){this.time=0;this.items=[];this.badges=[];this.super=null;this.counts={};}
 count(k){this.counts[k]=(this.counts[k]||0)+1;}
 add(p){this.items.push({start:this.time,duration:.5,...p});if(this.items.length>400)this.items.splice(0,this.items.length-400);}
 badge(text,detail='',x=270,y=330,duration=.9,delay=0){
  x=Math.max(160,Math.min(380,x));y=Math.max(280,Math.min(710,y));
  this.badges=this.badges.filter(b=>this.time<b.start+b.duration);while(this.badges.length>=3)this.badges.shift();
  const options=[y,y-90,y+90,y-180,y+180,290,480,670].filter(a=>a>=275&&a<=725);
  y=options.find(a=>this.badges.every(b=>Math.abs(b.y-a)>78||Math.abs(b.x-x)>260))??y;
  this.badges.push({text,detail,x,y,start:this.time+delay,duration});
 }
 wave(x,y,tone='mint',size=150,delay=0){this.add({kind:'wave',key:'fx_wave_'+tone,x,y,size,start:this.time+delay,duration:this.game.profile.motion?.35:.15});}
 sparkle(x,y,size=24,delay=0){this.add({kind:'spark',key:'fx_stars',x,y,size,start:this.time+delay,duration:.38});}
 flight(key,x,y,tx,ty,{delay=0,size=25,character=false,coin=false}={}){
  this.add({kind:'flight',key,x,y,tx,ty,size,character,coin,start:this.time+delay,duration:this.game.profile.motion?.82:.16,bend:(Math.random()-.5)*150});
 }
 impact(b){return this.super?3.65+Math.min(.55,Math.hypot(b.x-270,b.y-490)/600):.09;}
 event(e){const g=this.game,r=g.round,motion=g.profile.motion;this.count(e.kind);
  switch(e.kind){
   case'select':this.badges=this.badges.filter(b=>!b.text.startsWith('CONNECT'));this.sparkle(e.body.x,e.body.y,18);if(e.count===g.minimumChain)this.wave(e.body.x,e.body.y,'mint',70);break;
   case'rejected':if(e.body)this.badge('CONNECT '+g.minimumChain,'',e.body.x,e.body.y-30,.45);break;
   case'message':this.badge(e.text);break;
   case'fever':this.badge('FEVER!','TRIPLE POINTS',270,280,1.1);this.wave(270,490,'gold',400);break;
   case'feverEnd':if(e.score)this.badge('FEVER BONUS',String(e.score),270,280,1);break;
   case'announcement':this.badge(e.text,'',270,350,1.1);break;
   case'bubbleBorn':this.wave(e.body.x,e.body.y,'mint',85);break;
   case'bubble':{const b=e.body;this.wave(b.x,b.y,({time:'mint',coin:'gold',score:'lavender',blast:'coral'})[b.kind],234);if(motion)for(let i=0;i<8;i++)this.sparkle(b.x+Math.cos(i*Math.PI/4)*70,b.y+Math.sin(i*Math.PI/4)*70);break;}
   case'bonus':{
    const target=e.type==='time'?[64,65]:e.type==='coin'?[230,95]:[270,49];
    this.badge('+'+e.amount+' '+({time:'SEC',coin:'COINS',score:'POINTS'})[e.type],'',e.x,e.y);
    this.flight(e.type==='time'?'icon_clock':e.type==='coin'?'fx_coin0':'icon_trophy',e.x,e.y,...target,{size:32});break;
   }
   case'pop':{
    const count=e.bodies.filter(b=>b.type!=='bubble').length;
    let lastDelay=0;
    e.bodies.forEach((b,i)=>{const delay=motion?(e.power?this.impact(b):.09+Math.min(.07,i*.008)):0;lastDelay=Math.max(lastDelay,delay);
     this.add({kind:'ghost',body:b,start:this.time,duration:delay+.08,impact:delay,power:e.power});
     this.add({kind:'burst',key:'fx_pop0',x:b.x,y:b.y,size:90,start:this.time+delay,duration:motion?.25:.12});
     if(motion)for(let j=0;j<3;j++){const a=j*Math.PI*2/3+Math.random();this.add({kind:'debris',key:j?'fx_stars':'vfx_puff',x:b.x,y:b.y,dx:Math.cos(a)*60,dy:Math.sin(a)*60,size:j?16:25,start:this.time+delay,duration:.32});}
     if(b.type!=='bubble'){
      const leader=b.type===r.hero;this.flight('char_'+b.type,b.x,b.y,leader?72:270,leader?885:887,{delay:delay+.03,size:24,character:true});
      this.flight('fx_coin0',b.x,b.y,230,95,{delay:delay+.04,coin:true});
     }
    });
    for(let i=0;i<Math.min(20,Math.max(0,e.coins-count));i++){const b=e.bodies[i%e.bodies.length];this.flight('fx_coin0',b.x,b.y,230,95,{delay:lastDelay,coin:true});}
    if(count){const b=e.bodies.at(-1);this.badge(e.power?'SUPER!':rating(count),'+'+e.score,b.x,b.y-30,.9,lastDelay);}
    break;
   }
   case'super':this.super={...e,start:this.time,duration:motion?5:.3};this.wave(270,425,'lavender',320);break;
   case'shuffle':if(motion)for(const sign of [-1,1])this.add({kind:'debris',key:'fx_swoosh',x:270+sign*90,y:560,dx:sign*55,dy:-90,size:160,duration:.4});break;
   case'results':this.super=null;this.badges=[];if(e.record)this.badge('NEW BEST!','',270,280,1.2);if(motion)for(let i=0;i<30;i++)this.add({kind:'debris',key:i%2?'vfx_confetti_gold':'vfx_confetti_coral',x:20+i*17,y:120-(i%4)*20,dx:(i%5-2)*20,dy:520,size:17,duration:1.8});break;
  }
 }
 update(dt){this.time+=dt;this.items=this.items.filter(p=>this.time<p.start+p.duration);this.badges=this.badges.filter(p=>this.time<p.start+p.duration);if(this.super&&this.time>=this.super.start+this.super.duration)this.super=null;}
 displayBody(b){if(!this.super)return b;const old=this.super.targets.find(a=>a.id===b.id);return old&&this.time-this.super.start<this.impact(old)?old:b;}
 draw(ctx,{afterShade=false}={}){
  const a=this.art,motion=this.game.profile.motion;
  for(const p of this.items){let t=(this.time-p.start)/p.duration;if(t<0||t>1)continue;
   if((p.kind==='ghost')!==!afterShade)continue;
   if(p.kind==='ghost'){
    const b=p.body,age=this.time-p.start;if(p.power&&this.super&&afterShade)continue;
    if(age>p.impact)continue;
    const key=b.type==='bubble'?'bubble_'+b.kind:'char_'+b.type,diameter=b.type==='bubble'?64.8:52;
    a.draw(ctx,key,b.x,b.y,diameter,diameter,{bodyDiameter:b.type==='bubble'?undefined:diameter,angle:b.angle});
    a.silhouette(ctx,key,b.x,b.y,diameter,b.angle,'white',3);a.draw(ctx,'fx_coin0',b.x,b.y,18,18);continue;
   }
   ctx.save();
   if(p.kind==='flight'){
    if(!motion){a.draw(ctx,p.key,p.x,p.y,p.size,p.size,{alpha:1-t,bodyDiameter:p.character?p.size:undefined});ctx.restore();continue;}
    const u=ease(t),cx=(p.x+p.tx)/2+p.bend,cy=Math.min(p.y,p.ty)-90;
    const x=(1-u)**2*p.x+2*(1-u)*u*cx+u*u*p.tx,y=(1-u)**2*p.y+2*(1-u)*u*cy+u*u*p.ty;
    const size=p.size*(1-.4*t),key=p.coin?'fx_coin'+[0,1,2,3,0,3,2,1][Math.floor(t*16)%8]:p.key;
    a.draw(ctx,key,x,y,size,size,{bodyDiameter:p.character?size:undefined,angle:p.character?Math.sin(t*5)*.2:0,alpha:Math.min(1,(1-t)*8)});
   }else if(p.kind==='burst'){
    a.draw(ctx,'fx_pop'+Math.min(3,Math.floor(t*4)),p.x,p.y,p.size*(.7+t*.6),p.size*(.7+t*.6),{alpha:1-t*.7});
   }else if(p.kind==='wave'){
    const size=p.size*(motion?.3+ease(t):1);a.draw(ctx,p.key,p.x,p.y,size,size,{alpha:(1-t)*.75});
   }else if(p.kind==='spark'){
    a.draw(ctx,p.key,p.x,p.y-(motion?t*14:0),p.size*(.6+Math.sin(t*Math.PI)),p.size*(.6+Math.sin(t*Math.PI)),{alpha:Math.sin(t*Math.PI)});
   }else if(p.kind==='debris'){
    a.draw(ctx,p.key,p.x+p.dx*t,p.y+p.dy*t,p.size,p.size,{alpha:1-t,angle:t*2});
   }
   ctx.restore();
  }
  if(!afterShade)return;
  for(const b of this.badges){const t=(this.time-b.start)/b.duration;if(t<0)continue;const scale=motion?Math.min(1,.65+t*4):1,y=b.y-(motion?Math.max(0,t-.55)*45:0),alpha=Math.min(1,(1-t)*3);
   a.label(ctx,b.text,b.x,y,28,280,{alpha,scaleX:scale,scaleY:scale});if(b.detail)a.label(ctx,b.detail,b.x,y+26,23,240,{alpha});
  }
 }
 drawSuper(ctx){const s=this.super;if(!s)return;const a=this.art,t=this.time-s.start,motion=this.game.profile.motion;
  if(!motion)return;
  const targets=s.targets,cleared=new Set(s.clearIDs);
  for(const b of targets){const impact=this.impact(b);if(t>=impact)continue;const key='char_'+b.type;
   a.draw(ctx,key,b.x,b.y,52,52,{bodyDiameter:52,angle:b.angle});a.silhouette(ctx,key,b.x,b.y,52,b.angle,'white',3);
   if(cleared.has(b.id))a.draw(ctx,'fx_coin0',b.x,b.y,20,20);
  }
  // A close reveal, a curved flight away, then a dive into the clearing region.
  let x=270,y=405,size=160,angle=0;
  if(t<.8){size=50+ease(t/.8)*110;y=480-ease(t/.8)*75;}
  else if(t<2.3){const u=(t-.8)/1.5;x=270+Math.sin(u*Math.PI)*150;y=405-u*130;size=160-u*105;angle=Math.sin(u*Math.PI)*.35;}
  else if(t<3.65){const u=(t-2.3)/1.35;x=270-100*Math.sin(u*Math.PI);y=275+u*235;size=55+u*35;angle=-Math.sin(u*Math.PI)*.4;}
  else{const u=(t-3.65)/1.35;x=270+u*65;y=510-u*200;size=90*(1-u);}
  if(t<1.4)a.draw(ctx,'fx_rays',270,405,320,320,{alpha:.32*(1-t/1.4),angle:t*.3});
  if(size>0)a.draw(ctx,'char_'+s.hero,x,y,size,size,{bodyDiameter:size,angle});
  if(t<2)a.label(ctx,s.spec.name,270,235,28,390,{alpha:Math.min(1,(2-t)*2)});
  for(const b of targets){const hit=this.impact(b);if(t<2.65||t>hit+.12)continue;const u=clamp((t-2.65)/(hit-2.65));
   const px=mix(270,b.x,u),py=mix(490,b.y,u)-Math.sin(u*Math.PI)*55,size=35+u*15;
   a.draw(ctx,'power_'+s.hero+'_'+Math.min(3,Math.floor(u*4)),px,py,size,size,{angle:Math.atan2(b.y-490,b.x-270),alpha:Math.min(1,(hit+.12-t)*7)});
  }
 }
}
