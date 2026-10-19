import {level,missionTarget} from './progression.mjs';
export function drawPolish(api){
 const {screen,wide,game:g,data:d,image:I,label:L,button:B,go,start,resume,practice,shareResult,enterChallenge,createChallenge,showSettings}=api,p=g.profile.progress,c=d.progression,w=wide?1200:540,h=wide?800:960,hero=g.profile.hero,f=p.friends[hero]||{xp:0,best:0,rounds:0},lv=level(c,f.xp),name=d.characters.find(x=>x.id===hero).name;
 const title=t=>{I('menu_background',w/2,h/2,w,h);L(t,wide?480:270,110,wide?44:36,wide?800:460);B('back','Back',wide?1080:55,54,wide?160:70,60,()=>go('menu'),{color:'purple',icon:wide?null:'back'});L(g.profile.coins+' coins',wide?1080:430,wide?120:54,18,170);};
 if(screen==='menu'){
  I('home_counter',126,52,205,52);I('icon_coin',51,51,32,32);L(String(g.profile.coins),147,52,23,140);
  B('learn','Learn to play',286,52,52,52,()=>go('learn'),{artKey:'home_help',artOnly:true});
  B('settings','Settings',364,52,52,52,showSettings,{artKey:'home_settings',artOnly:true});
  I('home_logo',w/2,wide?132:190,wide?320:340,wide?191:203);
  const companions=['sunny','mint','luna','ember','stitch'].filter(id=>id!==hero&&g.allowed.includes(id)).slice(0,2);
  for(const offset of [-1,1,0])api.groundShadow(w/2+offset*(wide?158:139),wide?468:529,offset?(wide?94:78):(wide?150:140));
  companions.forEach((id,i)=>I('char_'+id,w/2+(i?1:-1)*(wide?158:139),wide?405:478,wide?148:124,wide?148:124));
  I('char_'+hero,w/2,wide?371:437,wide?236:220,wide?236:220);
  const pending=g.round&&!g.finished,py=wide?540:622;
  B(pending?'resume':'play',pending?'Resume round':'Play',w/2,py,336,144,pending?resume:start,{artKey:'home_play',artOnly:true});
  I('home_arrow',w/2-(pending?115:70),py-4,34,40);L(pending?'Continue':'Play',w/2+20,py+1,pending?34:46,212);
  const m=missionTarget(c,p);L('Next goal: '+m.title,w/2,wide?620:718,20,450);L((p.values[m.id]||0)+' / '+m.target,w/2,wide?647:748,18,440);
  [['goals','Goals','home_goals'],['collection','Plushies','home_collection'],['friends','Upgrade','home_upgrade'],['boosts','Boosts','home_shop']].forEach(([id,caption,artKey],i)=>B(id,id==='collection'?'Collection':caption,w/2+(i-1.5)*126,wide?713:829,wide?78:86,wide?78:86,()=>go(id),{artKey,artOnly:true,caption}));
  return true;
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
  ['Drag through 3 matching plushies.','Connect 7 to make a special bubble.','Pop your leader to charge its super.','Pop 30 to start triple-score Fever.','Hold a bubble to preview. Drag away to cancel.','Drag onto another bubble to combine them.','After a super, TAG hits the star-marked group.'].forEach((line,i)=>L(line,wide?850:270,(wide?220:378)+i*42,20,wide?540:480));
  B('lesson','Try the lesson',wide?850:270,wide?565:712,404,80,()=>practice(false),{color:'green'});B('skip','Skip and play',wide?850:270,wide?670:814,300,66,()=>{p.learned=true;g.save();start();},{color:'gold'});L('Practice keeps your coins and saved round safe.',w/2,h-60,17,w-70);return true;
 }
 if(screen==='challenge'){
  title('FRIEND CHALLENGE');I('polish_gift',wide?300:270,wide?360:285,wide?260:180,wide?260:180);
  ['Same leader and starting seed.','60 seconds. Level 1. No boosts.','Share your code and compare scores.','Scores are friendly, not verified rankings.'].forEach((line,i)=>L(line,wide?850:270,(wide?266:425)+i*49,22,wide?570:470));
  B('create-challenge','Create challenge',wide?850:270,wide?565:698,430,76,createChallenge,{color:'green'});B('enter-challenge','Enter a code',wide?850:270,wide?665:794,430,76,enterChallenge,{color:'gold'});return true;
 }
 if(screen==='results'){
  const t=g.profile.motion?Math.max(0,api.resultAge):99,appear=at=>({alpha:Math.max(0,Math.min(1,(t-at)/.18))}),r=g.round,a=g.result||{coins:0,xp:0},rf=p.friends[r.hero],m=missionTarget(c,p);I('menu_background',w/2,h/2,w,h);
  L(g.newBest?'NEW BEST!':'NICE PLAY!',wide?330:270,104,42,wide?570:490);I('polish_medal',wide?330:270,wide?265:223,142,142);L(Math.round(r.score*Math.min(1,t/.85)),wide?330:270,wide?438:340,58,500);L('POINTS',wide?330:270,wide?496:385,18,450);
  const x=wide?860:270;L('+'+r.coins+' round coins  +'+a.coins+' rewards',x,wide?196:437,23,wide?570:485);L('Chain '+r.bestChain+'   Popped '+r.popped,x,wide?245:482,20,480);
  L('+'+a.xp+' friendship - '+c.friendshipNames[level(c,rf?.xp||0)],x,wide?313:536,23,wide?580:485,appear(.9));L(a.mission?'GOAL COMPLETE!':'Goal: '+missionTarget(c,p,r.metrics?.mission).title,x,wide?370:581,24,480,appear(1.15));
  L(a.stars?'+'+a.stars+' Power Stars - upgrade a character!':a.badge?'New character badge!':a.levelUp?'Friendship level up!':'Complete goals to earn Power Stars',x,wide?421:623,20,wide?570:475,appear(1.4));L('Next: '+(p.values[m.id]||0)+'/'+m.target+'  '+m.title,x,wide?469:661,18,480,appear(1.65));
  const lv=level(c,rf?.xp||0),low=c.friendship[lv],high=c.friendship[Math.min(lv+1,c.friendship.length-1)],amount=high>low?Math.min(1,((rf?.xp||0)-low)/(high-low)):1;
  I('meter_navy',x,wide?338:555,390,10,appear(.9));const filled=390*amount*Math.max(0,Math.min(1,(t-.9)/.65));if(filled>0)I('meter_gold',x-195+filled/2,wide?338:555,filled,10,appear(.9));
  if(g.profile.motion&&(a.stars||a.mission||a.levelUp)&&t>=1.1&&t<1.82){const u=Math.min(1,(t-1.1)/.55),fromX=wide?330:270,fromY=wide?265:223,toY=wide?421:623;I(a.stars?'polish_upgrade_star':'icon_coin',(1-u)**2*fromX+2*(1-u)*u*(x+200)+u*u*x,(1-u)**2*fromY+2*(1-u)*u*370+u*u*toY,40,40,{alpha:Math.min(1,(1.82-t)/.16),rainbow:false});}
  if(r.challenge)L(r.challenge,w/2,wide?545:700,18,w-70);
  B('again','Play again',wide?850:270,wide?619:773,416,76,()=>{if(r.challenge)g.prepareChallenge(r.challenge);start();},{color:'green'});
  B('share-result','Share result',wide?332:147,wide?619:863,230,62,shareResult,{color:'gold'});B('home','Home',wide?850:395,wide?718:863,226,62,()=>go('menu'),{color:'purple'});return true;
 }
 return false;
}
