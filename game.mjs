import {Art} from './art.mjs';
import {Game,playable,distance} from './rules.mjs';
import {World} from './physics.mjs';
import {Effects} from './effects.mjs';
import {Idle} from './idle.mjs';
import {chooseLayout,boardPoint,rewardTarget,inputHint} from './layout.mjs';
import {drawPolish} from './polish-ui.mjs';
import {drawDesktop} from './desktop.mjs';
const TESTING=false;
const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d',{alpha:false}),controls=document.querySelector('#controls'),progress=document.querySelector('#progress'),loading=document.querySelector('#loading');
const announce=text=>{document.querySelector('#announcement').textContent=text;};
let art,game,world,fx,idle,data,screen='menu',buttons=[],controlSignature='',activePointer=null,lastPointer=null,lastTime=0,saveClock=0,uiTime=0,focusedID=null,lastSecond=60,lastSkill=false,lastCombo=0,resultAt=0,screenBeforeSettings='menu';
const finePointer=matchMedia('(pointer: fine)'),hoverPointer=matchMedia('(hover: hover)');
const getLayout=()=>chooseLayout({width:game?.profile.layout==='classic'?540:innerWidth,height:innerHeight,fine:finePointer.matches,hover:hoverPointer.matches});
let layout=getLayout(),inputMode=layout.input,collectionPage=0;
const characterKeys=id=>['char_'+id,...[0,1,2,3].map(i=>'idle_'+id+'_'+i)];
const roundKeys=()=>[...game.round.active.flatMap(characterKeys),...[0,1,2,3].map(i=>'power_'+game.round.hero+'_'+i)];
const menuKeys=()=>[game.profile.hero,...['sunny','mint','luna','ember','stitch'].filter(id=>id!==game.profile.hero&&game.allowed.includes(id)).slice(0,2)].map(id=>'char_'+id);
const pageKeys=()=>game.allowed.slice(collectionPage*layout.pageSize,(collectionPage+1)*layout.pageSize).map(id=>'char_'+id);
const powerText=s=>s.kind==='clear'?'Pops '+(s.pattern==='hero'?'your leader':'a '+s.pattern.replace(/[A-Z]/g,c=>' '+c.toLowerCase())+' area'):s.kind==='transform'?'Changes plushies into your leader':s.kind==='bubbles'?'Makes special bubbles':({time:'Adds time',stop:'Pauses time',slow:'Slows the fall',link:'Connects any type',reach:'Reaches farther',chain:'Connects pairs',blast:'Pops nearby friends',coins:'Extra coins',score:'Extra points',drops:'More leader drops',tap:'Tap to pop'})[s.pattern]||'Gives a bonus';
const chooseHero=id=>withArtwork([...characterKeys(id),...[0,1,2,3].map(i=>'power_'+id+'_'+i)],()=>{game.selectHero(id);announce('Selected '+data.characters.find(c=>c.id===id).name);});
const turnPage=step=>{collectionPage+=step;return go('collection');};
function card(id,name,x,y,w,h,selected,action){buttons.push({id:'hero-'+id,title:(selected?'Selected ':'Choose ')+name,x,y,w,h,disabled:false,action});}
async function loadArt(keys){await art.preload(keys);if(keys.some(k=>!art.get(k)))throw Error('Connect to download these plushies, then try again.');}
async function withArtwork(keys,action){
 loading.querySelectorAll('button').forEach(b=>b.remove());loading.hidden=false;controls.inert=true;
 try{await loadArt(keys);action();loading.hidden=true;controls.inert=false;}
 catch(error){progress.textContent=error.message;for(const [title,fn]of [['Try again',()=>withArtwork(keys,action)],['Back',()=>{loading.hidden=true;controls.inert=false;screen='menu';}]]){const b=document.createElement('button');b.textContent=title;b.onclick=fn;loading.append(b);}}
}
const voices=[];let musicKey='cozy_loop',music=new Audio('assets/audio/music/cozy_loop.wav');music.loop=true;music.volume=.16;music.preload='none';
function sound(name,rate=1){if(!game?.profile.sound)return;while(voices.length>=8)voices.shift().pause();const audio=new Audio('assets/audio/sfx/'+name+'.wav');audio.volume=name==='idle_chirp'?.1:.3;audio.playbackRate=rate;voices.push(audio);audio.play().catch(()=>{});}
function musicSync(){const key=screen==='play'&&fx?.fever?'fever_loop':'cozy_loop';if(key!==musicKey){music.pause();musicKey=key;music=new Audio('assets/audio/music/'+key+'.wav');music.loop=true;music.volume=.16;}if(screen==='play'&&!game.paused&&game.profile.music){if(music.paused)music.play().catch(()=>{});}else if(!music.paused)music.pause();}
function label(text,x,y,size=26,width=490,options={}){art.label(ctx,text,x,y,size,width,options);}
function image(key,x,y,w,h=w,options={}){art.draw(ctx,key,x,y,w,h,options);}
function groundShadow(x,y,w){ctx.save();ctx.fillStyle='rgba(97,59,33,.055)';for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(x,y,(w-i*9)/2,(14-i*3)/2,0,0,Math.PI*2);ctx.fill();}ctx.restore();}
function button(id,title,x,y,w,h,action,{disabled=false,color='blue',icon=null,size=25,artKey=null,artOnly=false,caption=null}={}){
 image(artKey||'button_'+color+'_'+(w/h<1.6?'round':'wide'),x,y,w,h,{alpha:disabled?.45:1});
 if(!artOnly){if(icon)image('icon_'+icon,x,y,w*.48,h*.48,{alpha:disabled?.45:1});else label(title,x,y,size,w*.85,{alpha:disabled?.55:1});}
 if(caption){label(caption,x,y+h/2+20,20,120);y+=17;h+=42;w+=16;}
 buttons.push({id,title,x,y,w,h,action:()=>{idle?.reset();action();},disabled});
}
function syncControls(){
 const signature=layout.width+':'+layout.height+'|'+buttons.map(b=>[b.id,b.x,b.y,b.w,b.h].join(':')).join('|');
 if(signature!==controlSignature){controlSignature=signature;controls.replaceChildren();for(const b of buttons){const n=document.createElement('button');n.type='button';n.dataset.id=b.id;n.style.left=b.x/layout.width*100+'%';n.style.top=b.y/layout.height*100+'%';n.style.width=b.w/layout.width*100+'%';n.style.height=b.h/layout.height*100+'%';n.onclick=()=>{const current=buttons.find(c=>c.id===b.id);if(current&&!current.disabled){sound('tap');current.action();}};controls.append(n);}}
 for(const b of buttons){const n=controls.querySelector(`[data-id="${b.id}"]`);n.disabled=b.disabled;n.setAttribute('aria-label',b.title);n.title=b.title;}
}
function go(next){if(game.practice&&next==='menu'){game.endPractice();world.reset();fx.reset();}idle?.reset();if(screen==='play'&&next!=='play')game.pause();activePointer=null;lastPointer=null;game.chain=[];controlSignature='';musicSync();const show=()=>{screen=next;};if(next==='collection')return withArtwork(pageKeys(),show);if(next==='menu')return withArtwork(menuKeys(),show);show();}
function prepareFever(){art.preparingFever=true;try{draw();}finally{art.preparingFever=false;}}
function start(){if(!game.profile.progress.learned&&!game.nextChallenge){go("learn");return;}idle?.reset();const candidates=navigator.onLine?game.allowed:game.allowed.filter(id=>characterKeys(id).every(k=>art.get(k)));game.start(undefined,candidates);game.pause();return withArtwork(roundKeys(),()=>{world.reset();fx.reset();lastSecond=60;lastSkill=false;lastCombo=0;screen='play';activePointer=null;focusedID=null;saveClock=0;game.resume();prepareFever();if(document.hidden)pause();musicSync();announce('Connect three matching plushies.');});}
function resume(){idle?.reset();return withArtwork(roundKeys(),()=>{game.resume();screen='play';activePointer=null;lastPointer=null;world.wake();prepareFever();if(document.hidden)pause();musicSync();});}
function pause(){idle?.reset();if(screen==='play'){game.pause();screen='paused';activePointer=null;lastPointer=null;musicSync();announce('Paused.');}}
function showSettings(){screenBeforeSettings=screen;go('settings');}
function toggleLayout(){game.profile.layout=game.profile.layout==='classic'?'auto':'classic';game.save();resize();}
function meter(key,value,x,y,w,h){image('meter_navy',x,y,w,h);ctx.save();ctx.beginPath();ctx.rect(x-w/2,y-h/2,w*Math.max(0,Math.min(1,value)),h);ctx.clip();image(key,x,y,w,h);ctx.restore();}
function portrait(type,x,y,size=52,options={}){image('char_'+type,x,y,size,size,{bodyDiameter:size,...options});}
function drawMenu(){
 button('settings','Settings',56,57,66,66,showSettings,{color:'gold',icon:'gear'});
 image('home_info_patch',427,50,170,44);label(game.profile.coins+' coins',427,50,20,145);
 label('Plush Pop',270,125,66,440);
 // Whole, stationary portraits keep faces and accessories clear on the home screen.
 image('char_'+game.profile.hero,270,310,276,276);
 game.allowed.filter(id=>id!==game.profile.hero).slice(0,3).forEach((id,i)=>image('char_'+id,110+i*160,521,144,144));
 image('home_info_patch',270,632,176,44);label('BEST '+game.profile.best,270,632,21,150);
 const pending=game.round&&!game.finished;
 button(pending?'resume':'play',pending?'Resume round':'Play',270,722,472,110,pending?resume:start,{color:'green',size:38});
 button('collection','Collection',151,832,222,74,()=>go('collection'),{color:'purple'});
 button('boosts','Boosts',389,832,222,74,()=>go('boosts'),{color:'purple'});
 label('Drag through 3+ matching plushies',270,901,17,455);
 label(inputHint({input:inputMode,appleTouch:/iPad|iPhone|iPod/.test(navigator.userAgent)||navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1,installed:navigator.standalone||matchMedia('(display-mode: standalone)').matches}),270,932,13,470);
}
function drawCollection(){
 label('YOUR PLUSHIES',270,102,38);label(game.previewCharacters?'All 140 unlocked for preview':'Pick your leader',270,153,20);
 game.allowed.slice(collectionPage*layout.pageSize,(collectionPage+1)*layout.pageSize).forEach((id,i)=>{const x=110+(i%3)*160,y=245+Math.floor(i/3)*151,selected=game.profile.hero===id,name=data.characters.find(c=>c.id===id).name;
  image(selected?'card_cream':'card_blue',x,y,146,140);image('char_'+id,x,y-21,90,90);label(name,x,y+31,17,130);
  label(selected?'SELECTED':'Choose',x,y+57,14,130);
  card(id,name,x,y,146,140,selected,()=>chooseHero(id));
 });
 const pages=Math.ceil(game.allowed.length/layout.pageSize);
 button('previous','Previous page',73,664,82,60,()=>turnPage(-1),{disabled:collectionPage===0,icon:'back'});
 label('PAGE '+(collectionPage+1)+' / '+pages,270,664,20);
 button('next','Next page',467,664,82,60,()=>turnPage(1),{disabled:collectionPage===pages-1,icon:'play'});
 const power=game.powers[game.profile.hero];label(power.name,270,733,25,450);
 label(power.steps.map(powerText).join(' / '),270,774,18,470);
 button('back','Back',270,871,280,76,()=>go('menu'),{color:'purple'});
}
function drawBoosts(){
 label('BOOSTS',270,135,44);image('icon_coin',210,200,36);label(game.profile.coins,290,200,28);
 const offers=[['time','5 extra seconds',40],['score','15% more points',60],['skill','Start with a full skill',80]];
 offers.forEach(([id,title,cost],i)=>{const y=330+i*175;image('panel_blue',270,y,460,150);label(title,270,y-38,24,420);label('Owned: '+(game.profile.boosts[id]||0),150,y+1,17,170);button('use-'+id,game.profile.progress.boosts.includes(id)?'Selected':'Select',150,y+43,170,43,()=>game.toggleBoost(id),{color:game.profile.progress.boosts.includes(id)?'green':'blue',size:17});button('buy-'+id,cost+' coins',355,y+22,220,62,()=>{if(game.buyBoost(id)){sound('purchase');announce('Boost ready for your next new round.');}},{disabled:game.profile.coins<cost,color:'gold',size:21});});
 label('Only selected boosts are used next round.',270,792,18,460);button('back','Back',270,870,280,76,()=>go('menu'),{color:'purple'});
}
function drawSettings(){
 label('SETTINGS',270,170,43);
 [['sound','Sound effects'],['music','Music'],['motion','Animations']].forEach(([key,title],i)=>button(key,title+': '+(game.profile[key]?'On':'Off'),270,300+i*108,380,78,()=>{game.profile[key]=!game.profile[key];game.save();musicSync();},{color:game.profile[key]?'green':'purple',size:27}));
 button('layout','Layout: '+(game.profile.layout==='classic'?'Original app':'Automatic'),270,624,430,78,toggleLayout,{color:'purple',size:24});
 label('Turning animations off reduces motion.',270,735,18,460);if(game.previewCharacters)label('All characters unlocked for preview',270,770,15,460);button('back','Back',270,835,280,78,()=>go(screenBeforeSettings),{color:'purple'});label('Version 1.0',270,920,15);
}
function drawPause(){
 image('panel_blue',270,555,450,690);
 label('PAUSED',270,270,48);button('resume','Resume',270,410,320,85,resume,{color:'green',size:30});
 button('new','New round',270,525,320,75,start,{color:'purple'});
 button('settings','Settings',270,635,320,75,showSettings,{color:'purple'});button('home','Home',270,745,320,75,()=>go('menu'));label('Your round is saved.',270,850,20);
}
function drawResults(){const r=game.round;
 label('TIME UP!',270,116,46);image('panel_blue',270,468,480,517);image('icon_trophy',270,240,146);
 label(game.newBest?'NEW BEST!':'NICE PLAY!',270,329,29);const t=game.profile.motion?Math.min(1,(fx.time-resultAt)/.85):1;label(Math.round(r.score*t),270,406,61);label('POINTS',270,463,18);
 label('+'+r.coins+' coins',270,523,28);label('Best chain '+r.bestChain,270,591,24);label('Plushies popped '+r.popped,270,638,24);
 button('again','Play again',270,799,322,82,start,{color:'green'});button('home','Home',270,889,198,61,()=>go('menu'),{color:'purple'});
}
function drawBodies(){
 const r=game.round,selected=new Set(game.chain),last=r.bodies.find(b=>b.id===game.chain.at(-1));
 ctx.save();ctx.beginPath();ctx.moveTo(0,data.bowl.top[0][1]);for(const [x,y]of data.bowl.top)ctx.lineTo(x,y);ctx.lineTo(540,data.bowl.top.at(-1)[1]);ctx.lineTo(540,816);ctx.lineTo(0,816);ctx.closePath();ctx.clip();
 const foreground=b=>selected.has(b.id)||idle.poses.has(b.id),bodies=[...r.bodies.filter(b=>!foreground(b)),...r.bodies.filter(foreground)];
 for(const actual of bodies){const b=fx.displayBody(actual);if(!b||b.y<130||b.y>840)continue;const bubble=b.type==='bubble',key=bubble?'bubble_'+b.kind:'char_'+b.type;
  const matching=last&&!selected.has(b.id)&&game.matches(last,b)&&playable(b),soft=world.pose(b);
  const rest=idle.pose(b);
  ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.angle);
  if(!rest&&!bubble&&game.profile.motion)ctx.scale(soft.xScale,soft.yScale);
  image(rest?.key||key,0,0,bubble?64.8:52,bubble?64.8:52,{bodyKey:rest?.key||key,bodyDiameter:bubble?undefined:52,gray:matching});
  if(selected.has(b.id)||game.hints.includes(b.id)||focusedID===b.id)art.silhouette(ctx,key,0,0,bubble?64.8:52,0,selected.has(b.id)?'#7ffbff':focusedID===b.id?'#ffe598':'#b1ffcb',selected.has(b.id)?2:3);
  ctx.restore();
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
 image('score_pill',270,49,310,64);label(fx.value('score'),270,49,33,270);image('coin_pill',270,95,190,38);image('icon_coin',230,95,30);label(fx.value('coins'),280,95,22,110,{scaleX:fx.pulse('coin'),scaleY:fx.pulse('coin')});
 button('pause','Pause',478,64,76,76,pause,{color:'gold',icon:'pause'});
 if(r.combo>1&&game.comboActive())label(r.combo+' COMBO',350,139,17,145);
 button('hint','Hint',480,147,80,51,()=>game.hint(),{disabled:!game.canAct,size:18});
 if(r.power&&!r.power.pending){const seconds=Math.ceil(Math.max(...Object.values(r.power.timers)));label(game.powers[r.hero].name+' '+seconds+'s',250,166,15,320);}
 if(fx.fever){label('FEVER BONUS',270,207,15);label(fx.rewards.value('score',r.feverScore),270,233,27,280);}
 if(fx.value('skill')>=game.skillGoal&&game.profile.motion)image('fx_rays',72,885,108,108,{alpha:.45+Math.sin(uiTime*3)*.2});
 image('skill_frame',72,885,84,84);portrait(r.hero,72,884,60);meter('meter_gold',fx.value('skill')/game.skillGoal,72,932,82,12);
 if(fx.value('skill')>=game.skillGoal)label('READY',72,918,14);
 buttons.push({id:'skill',title:'Use '+game.powers[r.hero].name,x:72,y:885,w:94,h:94,action:()=>game.useSkill(),disabled:!game.canAct||fx.value('skill')<game.skillGoal});
 meter('meter_gold',fx.fever?r.feverLeft/8:fx.feverCharge,270,887,250,43);label(fx.fever?'FEVER x3':'FEVER',270,887,22,230);
 button('shuffle','Shuffle',477,887,76,76,()=>game.shuffle(),{icon:'shuffle',color:'gold',disabled:!game.canAct||r.shuffleCooldown>0});
 if(r.shuffleCooldown>0)label(Math.ceil(r.shuffleCooldown),477,887,23);
 if(r.power&&!r.power.pending){const keys=Object.keys(r.power.timers).filter(k=>r.power.timers[k]>0);keys.slice(0,4).forEach((k,i)=>image('icon_'+(({stop:'clock',slow:'clock',coins:'coin',score:'trophy',link:'star',reach:'shuffle'})[k]||'star'),215+i*38,828,27));}
 if(r.ready>0){label('READY',270,342,46);label('Connect '+game.minimumChain+' matching plushies',270,389,17);}
 else if(r.elapsed<.65&&!r.popped&&game.superLeft<=0)label('GO!',270,366,58);
}
function drawFeverLights(){if(game.round.feverLeft<=0)return;const sides=[data.bowl.top,data.bowl.left,data.bowl.right,data.bowl.floor];let n=0;for(const line of sides)for(let i=0;i<line.length;i+=Math.max(1,Math.floor(line.length/10))){const [x,y]=line[i];image('vfx_sparkle',x,y,13,13,{alpha:game.profile.motion?.45+Math.sin(uiTime*2-n++*.45)*.2:.65});}}
function draw(){buttons=[];ctx.setTransform(canvas.width/layout.width,0,0,canvas.height/layout.height,0,0);ctx.fillStyle='#25575b';ctx.fillRect(0,0,layout.width,layout.height);
 art.fever=(screen==='play'||screen==='paused')&&fx.fever;art.phase=game.profile.motion?uiTime:0;
 const stage=document.querySelector('#stage');if(stage.dataset.screen!==screen)stage.dataset.screen=screen;
 if(drawPolish({screen,wide:layout.wide,game,data,image,label,button,groundShadow,go,start,resume,practice,shareResult,enterChallenge,createChallenge,showSettings})){syncControls();return;}
 if(layout.wide){
  drawDesktop({ctx,art,game,data,screen,image,label,button,meter,portrait,go,start,resume,pause,showSettings,toggleLayout,drawBodies,drawFeverLights,fx,uiTime,resultAt,collectionPage,turnPage,chooseHero,card,powerText,input:inputMode,
   keepControls:ids=>{buttons=buttons.filter(b=>ids.includes(b.id));},replaceBack:()=>{buttons.find(b=>b.id==='back').action=()=>go(screenBeforeSettings);},
   toggleSetting:key=>{game.profile[key]=!game.profile[key];game.save();musicSync();},purchaseFeedback:()=>{sound('purchase');announce('Boost ready for your next new round.');}});
  drawPractice();if(game.savingFailed)label('Progress cannot be saved in this browser.',600,793,12,1100);syncControls();return;
 }
 const gameplay=screen==='play'||screen==='paused';
 if(!gameplay)image('menu_background',270,480,540,960);
 else art.stage(ctx,gameplay&&fx.fever,uiTime,game.profile.motion);
 if(gameplay){drawBodies();if(game.has('stop')){ctx.fillStyle='#00000024';ctx.fillRect(0,0,540,960);}if(screen==='play'){drawFeverLights();drawHUD();fx.draw(ctx);
   if(fx.super){const t=fx.time-fx.super.start,fade=Math.min(1,t/.3,(fx.super.duration-t)/.15);ctx.fillStyle='rgba(0,0,0,'+Math.max(0,.32*fade)+')';ctx.fillRect(0,0,540,960);fx.drawSuper(ctx);}
   fx.draw(ctx,{afterShade:true});
   if(fx.super){image('button_gold_round',478,64,76);image('icon_pause',478,64,37);}
  }else{ctx.fillStyle='#082e34aa';ctx.fillRect(0,0,540,960);drawPause();}}
 else if(screen==='menu')drawMenu();else if(screen==='collection')drawCollection();else if(screen==='boosts')drawBoosts();else if(screen==='settings')drawSettings();else if(screen==='results'){drawResults();fx.draw(ctx,{afterShade:true});}
 drawPractice();if(game.savingFailed)label('Progress cannot be saved in this browser.',270,952,12,490);
 syncControls();
}
function drain(){for(const e of game.feedback.splice(0)){if(['pop','super','shuffle','fever','select','results'].includes(e.kind))idle?.reset();fx.event(e);
 if(['pop','shuffle','bubbleBorn','super'].includes(e.kind))world.wake();
 if(e.kind==='sound')sound(e.name);else if(e.kind==='select'){world.bump(e.body,2.5);sound('select',Math.min(1.45,1+e.count*.025));}else if(e.kind==='shuffle')sound('shuffle');else if(e.kind==='fever')sound('fever_start');else if(e.kind==='feverEnd')sound('fever_end');
 else if(e.kind==='announcement'){announce(e.text);if(e.text==='TIME UP')sound('time_up');}
 else if(e.kind==='results'){screen='results';resultAt=fx.time;sound(game.result?.mission||game.result?.levelUp?'reward_chime':'result');musicSync();announce('Time up. '+game.round.score+' points.');}
}}
function frame(now){const dt=lastTime?Math.min(.05,(now-lastTime)/1000):0;lastTime=now;
 if(screen==='play'&&!game.paused){uiTime+=dt;game.tick(dt);if(!game.paused&&!game.superLeft&&!game.has('stop')&&!game.round.finale)world.advance(game.round.bodies,dt*(game.has('slow')?.55:1),game.profile.motion,game.round.feverLeft>0);idle.update(dt,activePointer!==null);fx.update(dt);drain();
  const r=game.round,second=Math.ceil(r.timer);if(second!==lastSecond&&second>0&&second<=5&&!r.finale){fx.badge(String(second),'',160,280,.5);sound('time_warning');}lastSecond=second;
  if(fx.value('skill')>=game.skillGoal&&!lastSkill&&!r.finale){const target=rewardTarget(layout,'skill');fx.sparkle(target.x,target.y,50);announce('Skill ready.');}lastSkill=fx.value('skill')>=game.skillGoal;
  if(r.combo>=10&&Math.floor(r.combo/10)>Math.floor(lastCombo/10))fx.badge(r.combo+' COMBO!','',350,280,.8);lastCombo=r.combo;
  for(const name of fx.sounds.splice(0))sound(name,name==='pop'?1+Math.min(8,r.combo)*.018:1);
  saveClock+=dt;if(saveClock>3){game.save();saveClock=0;}
 }else if(screen==='results'){fx.update(dt);uiTime+=dt;}else if(screen!=='paused')uiTime+=dt;
 musicSync();draw();requestAnimationFrame(frame);
}
function point(e){const r=canvas.getBoundingClientRect();return boardPoint(layout,{x:(e.clientX-r.left)*layout.width/r.width,y:(e.clientY-r.top)*layout.height/r.height});}
function hit(p){if(!game.round)return null;let best=null,d=Infinity;for(const b of game.round.bodies){if(!playable(b))continue;const z=distance(b,p);if(z<(b.type==='bubble'?29:26.5)&&z<d){best=b;d=z;}}return best;}
function touchPoint(p,first=false){const b=hit(p);if(!b)return;if(first&&b.type==='bubble'){game.activate(b.id);return;}if(first&&game.powerTap(b.id))return;game.extend(b.id);}
function move(p){if(!lastPointer){lastPointer=p;touchPoint(p);return;}const count=Math.max(1,Math.ceil(distance(lastPointer,p)/9)),from=lastPointer;for(let i=1;i<=count;i++)touchPoint({x:from.x+(p.x-from.x)*i/count,y:from.y+(p.y-from.y)*i/count});lastPointer=p;}
canvas.addEventListener('pointerdown',e=>{idle?.reset();if(e.button!==0||activePointer!==null||screen!=='play'||!game.canAct)return;e.preventDefault();canvas.focus({preventScroll:true});activePointer=e.pointerId;lastPointer=point(e);canvas.setPointerCapture(e.pointerId);touchPoint(lastPointer,true);drain();});
canvas.addEventListener('pointermove',e=>{if(e.pointerId!==activePointer)return;e.preventDefault();const coalesced=e.getCoalescedEvents?.();for(const event of coalesced?.length?coalesced:[e])move(point(event));drain();});
canvas.addEventListener('pointerup',e=>{if(e.pointerId!==activePointer)return;e.preventDefault();move(point(e));game.release();activePointer=null;lastPointer=null;drain();});
function cancelPointer(e){if(!e||e.pointerId===activePointer){game.chain=[];activePointer=null;lastPointer=null;}}
canvas.addEventListener('pointercancel',cancelPointer);canvas.addEventListener('lostpointercapture',cancelPointer);canvas.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('keydown',e=>{idle?.reset();
 inputMode='mouse';document.querySelector('#stage').dataset.input=inputMode;
 if(!game||!loading.hidden||document.querySelector('dialog[open]'))return;if(e.key==='Escape'){e.preventDefault();if(game.chain.length)game.chain=[];else if(screen==='play')pause();else if(screen==='paused')resume();else go('menu');return;}
 if(screen!=='play'||!game.canAct||e.target.tagName==='BUTTON'&&[' ','Enter'].includes(e.key))return;
 const shortcut=({h:()=>game.hint(),s:()=>game.shuffle(),b:()=>{if(fx.value('skill')>=game.skillGoal)game.useSkill();}})[e.key.toLowerCase()];
 if(shortcut){e.preventDefault();shortcut();drain();return;}
 const all=game.round.bodies.filter(playable);if(!all.length)return;let focus=all.find(b=>b.id===focusedID)||all.reduce((a,b)=>b.y>a.y?b:a);focusedID=focus.id;
 if(e.key.startsWith('Arrow')){e.preventDefault();const [dx,dy]=({ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]})[e.key];const next=all.filter(b=>(b.x-focus.x)*dx+(b.y-focus.y)*dy>5).sort((a,b)=>distance(a,focus)+Math.abs((a.x-focus.x)*dy-(a.y-focus.y)*dx)*2-distance(b,focus)-Math.abs((b.x-focus.x)*dy-(b.y-focus.y)*dx)*2)[0];if(next)focusedID=next.id;}
 else if(e.key===' '){e.preventDefault();if(focus.type==='bubble')game.activate(focus.id);else game.extend(focus.id);}else if(e.key==='Enter'){e.preventDefault();game.release();}else if(e.key==='Backspace'){e.preventDefault();game.chain.pop();}drain();
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});window.addEventListener('pagehide',()=>{if(game){game.pause();game.save();music.pause();}});window.addEventListener('blur',()=>pause());
function resize(){
 const previous=layout;layout=getLayout();const stage=document.querySelector('#stage');stage.dataset.layout=layout.wide?'wide':'compact';stage.dataset.input=inputMode;
 const style=getComputedStyle(document.body),width=innerWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight),height=innerHeight-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom),scale=Math.min(width/layout.width,height/layout.height);
 stage.style.width=layout.width*scale+'px';stage.style.height=layout.height*scale+'px';
 const rect=canvas.getBoundingClientRect(),density=Math.min(2,window.devicePixelRatio||1,Math.sqrt(2250000/(rect.width*rect.height)));
 canvas.width=Math.max(layout.width,Math.round(rect.width*density));canvas.height=Math.round(canvas.width*layout.height/layout.width);
 if(game){cancelPointer();idle?.reset();if(previous.wide!==layout.wide){collectionPage=Math.min(Math.ceil(game.allowed.length/layout.pageSize)-1,Math.floor(collectionPage*previous.pageSize/layout.pageSize));if(screen==='collection')go('collection');}}
}
window.addEventListener('resize',resize);
for(const query of [finePointer,hoverPointer])query.addEventListener('change',()=>{inputMode=getLayout().input;resize();});
document.addEventListener('pointerdown',e=>{inputMode=e.pointerType==='touch'||e.pointerType==='pen'?'touch':'mouse';document.querySelector('#stage').dataset.input=inputMode;},{capture:true});
resize();
async function boot(){
 const fetchJSON=async path=>{const r=await fetch('assets/'+path);if(!r.ok)throw Error('Could not load the game.');return r.json();};
 const [loaded,characters,catalog,powers,bowl,access,progression]=await Promise.all([Art.load('.',(fraction)=>{progress.textContent='Loading artwork '+Math.round(fraction*100)+'%';}),fetchJSON('characters.json'),fetchJSON('catalog.json'),fetchJSON('native-powers/catalog.json'),fetchJSON('native-stage/geometry.json'),fetch('access.json').then(r=>{if(!r.ok)throw Error('Could not load character access.');return r.json();}),fetchJSON('progression.json')]);
 art=loaded;data={characters,catalog,powers,bowl,access,progression};let storage;try{storage=localStorage;}catch{}game=new Game(data,storage);if(!localStorageSafe()&&!game.round)game.profile.motion=!matchMedia('(prefers-reduced-motion: reduce)').matches;
 const uiKeys=Object.keys(art.images).filter(k=>!/^(char_|skin_|power_|idle_)/.test(k));
 await art.preload([...uiKeys,...menuKeys(),...catalog.freeCharacters.flatMap(characterKeys),...characterKeys(game.profile.hero),...[0,1,2,3].map(i=>'power_'+game.profile.hero+'_'+i),...(game.round?roundKeys():[]),...['blast','time','coin','score'].map(k=>'bubble_'+k)]);
 if(art.failed.size)throw Error('Some artwork did not load. Check your connection and try again.');
 world=new World(bowl);fx=new Effects(art,game);fx.target=kind=>rewardTarget(layout,kind);idle=new Idle(game,art,()=>sound('idle_chirp'));loading.hidden=true;resize();const incoming=new URLSearchParams(location.search).get('challenge');if(incoming){screen='challenge';pendingCode=incoming;enterChallenge();}requestAnimationFrame(frame);
 if(TESTING)window.__plushQA={game,world,fx,idle,art,data,start,resume,pause,go,get layout(){return layout;},get screen(){return screen;},get buttons(){return buttons.map(({action,...b})=>b);}};
 if('serviceWorker'in navigator&&!TESTING)navigator.serviceWorker.register('./sw.js',{scope:'./'}).then(async()=>{
  await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));
  // A first visit can load art before the worker controls the page. Cache those
  // already-decoded images too, so the first saved nonstarter round works offline.
  for(const url of art.sources.keys())fetch(url).catch(()=>{});
 }).catch(()=>{});
}
function localStorageSafe(){try{return !!localStorage.getItem('plush_pop_share_v1');}catch{return false;}}
boot().catch(error=>{progress.textContent=error.message||'The game could not load. Please try again.';const retry=document.createElement('button');retry.textContent='Try again';retry.onclick=()=>location.reload();loading.append(retry);});

let pendingCode='';
function practice(power){game.beginPractice(power);game.pause();withArtwork(roundKeys(),()=>{world.reset();fx.reset();screen='play';lastSecond=60;lastSkill=false;game.resume();prepareFever();musicSync();});}
function drawPractice(){if(screen!=='play'||!game.practice)return;label(game.practiceText,layout.wide?600:270,layout.wide?125:250,21,470);button('finish-practice','Finish practice',layout.wide?600:270,layout.wide?770:821,216,42,()=>go('menu'),{color:'green',size:18});}
function dialog(title){const el=document.createElement('dialog');el.className='plush-dialog';const heading=document.createElement('h2');heading.textContent=title;el.append(heading);document.body.append(el);el.addEventListener('close',()=>el.remove());el.showModal();return el;}
function dialogButton(el,text,fn){const b=document.createElement('button');b.textContent=text;b.onclick=fn;el.append(b);return b;}
function enterChallenge(){const el=dialog('Enter your friend’s code'),field=document.createElement('input');field.placeholder='PP1-12345-0-454';field.autocomplete='off';field.spellcheck=false;field.value=pendingCode;field.setAttribute('aria-label','Challenge code');el.append(field);const status=document.createElement('p');status.setAttribute('role','status');el.append(status);dialogButton(el,'Play challenge',()=>{if(!game.prepareChallenge(field.value)){status.textContent='That code is invalid or its leader is unavailable.';return;}el.close();game.profile.progress.learned=true;start();});dialogButton(el,'Cancel',()=>el.close());field.focus();}
function createChallenge(){game.prepareChallenge(game.makeChallenge());game.profile.progress.learned=true;start();}
async function shareResult(){
 const r=game.round,name=data.characters.find(c=>c.id===r.hero).name,url='https://neil-source.github.io/plush-pop-play/'+(r.challenge?'?challenge='+r.challenge:''),text=`Plush Pop: ${r.score} points with ${name}! Best chain ${r.bestChain}.`+(r.challenge?' Challenge: '+r.challenge:'');
 const card=document.createElement('canvas');card.width=1080;card.height=1520;const c=card.getContext('2d');c.scale(2,2);art.draw(c,'menu_background',270,380,540,760,{rainbow:false});art.label(c,'Plush Pop',270,80,48);art.draw(c,'char_'+r.hero,270,238,200,200,{rainbow:false});art.label(c,name,270,390,29);art.label(c,r.score+' points',270,464,44);art.label(c,'Best chain '+r.bestChain,270,530,24);art.label(c,r.challenge||'Come play!',270,609,21);art.label(c,'neil-source.github.io/plush-pop-play',270,686,14);
 const blob=await new Promise(resolve=>card.toBlob(resolve,'image/png')),file=new File([blob],'plush-pop-score.png',{type:'image/png'});
 if(navigator.canShare?.({files:[file]})){try{await navigator.share({title:'Plush Pop',text,url,files:[file]});return;}catch(e){if(e.name==='AbortError')return;}}
 const el=dialog('Share your round'),img=new Image();const objectURL=URL.createObjectURL(blob);img.src=objectURL;img.alt=text;el.append(img);const a=document.createElement('a');a.href=objectURL;a.download='plush-pop-score.png';a.textContent='Save score card';el.append(a);const input=document.createElement('textarea');input.value=text+'\n'+url;input.readOnly=true;input.setAttribute('aria-label','Share text and game link');el.append(input);dialogButton(el,'Copy text and link',async()=>{try{await navigator.clipboard.writeText(input.value);announce('Copied.');}catch{input.select();}});dialogButton(el,'Done',()=>el.close());el.addEventListener('close',()=>URL.revokeObjectURL(objectURL),{once:true});
}
