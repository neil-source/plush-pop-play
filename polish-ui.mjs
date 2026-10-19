import {level,missionTarget} from './progression.mjs';
export function drawPolish(api){
 const {screen,wide,game:g,data:d,image:I,label:L,button:B,go,start,resume,practice,shareResult,enterChallenge,createChallenge,showSettings}=api,p=g.profile.progress,c=d.progression,w=wide?1200:540,h=wide?800:960,hero=g.profile.hero,f=p.friends[hero]||{xp:0,best:0,rounds:0},lv=level(c,f.xp),name=d.characters.find(x=>x.id===hero).name;
 const title=t=>{I('menu_background',w/2,h/2,w,h);I('panel_blue',w/2,wide?460:548,w-24,wide?650:800);L(t,wide?480:270,110,wide?44:36,wide?800:460);B('back','Back',wide?1080:55,54,wide?160:70,60,()=>go('menu'),{color:'purple',icon:wide?null:'back'});L(g.profile.coins+' coins',wide?1080:430,wide?120:54,18,170);};
 const m=missionTarget(c,p),lap=Math.min(...c.missions.map(m=>p.completed[m.id]||0)),current=c.missions.findIndex(m=>m.id===p.mission),number=lap*c.missions.length+current+1;
 if(screen==='menu'){
  I('menu_background',w/2,h/2,w,h);
  I('coin_pill',127,53,210,54);I('icon_coin',51,53,36);L(g.profile.coins,151,53,25,144);
  B('learn','Learn to play',wide?1050:387,56,66,66,()=>go('learn'),{color:'blue',artOnly:true});L('?',wide?1050:387,56,30,45);
  B('settings','Settings',wide?1142:479,56,66,66,showSettings,{color:'blue',icon:'gear'});
  I('home_logo',wide?320:270,wide?280:246,wide?470:426,wide?262:237);
  const others=['sunny','mint','luna','ember','stitch'].filter(id=>id!==hero),cx=wide?872:270,cy=wide?310:443;
  const spots=[[-174,0,140],[169,3,142],[-110,107,170],[116,112,170],[0,-2,150]];
  others.slice(0,5).forEach((id,i)=>{const [dx,dy,size]=spots[i];I('char_'+id,cx+dx,cy+dy,size,size);});
  I('char_'+hero,cx,cy+122,204,204);
  const pending=g.round&&!g.finished;
  B(pending?'resume':'play',pending?'Continue':'Start',wide?320:270,wide?514:733,340,100,pending?resume:()=>go('goals'),{color:'gold',size:40});
  const entries=[['goals','Map'],['collection','Plushies'],['friends','Upgrade'],['boosts','Boosts']];
  entries.forEach(([id,caption],i)=>B(id,caption,wide?330+i*180:72+i*132,wide?700:876,wide?152:108,72,()=>go(id),{color:'blue',size:wide?23:19}));
  return true;
 }
 if(screen==='goals'){
  I('menu_background',w/2,h/2,w,h);
  // The same seven real goals form each trail; only the current stop is playable.
  const scale=wide?800/960:1,mx=wide?100:0,X=x=>mx+x*scale,Y=y=>y*scale;
  I('sky_map',X(270),Y(480),540*scale,960*scale);
  B('back','Back',wide?60:54,56,64,64,()=>go('menu'),{color:'blue',icon:'back'});
  L('PLUSH TRAIL',wide?880:270,wide?135:65,wide?44:34,wide?500:300);
  const points=[[286,692],[358,620],[174,516],[343,404],[220,306],[340,242],[351,175]];
  c.missions.forEach((mission,i)=>{const [x,y]=points[i],done=(p.completed[mission.id]||0)>lap;
   if(i===current){B('current-goal','Goal '+number,X(x),Y(y),88*scale,72*scale,()=>go('goal'),{color:'gold',artOnly:true});L(number,X(x),Y(y),33*scale,70*scale);L('PLAY',X(x),Y(y+51),17*scale,110*scale);}
   else{I(done?'icon_star':'sky_star_empty',X(x),Y(y),56*scale,54*scale,{alpha:done?1:.62});if(!done)L(lap*c.missions.length+i+1,X(x),Y(y),22*scale,48*scale);}
  });
  const x=wide?880:270,y=wide?422:859;
  I('panel_blue',x,y,wide?500:488,wide?390:162);
  L(m.title,x,y-(wide?116:49),wide?38:28,450);
  if(wide)L(m.detail.replace(String(c.missions.find(q=>q.id===m.id).target),String(m.target)),x,y-54,22,440);
  L((p.values[m.id]||0)+' / '+m.target,x,y-(wide?0:14),wide?30:21,440);
  B('goal-play','Continue',x,y+(wide?100:43),318,wide?80:54,()=>go('goal'),{color:'green',size:wide?32:26});
  return true;
 }
 if(screen==='goal'){
  I('menu_background',w/2,h/2,w,h);
  B('back','Back to map',54,56,64,64,()=>go('goals'),{color:'blue',icon:'back'});
  const x=wide?350:270,y=wide?362:370,ratio=(p.values[m.id]||0)/Math.max(1,m.target);
  I('panel_blue',x,y,wide?530:470,465);
  L('GOAL '+number,x,y-184,37,420);
  for(let i=0;i<3;i++)I(ratio>=(i+1)/3?'icon_star':'sky_star_empty',x+(i-1)*112,y-94,94,94);
  L(m.title,x,y-7,31,410);L(m.detail.replace(String(c.missions.find(q=>q.id===m.id).target),String(m.target)),x,y+37,19,418);
  L((p.values[m.id]||0)+' / '+m.target,x,y+79,25,400);
  I('icon_coin',x-121,y+140,34);L('+'+m.reward,x-63,y+140,24,100);I('icon_star',x+49,y+140,34);L('+'+m.stars,x+103,y+140,24,70);
  L('Rewards when this goal is complete',x,y+184,16,415);
  const bx=wide?910:270,by=wide?340:644;
  if(wide){I('char_'+hero,bx,184,150,150);L(name,bx,282,28,450);}
  I('panel_blue',bx,by+75,470,198);L('BOOSTS FOR THIS ROUND',bx,by,22,440);
  [['time','+5 sec'],['score','Score'],['skill','Super']].forEach(([id,title],i)=>{const x=bx+(i-1)*151,owned=g.profile.boosts[id]||0,selected=p.boosts.includes(id);
   B('boost-'+id,title,x,by+79,120,80,()=>g.toggleBoost(id),{color:selected?'gold':'blue',disabled:!owned,size:23});L(selected&&owned?'ON - '+owned:owned+' owned',x,by+142,17,132);
  });
  const pending=g.round&&!g.finished;
  B('begin-goal',pending?'Resume':'Play',bx,wide?610:886,340,88,pending?resume:start,{color:'green',size:38});
  return true;
 }
 if(screen==='friends'){
  title('CHARACTER UPGRADES');const x=wide?330:270,tx=wide?875:270,power=g.characterLevel(),cost=g.upgradeCost(),ready=cost&&g.profile.coins>=cost.coins&&p.stars>=cost.stars;
  I('char_'+hero,x,wide?340:260,wide?300:180,wide?300:180);L(name,x,wide?550:374,30,450);L('LEVEL '+power+' / 5',x,wide?600:411,25,450);
  L('Points +'+((power-1)*10)+'%',tx,wide?220:447,22,475);L('Super charges in '+(13-power)+' leader pops',tx,wide?260:478,19,475);L(power<5?'Next: +'+(power*10)+'% points / '+(12-power)+' pops':'Maximum character level!',tx,wide?320:514,19,475);
  L(c.friendshipNames[lv]+' - '+f.xp+' friendship',x,wide?650:551,17,475);L('Best '+f.best+'   Rounds '+f.rounds,x,wide?690:578,15,475);
  const badges=[['medal',f.badge?'Chain 10 earned':'Chain 10',f.badge],['star','Powers '+Math.min(3,f.supers||0)+'/3',(f.supers||0)>=3],['sun','Fevers '+Math.min(3,f.fevers||0)+'/3',(f.fevers||0)>=3]];
  badges.forEach(([art,title,earned],i)=>{const x=tx+(i-1)*160;I('polish_'+art,x,wide?375:613,34,34,{alpha:earned?1:.45});L(title,x,wide?410:644,14,150);});
  I('polish_upgrade_star',tx-124,wide?460:672,32,32);L(p.stars+' Power Stars',tx+28,wide?460:672,21,300);L(cost?'Cost: '+cost.coins+' coins + '+cost.stars+' Power Stars':'All upgrades complete',tx,wide?510:706,18,475);
  B('upgrade-character',cost?'Upgrade to level '+cost.level:'MAX LEVEL',tx,wide?590:759,440,66,()=>g.upgradeCharacter(),{color:'green',disabled:!ready,size:25});
  const need=[];if(cost){if(g.profile.coins<cost.coins)need.push((cost.coins-g.profile.coins)+' coins');if(p.stars<cost.stars)need.push((cost.stars-p.stars)+' stars');}
  L(!cost?'Try your fully upgraded power!':need.length?'Need '+need.join(' + ')+' - complete goals':'Applies from your next round',tx,wide?650:809,14,480);
  B('practice','Practice power',tx-(wide?140:121),wide?720:864,wide?250:226,60,()=>practice(true),{color:'gold',size:20});B('challenge','Friend challenge',tx+(wide?140:121),wide?720:864,wide?250:226,60,()=>go('challenge'),{color:'purple',size:20});L('Choose another character in Collection to upgrade it.',w/2,h-33,15,w-70);return true;
 }
 if(screen==='learn'){
  title("LET'S PLAY");I('polish_sun',wide?300:270,wide?360:262,wide?260:152,wide?260:152);
  ['Drag through 3 matching plushies.','Connect 7 to make a special bubble.','Pop your leader to charge its super.','Pop 30 to start triple-score Fever.'].forEach((line,i)=>L(line,wide?850:270,(wide?256:398)+i*60,23,wide?540:480));
  B('lesson','Try the lesson',wide?850:270,wide?565:712,404,80,()=>practice(false),{color:'green'});B('skip','Skip and play',wide?850:270,wide?670:814,300,66,()=>{p.learned=true;g.save();start();},{color:'gold'});L('Practice keeps your coins and saved round safe.',w/2,h-60,17,w-70);return true;
 }
 if(screen==='challenge'){
  title('FRIEND CHALLENGE');I('polish_gift',wide?300:270,wide?360:285,wide?260:180,wide?260:180);
  ['Same leader and starting seed.','60 seconds. Level 1. No boosts.','Share your code and compare scores.','Scores are friendly, not verified rankings.'].forEach((line,i)=>L(line,wide?850:270,(wide?266:425)+i*49,22,wide?570:470));
  B('create-challenge','Create challenge',wide?850:270,wide?565:698,430,76,createChallenge,{color:'green'});B('enter-challenge','Enter a code',wide?850:270,wide?665:794,430,76,enterChallenge,{color:'gold'});return true;
 }
 if(screen==='results'){
  const r=g.round,a=g.result||{coins:0,xp:0};I('menu_background',w/2,h/2,w,h);
  const x=wide?353:270,cy=wide?368:445;
  I('panel_blue',x,cy,wide?562:480,wide?650:690);
  L(g.newBest?'NEW BEST!':'RESULT',x,cy-(wide?267:295),39,450);
  [10000,25000,50000].forEach((target,i)=>I(r.score>=target?'icon_star':'sky_star_empty',x+(i-1)*114,cy-200,100,100));
  L('10,000 / 25,000 / 50,000 points',x,cy-128,15,430);
  L('SCORE',x,cy-76,22,400);I('score_pill',x,cy-5,392,83);L(r.score,x,cy-5,56,360);
  I('icon_coin',x-121,cy+81,36);L('+'+(r.coins+a.coins)+' coins',x+23,cy+81,28,270);
  L('Best chain '+r.bestChain+'   Popped '+r.popped,x,cy+136,21,420);
  const tx=wide?925:x,ty=wide?294:631;
  if(wide){I('panel_blue',tx,390,450,580);I('char_'+r.hero,tx,190,140,140);}
  L(a.mission?'GOAL COMPLETE!':missionTarget(c,p,r.metrics?.mission).title,tx,ty,28,410);
  L(a.stars?'+'+a.stars+' Power Stars':(p.values[m.id]||0)+' / '+m.target+' toward your goal',tx,ty+41,21,420);
  L('+'+a.xp+' friendship',tx,ty+81,19,420);if(r.challenge)L(r.challenge,tx,ty+120,16,420);
  B('home','Home',wide?810:109,wide?570:858,132,82,()=>go('menu'),{color:'gold',size:26});
  B('again',a.mission?'Next goal':'Play again',wide?1015:346,wide?570:858,wide?250:302,82,()=>{if(r.challenge){g.prepareChallenge(r.challenge);start();}else go('goal');},{color:'green',size:30});
  B('share-result','Share result',wide?925:270,wide?700:938,226,44,shareResult,{color:'blue',size:19});return true;
 }

 return false;
}
