import {level,missionTarget} from './progression.mjs';
export function drawPolish(api){
 const {screen,wide,game:g,data:d,image:I,label:L,button:B,go,start,resume,practice,shareResult,enterChallenge,createChallenge,showSettings}=api,p=g.profile.progress,c=d.progression,w=wide?1200:540,h=wide?800:960,hero=g.profile.hero,f=p.friends[hero]||{xp:0,best:0,rounds:0},lv=level(c,f.xp),name=d.characters.find(x=>x.id===hero).name;
 const strip=(amount,x,y,width,height=12)=>{const ctx=api.ctx;ctx.save();ctx.fillStyle='#10293d';ctx.beginPath();ctx.roundRect(x-width/2,y-height/2,width,height,height/2);ctx.fill();const n=width*Math.max(0,Math.min(1,amount));if(n>0){ctx.fillStyle='#ffbf3d';ctx.beginPath();ctx.roundRect(x-width/2,y-height/2,n,height,Math.min(height/2,n/2));ctx.fill();}ctx.restore();};
 const title=t=>{L(t,wide?480:270,110,wide?44:36,wide?800:460);B('back','Back',wide?1080:55,54,wide?160:70,60,()=>go('menu'),{color:'purple',icon:wide?null:'back'});L(g.profile.coins+' coins',wide?1080:430,wide?120:54,18,170);};
 if(screen==='menu'){
  I('home_counter',126,52,205,52);I('icon_coin',51,51,32,32);L(String(g.profile.coins),147,52,23,140);
  B('learn','Learn to play',286,52,52,52,()=>go('learn'),{artKey:'home_help',artOnly:true});
  B('settings','Settings',364,52,52,52,showSettings,{artKey:'home_settings',artOnly:true});
  I('home_logo',w/2,wide?118:167,280,167);
  const companions=['sunny','mint','luna','ember','stitch'].filter(id=>id!==hero&&g.allowed.includes(id)).slice(0,2);
  for(const offset of [-1,1,0])api.groundShadow(w/2+offset*(wide?158:139),wide?356:434,offset?(wide?94:78):(wide?150:140));
  companions.forEach((id,i)=>I('char_'+id,w/2+(i?1:-1)*(wide?158:139),wide?310:391,110,110));
  I('char_'+hero,w/2,wide?282:350,190,190);
  const pending=g.round&&!g.finished,py=wide?570:700;
  B(pending?'resume':'play',pending?'Resume round':'Play',w/2,py,336,116,pending?resume:start,{artKey:'home_play',artOnly:true});
  I('home_arrow',w/2-(pending?115:70),py-4,34,40);L(pending?'Continue':'Play',w/2+20,py+1,pending?34:46,212);
  const m=missionTarget(c,p),value=p.values[m.id]||0,cy=wide?444:538;
  I('welcome_card',w/2,cy,464,154);I('polish_upgrade_star',w/2-183,cy-31,50,50);
  L('NEXT GOAL',w/2+29,cy-54,14,355);L(m.title,w/2+29,cy-24,25,355);
  strip(value/m.target,w/2+5,cy+15,315);L(value+' / '+m.target+'   +'+m.reward+' coins +'+m.stars+' stars',w/2,cy+43,16,420);
  L('Play. Earn stars. Grow your favorite plushie.',w/2,wide?650:h-39,16,w-60);
  [['goals','Goals','home_goals'],['collection','Plushies','home_collection'],['friends','Upgrade','home_upgrade'],['boosts','Shop','home_shop']].forEach(([id,caption,artKey],i)=>B(id,id==='collection'?'Collection':caption,w/2+(i-1.5)*126,wide?713:829,wide?78:86,wide?78:86,()=>go(id),{artKey,artOnly:true,caption}));
  return true;
 }
 if(screen==='goals'){
  title('PLUSH CLUB');const lap=Math.min(...c.missions.map(m=>p.completed[m.id]||0)),current=c.missions.findIndex(m=>m.id===p.mission),m=missionTarget(c,p),value=p.values[m.id]||0;
  L('CHAPTER '+(lap+1)+'   /   GOAL '+(current+1)+' OF 7',w/2,wide?169:177,20,w-60);
  for(let i=0;i<7;i++){const x=w/2+(i-3)*64;I('polish_upgrade_star',x,wide?214:224,34,34,{alpha:i<=current?1:.3});L(i+1,x,wide?244:254,14,30);}
  const cx=wide?330:270,cy=wide?412:393;I('welcome_card',cx,cy,wide?550:492,251);I('polish_upgrade_star',cx-183,cy-68,65,65);
  L('YOUR NEXT GOAL',cx+46,cy-93,15,355);L(m.title,cx+46,cy-54,30,355);L(m.detail.replace(String(c.missions[current].target),String(m.target)),cx,cy-5,19,440);
  strip(value/m.target,cx,cy+31,390,16);L(value+' / '+m.target,cx,cy+62,21,440);L('REWARD  +'+m.reward+' coins  +'+m.stars+' stars',cx,cy+96,18,450);
  for(let offset=1;offset<=2;offset++){const next=c.missions[(current+offset)%c.missions.length],x=wide?910:270,y=(wide?348:585)+(offset-1)*100;I('welcome_soft',x,y,492,87);L(offset===1?'NEXT':'THEN',x-185,y,14,80);L(next.title,x+54,y-17,23,345);L('+'+next.reward+' coins  +'+next.stars+' stars',x+54,y+14,17,345);}
  L('Finish all 7: +'+c.chapterReward.coins+' coins +'+c.chapterReward.stars+' stars',w/2,wide?606:773,19,w-60);L('Use your stars to make your plushies stronger.',w/2,wide?644:809,16,w-60);
  B('goal-play','Play for my goal',w/2,wide?727:888,380,76,start,{color:'green'});return true;
 }
 if(screen==='boosts'){
  title('PLUSH SHOP');L('Little helpers. Bigger adventures.',w/2,151,17,w-80);
  const offers=[['time','Extra time','5 extra seconds',40],['score','More points','15% more round points',60],['skill','Super start','Start with a ready super',80]];
  L('BOOSTS  /  Use your earned coins',w/2,wide?194:212,21,w-80);
  offers.forEach(([id,name,detail,cost],i)=>{
   const x=wide?218+i*382:270,y=wide?416:333+i*174,owned=g.profile.boosts[id]||0,selected=p.boosts.includes(id);
   I('welcome_card',x,y,wide?354:492,wide?365:158);
   I('welcome_'+id,wide?x:x-183,wide?y-102:y-10,79,87);L(name,wide?x:x+45,wide?y-30:y-51,27,wide?320:340);L(detail,wide?x:x+45,wide?y+9:y-21,17,wide?320:340);
   L('In bag: '+owned,wide?x:x-182,wide?y+48:y+53,wide?18:14,wide?320:110);
   B('use-'+id,selected?'Using 1':'Use next',wide?x:x-50,wide?y+93:y+41,wide?254:151,48,()=>g.toggleBoost(id),{color:selected?'gold':'blue',disabled:owned===0&&!selected,size:18});
   B('buy-'+id,cost+' coins',wide?x:x+130,wide?y+151:y+41,wide?254:183,48,()=>{if(g.buyBoost(id))api.purchaseFeedback();},{color:'green',disabled:g.profile.coins<cost,size:20});
  });
  L('Using 1 spends one boost on your next new round.',w/2,wide?638:806,15,w-60);
  B('shop-goals','Earn coins',w/2-130,wide?715:884,232,64,()=>go('goals'),{color:'gold',size:23});B('shop-upgrades','Upgrades',w/2+130,wide?715:884,232,64,()=>go('friends'),{color:'blue',size:23});
  L('Coins come from playing. Boosts are optional.',w/2,h-16,14,w-60);return true;
 }
 if(screen==='friends'){
  title('GROW YOUR PLUSHIE');if(!wide){I('welcome_card',270,487,492,214);I('welcome_card',270,735,492,189);}else{I('welcome_card',875,410,570,465);}const x=wide?330:270,tx=wide?875:270,power=g.characterLevel(),cost=g.upgradeCost(),ready=cost&&g.profile.coins>=cost.coins&&p.stars>=cost.stars;
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
  title("LET'S PLAY");I('welcome_card',wide?850:270,wide?346:499,wide?590:500,wide?289:314);I('polish_sun',wide?300:270,wide?360:262,wide?260:152,wide?260:152);
  ['Drag through 3 matching plushies.','Connect 7 to make a special bubble.','Pop your leader to charge its super.','Pop 30 to start triple-score Fever.','Hold a bubble to see its blast.','Drag to a second bubble to combine.','After a super, TAG pops marked plushies.'].forEach((line,i)=>L(line,wide?850:270,(wide?220:378)+i*42,20,wide?540:480));
  B('lesson','Try the lesson',wide?850:270,wide?565:712,404,80,()=>practice(false),{color:'green'});B('skip','Skip and play',wide?850:270,wide?670:814,300,66,()=>{p.learned=true;g.save();start();},{color:'gold'});L('Practice keeps your coins and saved round safe.',w/2,h-60,17,w-70);return true;
 }
 if(screen==='challenge'){
  title('FRIEND CHALLENGE');I('welcome_card',wide?850:270,wide?340:508,wide?590:500,232);I('polish_gift',wide?300:270,wide?360:285,wide?260:180,wide?260:180);
  ['Same leader and starting seed.','60 seconds. Level 1. No boosts.','Share your code and compare scores.','Scores are friendly, not verified rankings.'].forEach((line,i)=>L(line,wide?850:270,(wide?266:425)+i*49,22,wide?570:470));
  B('create-challenge','Create challenge',wide?850:270,wide?565:698,430,76,createChallenge,{color:'green'});B('enter-challenge','Enter a code',wide?850:270,wide?665:794,430,76,enterChallenge,{color:'gold'});return true;
 }
 if(screen==='results'){
  const t=g.profile.motion?Math.max(0,api.resultAge):99,appear=at=>({alpha:Math.max(0,Math.min(1,(t-at)/.18))}),r=g.round,a=g.result||{coins:0,xp:0},rf=p.friends[r.hero],m=missionTarget(c,p);
  I('welcome_card',wide?860:270,wide?351:552,wide?620:500,298);L(g.newBest?'NEW BEST!':'NICE PLAY!',wide?330:270,104,42,wide?570:490);I('polish_medal',wide?330:270,wide?265:223,142,142);L(Math.round(r.score*Math.min(1,t/.85)),wide?330:270,wide?438:340,58,500);L('POINTS',wide?330:270,wide?496:385,18,450);
  const x=wide?860:270;L('+'+r.coins+' round coins  +'+a.coins+' rewards',x,wide?196:437,23,wide?570:485);L('Chain '+r.bestChain+'   Popped '+r.popped,x,wide?245:482,20,480);
  L('+'+a.xp+' friendship - '+c.friendshipNames[level(c,rf?.xp||0)],x,wide?313:536,23,wide?580:485,appear(.9));L(a.chapter?'CHAPTER '+a.chapter+' COMPLETE!':a.mission?'GOAL COMPLETE!':'Goal: '+missionTarget(c,p,r.metrics?.mission).title,x,wide?370:581,24,480,appear(1.15));
  L(a.stars?'+'+a.stars+' Power Stars - upgrade a character!':a.badge?'New character badge!':a.levelUp?'Friendship level up!':'Complete goals to earn Power Stars',x,wide?421:623,20,wide?570:475,appear(1.4));L('Next: '+(p.values[m.id]||0)+'/'+m.target+'  '+m.title,x,wide?469:661,18,480,appear(1.65));
  const lv=level(c,rf?.xp||0),low=c.friendship[lv],high=c.friendship[Math.min(lv+1,c.friendship.length-1)],amount=high>low?Math.min(1,((rf?.xp||0)-low)/(high-low)):1;
  I('meter_navy',x,wide?338:555,390,10,appear(.9));const filled=390*amount*Math.max(0,Math.min(1,(t-.9)/.65));if(filled>0)I('meter_gold',x-195+filled/2,wide?338:555,filled,10,appear(.9));
  if(g.profile.motion&&(a.stars||a.mission||a.levelUp)&&t>=1.1&&t<1.82){const u=Math.min(1,(t-1.1)/.55),fromX=wide?330:270,fromY=wide?265:223,toY=wide?421:623;I(a.stars?'polish_upgrade_star':'icon_coin',(1-u)**2*fromX+2*(1-u)*u*(x+200)+u*u*x,(1-u)**2*fromY+2*(1-u)*u*370+u*u*toY,40,40,{alpha:Math.min(1,(1.82-t)/.16),rainbow:false});}
  if(r.challenge)L(r.challenge,w/2,wide?545:700,18,w-70);
  B('again','Play again',wide?850:147,wide?619:773,wide?416:230,76,()=>{if(r.challenge)g.prepareChallenge(r.challenge);start();},{color:'green'});
  B('share-result','Share result',wide?332:147,wide?619:863,230,62,shareResult,{color:'gold'});B('home','Home',wide?850:395,wide?718:863,226,62,()=>go('menu'),{color:'purple'});B('results-upgrade','Upgrade plushie',wide?332:395,wide?718:773,wide?230:226,wide?46:76,()=>go('friends'),{color:'blue',size:19});return true;
 }
 return false;
}
