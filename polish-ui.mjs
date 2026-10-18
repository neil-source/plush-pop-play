import {level,missionTarget} from './progression.mjs';
export function drawPolish(api){
 const {screen,wide,game:g,data:d,image:I,label:L,button:B,go,start,resume,practice,shareResult,enterChallenge,createChallenge,showSettings}=api,p=g.profile.progress,c=d.progression,w=wide?1200:540,h=wide?800:960,hero=g.profile.hero,f=p.friends[hero]||{xp:0,best:0,rounds:0},lv=level(c,f.xp),name=d.characters.find(x=>x.id===hero).name;
 const title=t=>{I('menu_background',w/2,h/2,w,h);L(t,wide?480:270,110,wide?44:36,wide?800:460);B('back','Back',wide?1080:55,54,wide?160:70,60,()=>go('menu'),{color:'purple',icon:wide?null:'back'});L(g.profile.coins+' coins',wide?1080:430,wide?120:54,18,170);};
 const shelf=(x,y,size=1)=>{I('polish_shelf',x,y+22*size,400*size,48*size);p.shelf.forEach((id,i)=>I('polish_'+id,x+(i-1)*130*size,y-18*size,80*size,80*size));if(!p.shelf.length)L('Earn decorations by completing goals',x,y,15*size,405*size);};
 if(screen==='menu'){
  I('menu_background',w/2,h/2,w,h);B('settings','Settings',56,57,66,66,showSettings,{color:'gold',icon:'gear'});L(g.profile.coins+' coins',w-115,50,21,190);L('Plush Pop',wide?330:270,125,66,500);
  I('char_'+hero,wide?330:270,wide?430:350,wide?430:320,wide?430:320);
  const x=wide?900:270,y=wide?265:597;
  [['goals','Goals'],['shelf','My shelf'],['friends','Friends']].forEach(([id,t],i)=>B(id,t,x+(i-1)*(wide?178:169),y,wide?164:154,62,()=>go(id),{color:i===1?'green':i===0?'gold':'purple',size:24}));
  const m=missionTarget(c,p);L(m.title+'  '+(p.values[m.id]||0)+'/'+m.target,x,wide?340:649,21,490);
  const pending=g.round&&!g.finished;B(pending?'resume':'play',pending?'Resume round':'Play',x,wide?445:722,wide?490:472,110,pending?resume:start,{color:'green',size:38});
  B('collection','Collection',x-119,wide?565:832,222,74,()=>go('collection'),{color:'purple'});B('boosts','Boosts',x+119,wide?565:832,222,74,()=>go('boosts'),{color:'gold'});
  B('learn','Learn to play',x,wide?675:906,240,44,()=>go('learn'),{color:'blue',size:19});L('All characters unlocked for preview',w/2,h-23,14,w-70);return true;
 }
 if(screen==='goals'){
  title('YOUR GOALS');L('Complete each goal to unlock the next',w/2,145,16,w-80);
  const lap=Math.min(...c.missions.map(m=>p.completed[m.id]||0)),current=c.missions.findIndex(m=>m.id===p.mission);
  c.missions.forEach((m,i)=>{const x=w/2,y=wide?196+i*72:212+i*87,width=wide?1040:500,done=(p.completed[m.id]||0)>lap;
   I('panel_blue',x,y,width,wide?66:80);I('polish_'+m.art,x-width/2+42,y,55,55);L(m.title,x-20,y-(wide?17:21),wide?21:23,width-190);L(m.detail.replace(String(m.target),String(missionTarget(c,p,m.id).target)),x-20,y+(wide?3:4),wide?14:15,width-175);L((done?'Complete':(p.values[m.id]||0)+'/'+missionTarget(c,p,m.id).target)+'   +'+m.reward+' coins',x-20,y+(wide?21:25),wide?12:14,width-180);
   L(done?'DONE':i===current?'NOW':i===current+1?'NEXT':'LATER',x+width/2-57,y,16,88);});
  L(c.decorations.find(d=>!p.decor.includes(d.id))?'Next reward: '+c.decorations.find(d=>!p.decor.includes(d.id)).name+' + coins':'Finish the list to start the next round of goals',w/2,wide?690:807,18,w-80);B('goal-play','Play for my goal',w/2,wide?747:888,380,68,start,{color:'green'});return true;
 }
 if(screen==='shelf'){
  title('MY PLUSH SHELF');shelf(w/2,wide?240:300,wide?1.3:1);L('Choose up to 3. Tap a displayed item to put it away.',w/2,wide?320:372,17,w-70);
  c.decorations.forEach((item,i)=>{const x=wide?220+i%3*380:101+i%3*169,y=wide?450+Math.floor(i/3)*220:515+Math.floor(i/3)*220,owned=p.decor.includes(item.id),shown=p.shelf.includes(item.id),width=wide?330:158;
   I('panel_blue',x,y,width,208);I('polish_'+item.art,x,y-40,106,106);L(item.name,x,y+32,wide?22:17,width-15);B('decor-'+item.id,shown?'Put away':owned?'Display':item.cost+' coins',x,y+76,width-20,42,()=>g.decorate(item.id),{color:shown?'green':'gold',disabled:!owned&&g.profile.coins<item.cost,size:19});});return true;
 }
 if(screen==='friends'){
  title('PLUSH FRIENDSHIP');const x=wide?330:270,y=wide?365:308,tx=wide?850:270;
  I('char_'+hero,x,y,240,240);if(lv>=2)I(lv>=4?'polish_hearts':'polish_frame',x,y,258,258);
  L(name,tx,wide?238:461,32,450);L(c.friendshipNames[lv],tx,wide?292:509,28,450);L(lv===4?'Friendship complete!':f.xp+' / '+c.friendship[lv+1]+' friendship',tx,wide?342:553,22,450);L('Best '+f.best+'   Rounds '+f.rounds,tx,wide?393:597,22,450);
  const badges=[['medal','Chain 10',f.badge?'Earned':'Try a long chain',f.badge],['star','Power 3',Math.min(3,f.supers||0)+'/3 powers',(f.supers||0)>=3],['sun','Fever 3',Math.min(3,f.fevers||0)+'/3 Fevers',(f.fevers||0)>=3]];
  badges.forEach(([art,title,detail,earned],i)=>{const x=wide?690+i*160:110+i*160;I('polish_'+art,x,wide?465:659,56,56,{alpha:earned?1:.45});L(title,x,wide?508:699,17,150);L(detail,x,wide?532:719,13,150);});
  B('practice','Practice power',tx,wide?608:765,436,66,()=>practice(true),{color:'gold'});B('challenge','Friend challenge',tx,wide?700:848,436,66,()=>go('challenge'),{color:'green'});L('Choose another leader in Collection to see their progress.',w/2,h-32,16,w-70);return true;
 }
 if(screen==='learn'){
  title("LET'S PLAY");I('polish_sun',wide?300:270,wide?360:262,wide?260:152,wide?260:152);
  ['Drag through 3 matching plushies.','Connect 7 to make a special bubble.','Pop your leader to charge its super.','Pop 30 to start triple-score Fever.'].forEach((line,i)=>L(line,wide?850:270,(wide?256:398)+i*60,23,wide?540:480));
  B('lesson','Try the lesson',wide?850:270,wide?565:712,404,80,()=>practice(false),{color:'green'});B('skip','Skip and play',wide?850:270,wide?670:814,300,66,()=>{p.learned=true;g.save();start();},{color:'gold'});L('Practice keeps your coins and saved round safe.',w/2,h-60,17,w-70);return true;
 }
 if(screen==='challenge'){
  title('FRIEND CHALLENGE');I('polish_gift',wide?300:270,wide?360:285,wide?260:180,wide?260:180);
  ['Same leader and starting seed.','60 seconds. No boosts.','Share your code and compare scores.','Scores are friendly, not verified rankings.'].forEach((line,i)=>L(line,wide?850:270,(wide?266:425)+i*49,22,wide?570:470));
  B('create-challenge','Create challenge',wide?850:270,wide?565:698,430,76,createChallenge,{color:'green'});B('enter-challenge','Enter a code',wide?850:270,wide?665:794,430,76,enterChallenge,{color:'gold'});return true;
 }
 if(screen==='results'){
  const r=g.round,a=g.result||{coins:0,xp:0},rf=p.friends[r.hero],m=missionTarget(c,p);I('menu_background',w/2,h/2,w,h);
  L(g.newBest?'NEW BEST!':'NICE PLAY!',wide?330:270,104,42,wide?570:490);I('polish_medal',wide?330:270,wide?265:223,142,142);L(r.score,wide?330:270,wide?438:340,58,500);L('POINTS',wide?330:270,wide?496:385,18,450);
  const x=wide?860:270;L('+'+r.coins+' round coins  +'+a.coins+' rewards',x,wide?196:437,23,wide?570:485);L('Chain '+r.bestChain+'   Popped '+r.popped,x,wide?245:482,20,480);
  L('+'+a.xp+' friendship - '+c.friendshipNames[level(c,rf?.xp||0)],x,wide?313:536,23,wide?580:485);L(a.mission?'GOAL COMPLETE!':'Goal: '+missionTarget(c,p,r.metrics?.mission).title,x,wide?370:581,24,480);
  L(a.decoration?'New decoration: '+c.decorations.find(d=>d.id===a.decoration).name:a.badge?'New chain badge!':a.levelUp?'Friendship level up!':'Keep playing to fill your shelf',x,wide?421:623,20,wide?570:475);L('Next: '+(p.values[m.id]||0)+'/'+m.target+'  '+m.title,x,wide?469:661,18,480);
  if(r.challenge)L(r.challenge,w/2,wide?545:700,18,w-70);
  B('again','Play again',wide?850:270,wide?619:773,416,76,()=>{if(r.challenge)g.prepareChallenge(r.challenge);start();},{color:'green'});
  B('share-result','Share result',wide?332:147,wide?619:863,230,62,shareResult,{color:'gold'});B('home','Home',wide?850:395,wide?718:863,226,62,()=>go('menu'),{color:'purple'});return true;
 }
 return false;
}
