import {Art} from './art.mjs';
import {Game,playable,distance} from './rules.mjs';
import {World} from './physics.mjs';
import {Effects} from './effects.mjs';
const TESTING=false;
const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d',{alpha:false}),controls=document.querySelector('#controls'),progress=document.querySelector('#progress'),loading=document.querySelector('#loading');
const announce=text=>{document.querySelector('#announcement').textContent=text;};
let art,game,world,fx,data,screen='menu',buttons=[],controlSignature='',activePointer=null,lastPointer=null,lastTime=0,saveClock=0,uiTime=0,focusedID=null,lastSecond=60,lastSkill=false,lastCombo=0,resultAt=0,screenBeforeSettings='menu';
const voices=[],music=new Audio('assets/audio/music/cozy_loop.wav');music.loop=true;music.volume=.16;music.preload='none';
function sound(name,rate=1){if(!game?.profile.sound)return;while(voices.length>=8)voices.shift().pause();const audio=new Audio('assets/audio/sfx/'+name+'.wav');audio.volume=.3;audio.playbackRate=rate;voices.push(audio);audio.play().catch(()=>{});}
function musicSync(){if(screen==='play'&&!game.paused&&game.profile.music)music.play().catch(()=>{});else music.pause();}
function label(text,x,y,size=26,width=490,options={}){art.label(ctx,text,x,y,size,width,options);}
function image(key,x,y,w,h=w,options={}){art.draw(ctx,key,x,y,w,h,options);}
function button(id,title,x,y,w,h,action,{disabled=false,color='blue',icon=null,size=25}={}){
 image('button_'+color+'_'+(w/h<1.6?'round':'wide'),x,y,w,h,{alpha:disabled?.45:1});
 if(icon)image('icon_'+icon,x,y,w*.48,h*.48,{alpha:disabled?.45:1});else label(title,x,y,size,w*.85,{alpha:disabled?.55:1});
 buttons.push({id,title,x,y,w,h,action,disabled});
}
function syncControls(){
 const signature=buttons.map(b=>[b.id,b.x,b.y,b.w,b.h].join(':')).join('|');
 if(signature!==controlSignature){controlSignature=signature;controls.replaceChildren();for(const b of buttons){const n=document.createElement('button');n.type='button';n.dataset.id=b.id;n.style.left=b.x/5.4+'%';n.style.top=b.y/9.6+'%';n.style.width=b.w/5.4+'%';n.style.height=b.h/9.6+'%';n.onclick=()=>{const current=buttons.find(c=>c.id===b.id);if(current&&!current.disabled){sound('tap');current.action();}};controls.append(n);}}
 for(const b of buttons){const n=controls.querySelector(`[data-id="${b.id}"]`);n.disabled=b.disabled;n.setAttribute('aria-label',b.title);n.title=b.title;}
}
function go(next){if(screen==='play'&&next!=='play')game.pause();screen=next;activePointer=null;lastPointer=null;game.chain=[];controlSignature='';musicSync();}
function start(){game.start();world.wake();fx.reset();lastSecond=60;lastSkill=false;lastCombo=0;screen='play';activePointer=null;focusedID=null;saveClock=0;musicSync();announce('Connect three matching plushies.');}
function resume(){game.resume();screen='play';activePointer=null;lastPointer=null;world.wake();musicSync();}
function pause(){if(screen==='play'){game.pause();screen='paused';activePointer=null;lastPointer=null;musicSync();announce('Paused.');}}
function showSettings(){screenBeforeSettings=screen;go('settings');}
function meter(key,value,x,y,w,h){image('meter_navy',x,y,w,h);ctx.save();ctx.beginPath();ctx.rect(x-w/2,y-h/2,w*Math.max(0,Math.min(1,value)),h);ctx.clip();image(key,x,y,w,h);ctx.restore();}
function portrait(type,x,y,size=52,options={}){image('char_'+type,x,y,size,size,{bodyDiameter:size,...options});}
function drawMenu(){
 label('PLUSH POP',270,155,58);label('A pocket full of plush friends',270,210,21);
 game.allowed.forEach((id,i)=>portrait(id,90+i*90,330-Math.sin(i*Math.PI/4)*33,80,{angle:Math.sin(uiTime*.65+i)*.1}));
 label('Drag matching friends to pop!',270,416,22);
 if(game.round&&!game.finished){button('resume','Resume round',270,500,320,78,resume,{color:'green'});button('new','New round',270,590,320,68,start);button('collection','Your plushies',270,680,320,68,()=>go('collection'),{color:'purple'});button('boosts','Boosts',270,770,320,68,()=>go('boosts'));button('settings','Settings',270,850,240,60,showSettings);}
 else{button('play','Play',270,520,320,88,start,{color:'green',size:32});button('collection','Your plushies',270,635,320,75,()=>go('collection'),{color:'purple'});button('boosts','Boosts',270,740,320,75,()=>go('boosts'));button('settings','Settings',270,840,240,65,showSettings);}
 label('Best '+game.profile.best,270,914,20);label('iPad: Share > Add to Home Screen',270,944,13,470);
}
function drawCollection(){
 label('YOUR PLUSHIES',270,120,38);label('Pick your leader',270,175,22);
 game.allowed.forEach((id,i)=>{const x=110+(i%3)*160,y=300+Math.floor(i/3)*210,selected=game.profile.hero===id;
  image(selected?'card_cream':'card_blue',x,y,146,180);portrait(id,x,y-25,85);label(data.characters.find(c=>c.id===id).name,x,y+45,18,130);
  button('hero-'+id,selected?'Selected':'Choose',x,y+81,130,48,()=>{game.selectHero(id);announce('Selected '+id);},{color:selected?'gold':'green',size:17});
 });
 const power=game.powers[game.profile.hero];label(power.name,270,675,27,450);
 label(power.steps.map(s=>s.kind==='clear'?'Pops a '+s.pattern+' area':s.kind==='transform'?'Changes plushies into your leader':s.kind==='bubbles'?'Makes special bubbles':s.pattern==='time'?'Adds time':'Gives a '+s.pattern+' bonus').join(' / '),270,719,19,470);
 label('More characters are locked in this preview.',270,780,18,470);
 button('back','Back',270,865,280,76,()=>go('menu'),{color:'purple'});
}
function drawBoosts(){
 label('BOOSTS',270,135,44);image('icon_coin',210,200,36);label(game.profile.coins,290,200,28);
 const offers=[['time','5 extra seconds',40],['score','15% more points',60],['skill','Start with a full skill',80]];
 offers.forEach(([id,title,cost],i)=>{const y=330+i*175;image('panel_blue',270,y,460,150);label(title,270,y-38,24,420);label('Ready: '+(game.profile.boosts[id]||0),150,y+15,18,170);button('buy-'+id,cost+' coins',355,y+22,220,62,()=>{if(game.buyBoost(id)){sound('purchase');announce('Boost ready for your next new round.');}},{disabled:game.profile.coins<cost,color:'gold',size:21});});
 label('Boosts are used on your next new round.',270,792,18,460);button('back','Back',270,870,280,76,()=>go('menu'),{color:'purple'});
}
function drawSettings(){
 label('SETTINGS',270,170,43);
 [['sound','Sound effects'],['music','Music'],['motion','Animations']].forEach(([key,title],i)=>button(key,title+': '+(game.profile[key]?'On':'Off'),270,340+i*125,380,85,()=>{game.profile[key]=!game.profile[key];game.save();musicSync();},{color:game.profile[key]?'green':'purple',size:27}));
 label('Turning animations off reduces motion.',270,722,18,460);button('back','Back',270,835,280,78,()=>go(screenBeforeSettings),{color:'purple'});
}
function drawPause(){
 label('PAUSED',270,270,48);button('resume','Resume',270,410,320,85,resume,{color:'green',size:30});
 button('settings','Settings',270,535,320,75,showSettings,{color:'purple'});button('home','Home',270,660,320,75,()=>go('menu'));label('Your round is saved.',270,785,20);
}
function drawResults(){const r=game.round;
 label('TIME UP!',270,116,46);image('panel_blue',270,468,480,517);image('icon_trophy',270,240,146);
 label(game.newBest?'NEW BEST!':'NICE PLAY!',270,329,29);const t=game.profile.motion?Math.min(1,(fx.time-resultAt)/.85):1;label(Math.round(r.score*t),270,406,61);label('POINTS',270,463,18);
 label('+'+r.coins+' coins',270,523,28);label('Best chain '+r.bestChain,270,591,24);label('Plushies popped '+r.popped,270,638,24);
 button('again','Play again',270,799,322,82,start,{color:'green'});button('home','Home',270,889,198,61,()=>go('menu'),{color:'purple'});
}
function drawBodies(){
 const r=game.round,selected=new Set(game.chain),last=r.bodies.find(b=>b.id===game.chain.at(-1));
 ctx.save();ctx.beginPath();ctx.rect(0,174,540,642);ctx.clip();
 for(const actual of r.bodies){const b=fx.displayBody(actual);if(b.y<130||b.y>840)continue;const bubble=b.type==='bubble',key=bubble?'bubble_'+b.kind:'char_'+b.type;
  const matching=last&&!selected.has(b.id)&&game.matches(last,b)&&playable(b),s=game.profile.motion?(actual.squash||0):0,stretch=game.profile.motion?Math.min(.055,Math.max(0,actual.vy)/14000):0;
  const lean=game.profile.motion&&r.feverLeft>0?Math.sin(uiTime*2.3+b.id*.7)*.1:0;
  image(key,b.x,b.y,bubble?64.8:52,bubble?64.8:52,{bodyDiameter:bubble?undefined:52,angle:b.angle+lean,gray:matching,scaleX:1+s-stretch,scaleY:1-s+stretch});
  if(selected.has(b.id)||game.hints.includes(b.id)||focusedID===b.id)art.silhouette(ctx,key,b.x,b.y,bubble?64.8:52,b.angle,selected.has(b.id)?'#7ffbff':focusedID===b.id?'#ffe598':'#b1ffcb',selected.has(b.id)?2:3);
 }
 const chain=game.chain.map(id=>r.bodies.find(b=>b.id===id)).filter(Boolean);
 if(chain.length){ctx.beginPath();ctx.moveTo(chain[0].x,chain[0].y);for(const b of chain.slice(1))ctx.lineTo(b.x,b.y);ctx.lineWidth=5;ctx.strokeStyle='#1ed8ec';ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();ctx.lineWidth=2;ctx.strokeStyle='#e9ffff';ctx.stroke();
  for(const b of chain){ctx.beginPath();ctx.arc(b.x,b.y,8.5,0,Math.PI*2);ctx.fillStyle='white';ctx.fill();ctx.strokeStyle='#22cced';ctx.lineWidth=2.5;ctx.stroke();}
  if(chain.length>1){const b=chain.at(-1);label(chain.length,Math.min(490,Math.max(50,b.x)),b.y-34,28,85);}
 }
 ctx.restore();
}
function drawHUD(){const r=game.round;
 label('TIME',64,15,12);image('timer_face',64,65,80);label(Math.max(0,Math.ceil(r.timer)),64,65,34);
 ctx.save();const fraction=Math.min(1,r.timer/60);ctx.beginPath();ctx.moveTo(64,65);ctx.arc(64,65,47,-Math.PI/2,-Math.PI/2+Math.PI*2*fraction);ctx.closePath();ctx.clip();image('fx_wave_gold',64,65,88);ctx.restore();
 image('score_pill',270,49,310,64);label(r.score,270,49,33,270);image('coin_pill',270,95,190,38);image('icon_coin',230,95,30);label(r.coins,280,95,22,110);
 button('pause','Pause',478,64,76,76,pause,{color:'gold',icon:'pause'});
 if(r.combo>1&&game.comboActive())label(r.combo+' COMBO',350,139,17,145);
 button('hint','Hint',480,147,80,51,()=>game.hint(),{disabled:!game.canAct,size:18});
 if(r.power&&!r.power.pending){const seconds=Math.ceil(Math.max(...Object.values(r.power.timers)));label(game.powers[r.hero].name+' '+seconds+'s',250,166,15,320);}
 if(r.feverLeft>0){label('FEVER BONUS',270,207,15);label(r.feverScore,270,233,27,280);}
 if(r.skill>=12&&game.profile.motion)image('fx_rays',72,885,108,108,{alpha:.45+Math.sin(uiTime*3)*.2});
 image('skill_frame',72,885,84,84);portrait(r.hero,72,884,60);meter('meter_gold',r.skill/12,72,932,82,12);
 if(r.skill>=12)label('READY',72,918,14);
 buttons.push({id:'skill',title:'Use '+game.powers[r.hero].name,x:72,y:885,w:94,h:94,action:()=>game.useSkill(),disabled:!game.canAct||r.skill<12});
 meter('meter_gold',r.feverLeft>0?r.feverLeft/8:r.fever/30,270,887,250,43);label(r.feverLeft>0?'FEVER x3':'FEVER',270,887,22,230);
 button('shuffle','Shuffle',477,887,76,76,()=>game.shuffle(),{icon:'shuffle',color:'gold',disabled:!game.canAct||r.shuffleCooldown>0});
 if(r.shuffleCooldown>0)label(Math.ceil(r.shuffleCooldown),477,887,23);
 if(r.power&&!r.power.pending){const keys=Object.keys(r.power.timers).filter(k=>r.power.timers[k]>0);keys.slice(0,4).forEach((k,i)=>image('icon_'+(({stop:'clock',slow:'clock',coins:'coin',score:'trophy',link:'star',reach:'shuffle'})[k]||'star'),215+i*38,828,27));}
 if(r.ready>0){label('READY',270,342,46);label('Connect '+game.minimumChain+' matching plushies',270,389,17);}
 else if(r.elapsed<.65&&!r.popped&&game.superLeft<=0)label('GO!',270,366,58);
}
function drawFeverLights(){if(game.round.feverLeft<=0)return;const sides=[data.bowl.top,data.bowl.left,data.bowl.right,data.bowl.floor];let n=0;for(const line of sides)for(let i=0;i<line.length;i+=Math.max(1,Math.floor(line.length/10))){const [x,y]=line[i];image('vfx_sparkle',x,y,13,13,{alpha:game.profile.motion?.45+Math.sin(uiTime*2-n++*.45)*.2:.65});}}
function draw(){buttons=[];ctx.setTransform(canvas.width/540,0,0,canvas.height/960,0,0);ctx.clearRect(0,0,540,960);
 const gameplay=screen==='play'||screen==='paused';art.stage(ctx,gameplay&&game.round?.feverLeft>0,uiTime,game.profile.motion);
 if(gameplay){drawBodies();if(screen==='play'){drawFeverLights();drawHUD();fx.draw(ctx);
   if(fx.super){const t=fx.time-fx.super.start,fade=Math.min(1,t/.3,(fx.super.duration-t)/.15);ctx.fillStyle='rgba(0,0,0,'+Math.max(0,.32*fade)+')';ctx.fillRect(0,0,540,960);fx.drawSuper(ctx);}
   fx.draw(ctx,{afterShade:true});
   if(fx.super){image('button_gold_round',478,64,76);image('icon_pause',478,64,37);}
  }else{ctx.fillStyle='#082e34aa';ctx.fillRect(0,0,540,960);drawPause();}}
 else if(screen==='menu')drawMenu();else if(screen==='collection')drawCollection();else if(screen==='boosts')drawBoosts();else if(screen==='settings')drawSettings();else if(screen==='results'){drawResults();fx.draw(ctx,{afterShade:true});}
 if(game.savingFailed)label('Progress cannot be saved in this browser.',270,952,12,490);
 syncControls();
}
function drain(){for(const e of game.feedback.splice(0)){fx.event(e);
 if(['pop','shuffle','bubbleBorn','super'].includes(e.kind))world.wake();
 if(e.kind==='sound')sound(e.name);else if(e.kind==='select')sound('select',Math.min(1.45,1+e.count*.025));else if(e.kind==='pop')sound(e.bubble?'bubble':e.power?'skill':'pop');else if(e.kind==='shuffle')sound('shuffle');else if(e.kind==='fever')sound('fever_start');else if(e.kind==='feverEnd')sound('fever_end');
 else if(e.kind==='announcement'){announce(e.text);if(e.text==='TIME UP')sound('time_up');}
 else if(e.kind==='results'){screen='results';resultAt=fx.time;sound('result');musicSync();announce('Time up. '+game.round.score+' points.');}
}}
function frame(now){const dt=lastTime?Math.min(.05,(now-lastTime)/1000):0;lastTime=now;
 if(screen==='play'&&!game.paused){uiTime+=dt;game.tick(dt);if(!game.paused&&!game.superLeft&&!game.has('stop')&&!game.round.finale)world.advance(game.round.bodies,dt*(game.has('slow')?.55:1),game.profile.motion,game.round.feverLeft>0);fx.update(dt);drain();
  const r=game.round,second=Math.ceil(r.timer);if(second!==lastSecond&&second>0&&second<=5&&!r.finale){fx.badge(String(second),'',160,280,.5);sound('time_warning');}lastSecond=second;
  if(r.skill>=12&&!lastSkill&&!r.finale){fx.sparkle(72,885,50);announce('Skill ready.');}lastSkill=r.skill>=12;
  if(r.combo>=10&&Math.floor(r.combo/10)>Math.floor(lastCombo/10))fx.badge(r.combo+' COMBO!','',350,280,.8);lastCombo=r.combo;
  saveClock+=dt;if(saveClock>3){game.save();saveClock=0;}
 }else if(screen==='results'){fx.update(dt);uiTime+=dt;}else if(screen!=='paused')uiTime+=dt;
 draw();requestAnimationFrame(frame);
}
function point(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*540/r.width,y:(e.clientY-r.top)*960/r.height};}
function hit(p){if(!game.round)return null;let best=null,d=Infinity;for(const b of game.round.bodies){if(!playable(b))continue;const z=distance(b,p);if(z<(b.type==='bubble'?29:26.5)&&z<d){best=b;d=z;}}return best;}
function touchPoint(p,first=false){const b=hit(p);if(!b)return;if(first&&b.type==='bubble'){game.activate(b.id);return;}if(first&&game.powerTap(b.id))return;game.extend(b.id);}
function move(p){if(!lastPointer){lastPointer=p;touchPoint(p);return;}const count=Math.max(1,Math.ceil(distance(lastPointer,p)/9)),from=lastPointer;for(let i=1;i<=count;i++)touchPoint({x:from.x+(p.x-from.x)*i/count,y:from.y+(p.y-from.y)*i/count});lastPointer=p;}
canvas.addEventListener('pointerdown',e=>{if(e.button!==0||activePointer!==null||screen!=='play'||!game.canAct)return;e.preventDefault();canvas.focus({preventScroll:true});activePointer=e.pointerId;lastPointer=point(e);canvas.setPointerCapture(e.pointerId);touchPoint(lastPointer,true);drain();});
canvas.addEventListener('pointermove',e=>{if(e.pointerId!==activePointer)return;e.preventDefault();const coalesced=e.getCoalescedEvents?.();for(const event of coalesced?.length?coalesced:[e])move(point(event));drain();});
canvas.addEventListener('pointerup',e=>{if(e.pointerId!==activePointer)return;e.preventDefault();move(point(e));game.release();activePointer=null;lastPointer=null;drain();});
function cancelPointer(e){if(!e||e.pointerId===activePointer){game.chain=[];activePointer=null;lastPointer=null;}}
canvas.addEventListener('pointercancel',cancelPointer);canvas.addEventListener('lostpointercapture',cancelPointer);canvas.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('keydown',e=>{
 if(!game)return;if(e.key==='Escape'){e.preventDefault();if(game.chain.length)game.chain=[];else if(screen==='play')pause();else if(screen==='paused')resume();else go('menu');return;}
 if(screen!=='play'||!game.canAct||e.target.tagName==='BUTTON'&&[' ','Enter'].includes(e.key))return;
 const all=game.round.bodies.filter(playable);if(!all.length)return;let focus=all.find(b=>b.id===focusedID)||all.reduce((a,b)=>b.y>a.y?b:a);focusedID=focus.id;
 if(e.key.startsWith('Arrow')){e.preventDefault();const [dx,dy]=({ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]})[e.key];const next=all.filter(b=>(b.x-focus.x)*dx+(b.y-focus.y)*dy>5).sort((a,b)=>distance(a,focus)+Math.abs((a.x-focus.x)*dy-(a.y-focus.y)*dx)*2-distance(b,focus)-Math.abs((b.x-focus.x)*dy-(b.y-focus.y)*dx)*2)[0];if(next)focusedID=next.id;}
 else if(e.key===' '){e.preventDefault();if(focus.type==='bubble')game.activate(focus.id);else game.extend(focus.id);}else if(e.key==='Enter'){e.preventDefault();game.release();}else if(e.key==='Backspace'){e.preventDefault();game.chain.pop();}else if(e.key.toLowerCase()==='h')game.hint();else if(e.key.toLowerCase()==='s')game.shuffle();else if(e.key.toLowerCase()==='b')game.useSkill();drain();
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});window.addEventListener('pagehide',()=>{if(game){game.pause();game.save();music.pause();}});window.addEventListener('blur',()=>pause());
function resize(){const rect=canvas.getBoundingClientRect(),density=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.max(540,Math.round(rect.width*density));canvas.height=Math.round(canvas.width*16/9);}
window.addEventListener('resize',resize);
async function boot(){
 const fetchJSON=async path=>{const r=await fetch('assets/'+path);if(!r.ok)throw Error('Could not load the game.');return r.json();};
 const [loaded,characters,catalog,powers,bowl]=await Promise.all([Art.load('.',(fraction)=>{progress.textContent='Loading artwork '+Math.round(fraction*100)+'%';}),fetchJSON('characters.json'),fetchJSON('catalog.json'),fetchJSON('native-powers/catalog.json'),fetchJSON('native-stage/geometry.json')]);
 art=loaded;data={characters,catalog,powers,bowl};let storage;try{storage=localStorage;}catch{}game=new Game(data,storage);if(!localStorageSafe()&&!game.round)game.profile.motion=!matchMedia('(prefers-reduced-motion: reduce)').matches;
 const uiKeys=Object.keys(art.images).filter(k=>!k.startsWith('char_')&&!k.startsWith('skin_')&&!k.startsWith('power_'));
 await art.preload([...uiKeys,...game.allowed.flatMap(id=>['char_'+id,'power_'+id+'_0','power_'+id+'_1','power_'+id+'_2','power_'+id+'_3']),...['blast','time','coin','score'].map(k=>'bubble_'+k)]);
 if(art.failed.size)throw Error('Some artwork did not load. Check your connection and try again.');
 world=new World(bowl);fx=new Effects(art,game);loading.hidden=true;resize();requestAnimationFrame(frame);
 if(TESTING)window.__plushQA={game,world,fx,art,data,start,resume,pause,go,get screen(){return screen;},get buttons(){return buttons.map(({action,...b})=>b);}};
 if('serviceWorker'in navigator&&!TESTING)navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{});
}
function localStorageSafe(){try{return !!localStorage.getItem('plush_pop_share_v1');}catch{return false;}}
boot().catch(error=>{progress.textContent=error.message||'The game could not load. Please try again.';const retry=document.createElement('button');retry.textContent='Try again';retry.onclick=()=>location.reload();loading.append(retry);});
