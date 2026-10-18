import {level,missionTarget} from './progression.mjs';
export function drawPolish(api){
 const {screen,wide,game:g,data:d,image:I,label:L,button:B,go,start,resume,practice,shareResult,enterChallenge,createChallenge,showSettings}=api,p=g.profile.progress,c=d.progression,w=wide?1200:540,h=wide?800:960,hero=g.profile.hero,f=p.friends[hero]||{xp:0,best:0,rounds:0},lv=level(c,f.xp),name=d.characters.find(x=>x.id===hero).name;
 const title=t=>{I('menu_background',w/2,h/2,w,h);L(t,wide?480:270,110,wide?44:36,wide?800:460);B('back','Back',wide?1080:55,54,wide?160:70,60,()=>go('menu'),{color:'purple',icon:wide?null:'back'});L(g.profile.coins+' coins',wide?1080:430,wide?120:54,18,170);};
 if(screen==='menu'){
  I('menu_background',w/2,h/2,w,h);B('settings','Settings',56,57,66,66,showSettings,{color:'gold',icon:'gear'});L(g.profile.coins+' coins',w-115,50,21,190);L('Plush Pop',wide?330:270,125,66,500);
  I('char_'+hero,wide?330:270,wide?430:350,wide?430:320,wide?430:320);
  const x=wide?900:270,y=wide?265:597;
  [['goals','Goals'],['friends','Characters']].forEach(([id,t],i)=>B(id,t,x+(i-.5)*(wide?252:238),y,wide?238:222,62,()=>go(id),{color:i===0?'gold':'purple',size:24}));
  const m=missionTarget(c,p);L(m.title+'  '+(p.values[m.id]||0)+'/'+m.target,x,wide?340:649,21,490);
  const pending=g.round&&!g.finished;B(pending?'resume':'play',pending?'Resume round':'Play',x,wide?445:722,wide?490:472,110,pending?resume:start,{color:'green',size:38});
  B('collection','Collection',x-119,wide?565:832,222,74,()=>go('collection'),{color:'purple'});B('boosts','Boosts',x+119,wide?565:832,222,74,()=>go('boosts'),{color:'gold'});
  B('learn','Learn to play',x,wide?675:906,240,44,()=>go('learn'),{color:'blue',size:19});L('All characters unlocked for preview',w/2,h-23,14,w-70);return true;
 }
 if(screen==='goals'){
  title('YOUR GOALS');L('Complete each goal to unlock the next',w/2,145,16,w-80);
  const lap=Math.min(...c.missions.map(m=>p.completed[m.id]||0)),current=c.missions.findIndex(m=>m.id===p.mission);
  c.missions.forEach((m,i)=>{const x=w/2,y=wide?196+i*72:212+i*87,width=wide?1040:500,done=(p.completed[m.id]||0)>lap;
   I('panel_blue',x,y,width,wide?66:80);I('polish_'+m.art,x-width/2+42,y,55,55);L(m.title,x-20,y-(wide?17:21),wide?21:23,width-190);L(m.detail.replace(String(m.target),String(missionTarget(c,p,m.id).target)),x-20,y+(wide?3:4),wide?14:15,width-175);L((done?'Complete':(p.values[m.id]||0)+'/'+missionTarget(c,p,m.id).target)+'   +'+m.reward+' coins +'+m.stars+' star',x-20,y+(wide?21:25),wide?12:14,width-180);
   L(done?'DONE':i===current?'NOW':i===current+1?'NEXT':'LATER',x+width/2-57,y,16,88);});
  L('Earn coins and Power Stars to upgrade characters',w/2,wide?690:807,18,w-80);B('goal-play','Play for my goal',w/2,wide?747:888,380,68,start,{color:'green'});return true;
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
  const r=g.round,a=g.result||{coins:0,xp:0},rf=p.friends[r.hero],m=missionTarget(c,p);I('menu_background',w/2,h/2,w,h);
  L(g.newBest?'NEW BEST!':'NICE PLAY!',wide?330:270,104,42,wide?570:490);I('polish_medal',wide?330:270,wide?265:223,142,142);L(r.score,wide?330:270,wide?438:340,58,500);L('POINTS',wide?330:270,wide?496:385,18,450);
  const x=wide?860:270;L('+'+r.coins+' round coins  +'+a.coins+' rewards',x,wide?196:437,23,wide?570:485);L('Chain '+r.bestChain+'   Popped '+r.popped,x,wide?245:482,20,480);
  L('+'+a.xp+' friendship - '+c.friendshipNames[level(c,rf?.xp||0)],x,wide?313:536,23,wide?580:485);L(a.mission?'GOAL COMPLETE!':'Goal: '+missionTarget(c,p,r.metrics?.mission).title,x,wide?370:581,24,480);
  L(a.stars?'+'+a.stars+' Power Stars - upgrade a character!':a.badge?'New character badge!':a.levelUp?'Friendship level up!':'Complete goals to earn Power Stars',x,wide?421:623,20,wide?570:475);L('Next: '+(p.values[m.id]||0)+'/'+m.target+'  '+m.title,x,wide?469:661,18,480);
  if(r.challenge)L(r.challenge,w/2,wide?545:700,18,w-70);
  B('again','Play again',wide?850:270,wide?619:773,416,76,()=>{if(r.challenge)g.prepareChallenge(r.challenge);start();},{color:'green'});
  B('share-result','Share result',wide?332:147,wide?619:863,230,62,shareResult,{color:'gold'});B('home','Home',wide?850:395,wide?718:863,226,62,()=>go('menu'),{color:'purple'});return true;
 }
 return false;
}
