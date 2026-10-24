// Picture-led child flow. All artwork comes from the same sewn game asset set.
export function drawSimple(a){
 const {screen,wide,game:g,image:I,label:L,button:B,go,start,resume,gate,gateSelect,gateSubmit,gateCancel,toggleEasy,chooseHero,turnPage,collectionPage}=a;
 const w=wide?1200:540,h=wide?800:960,c=w/2;
 const back=()=>B('back','Back',wide?90:55,54,76,76,()=>go('menu'),{color:'purple',icon:'back'});
 if(screen==='adult'){
  L('GROWN-UPS',c,90,36,w-50);L('Read the words. Tap the pictures in order.',c,155,18,w-50);L(gate.question,c,220,22,w-50);
  const top=wide?328:410,step=wide?140:152;
  ['sun','heart','star','flower','gift','clock'].forEach((key,i)=>{
   const x=c+(i%3-1)*146,y=top+Math.floor(i/3)*step;
   B('gate-'+key,'Picture '+key,x,y,132,132,()=>gateSelect(key),{artOnly:true});
   I(key==='clock'?'icon_clock':'polish_'+key,x,y,76,76);
  });
  for(let i=0;i<3;i++)I('icon_check',c+(i-1)*44,wide?570:679,32,32,{alpha:i<gate.input.length?1:.18});
  B('gate-submit','Continue. '+gate.question,c,wide?647:759,280,70,gateSubmit,{color:'green',disabled:!gate.correct,artOnly:true});L('Continue',c,wide?647:759,25,210,{alpha:gate.correct?1:.5});
  B('gate-cancel','Cancel',c,h-78,280,76,gateCancel,{color:'purple'});return true;
 }
 if(screen==='parents'){
  back();L('GROWN-UPS',c,119,36,w-70);
  B('play-style',g.profile.easy!==false?'Easy: tap, no timer':'Classic: drag, timed',c,215,440,80,toggleEasy,{color:'gold',size:24});
  L('Changes apply to the next new round.',c,282,17,w-50);
  const rows=wide?[[c-195,386],[c+195,386],[c-195,501],[c+195,501]]:[[c,365],[c,470],[c,575],[c,680]];
  [['friends','Upgrades'],['boosts','Shop'],['settings','Settings'],['challenge','Friend challenge']].forEach(([id,name],i)=>B(id,name,...rows[i],wide?340:360,80,()=>go(id),{color:i%2?'gold':'green',size:25}));
  B('parent-home','Back to play',c,h-85,290,78,()=>go('menu'),{icon:'back',color:'purple'});return true;
 }
 if(screen==='collection'){
  back();L('PICK A FRIEND',c,120,36,w-60);L(g.earnedAccess.length+' / 140 friends earned',c,161,18,w-60);L(g.nextFriend?'Next: '+a.data.characters.find(k=>k.id===g.nextFriend).name+' - finish 30 pops':'You have every friend!',c,190,15,w-60);
  const columns=wide?4:3,count=wide?12:9,rows=3,cx=wide?440:270;
  g.allowed.slice(collectionPage*count,(collectionPage+1)*count).forEach((id,i)=>{
   const x=wide?150+i%4*195:105+i%3*165,y=(wide?240:279)+Math.floor(i/columns)*(wide?157:165),selected=id===g.profile.hero;
   B('hero-'+id,(selected?'Selected ':'Choose ')+a.data.characters.find(k=>k.id===id).name,x,y,wide?170:158,150,()=>chooseHero(id),{artKey:selected?'card_cream':'card_blue',artOnly:true});
   // Button base is behind the actual portrait and selected marker.
   I('char_'+id,x,y-8,112,112);if(selected)I('icon_star',x+55,y+52,28,28);
  });
  const pages=Math.ceil(g.allowed.length/count),py=wide?723:764;
  B('previous','Previous page',wide?140:70,py,86,78,()=>turnPage(-1),{icon:'back',disabled:collectionPage===0});
  L(a.data.characters.find(k=>k.id===g.profile.hero).name,cx,py,23,wide?440:280);
  B('next','Next page',wide?740:470,py,86,78,()=>turnPage(1),{icon:'play',disabled:collectionPage===pages-1});
  if(wide)I('char_'+g.profile.hero,1010,351,220,220);
  B('collection-play','Play with this friend',wide?1010:c,wide?600:877,wide?290:340,94,start,{color:'green',icon:'play'});return true;
 }
 if(screen==='learn'){
  back();L('TAP MATCHING FRIENDS',c,135,32,w-60);
  for(const dx of [-125,0,125])I('char_'+g.profile.hero,c+dx,wide?330:370,114,114,{alpha:g.profile.motion?.75+Math.sin(a.uiTime*3+dx/125)*.25:1});
  L('Tap a pair. Pop!',c,wide?220:250,29,w-50);I('polish_upgrade_star',c,wide?495:580,110,110);L('Take your time.',c,wide?588:729,26,w-40);
  B('lesson-play','Play',c,h-95,340,96,start,{color:'green',icon:'play'});return true;
 }
 if(screen==='results'&&g.round?.easy){
  const r=g.round,earned=g.result||{},x=wide?350:c;
  L('HOORAY!',x,125,50,500);I('char_'+(earned.newCharacter||r.hero),x,wide?350:345,240,240);L(earned.newCharacter?'New friend: '+a.data.characters.find(k=>k.id===earned.newCharacter).name:g.nextFriend?'Finish 30 pops for a new friend':'All friends collected!',x,190,24,500);
  I('polish_upgrade_star',x-125,wide?570:552,86,86);L('+'+(earned.stars||0),x-40,wide?570:552,40,90);I('icon_coin',x+74,wide?570:552,66,66);L('+'+(r.coins+(earned.coins||0)),x+170,wide?570:552,32,130);
  if(earned.newCharacter)B('play-new-friend','Play with '+a.data.characters.find(k=>k.id===earned.newCharacter).name,wide?900:c,wide?250:635,350,62,()=>{g.selectHero(earned.newCharacter);start();},{color:'gold',size:23});
  B('again','Play again',wide?900:c,wide?390:741,350,112,start,{color:'green',icon:'play'});L('Play again',wide?900:c,wide?485:824,26,390);
  B('home','Home',wide?900:c,wide?615:909,150,70,()=>go('menu'),{icon:'back',color:'purple'});return true;
 }
 return false;
}
