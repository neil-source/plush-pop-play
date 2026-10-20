import {progress,metrics,award,migrateUpgrades,powerLevel,parseChallenge,challengeCode} from './progression.mjs';
// Temporary character access comes from the build, never a saved purchase or URL flag.
// Approximate reference body size; the wider circle leaves breathing room between bodies.
export const SIZE=72,RADIUS=38,CANVAS=84.23,POPULATION=38,MIN_POPULATION=36,MAX_POPULATION=40,BOARD_VERSION=7;
export const playable=b=>b.y>=205&&b.y<=816;
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const clone=x=>JSON.parse(JSON.stringify(x));
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function selectPattern(step,input,hero,seed=1){
 const all=input.filter(b=>playable(b)&&b.type!=='bubble'&&(step.kind!=='transform'||b.type!==hero));
 const counts={};for(const b of all)counts[b.type]=(counts[b.type]||0)+1;
 const types=Object.keys(counts).sort((a,b)=>counts[a]-counts[b]||a.localeCompare(b)),pattern=step.pattern;
 const area=b=>{const x=b.x-270,y=b.y-610,r=Math.hypot(x,y),d=(a,z)=>Math.hypot(b.x-a,b.y-z);
  switch(pattern){
   case'hero':return b.type===hero;case'heroColumn':return b.type===hero||Math.abs(x)<39;
   case'center':return r<160;case'bottom':return b.y>650;case'bottomCenter':return d(270,735)<170;case'top':return b.y<510;
   case'column':return Math.abs(x)<79;case'row':return Math.abs(y)<79;case'ring':return Math.abs(r-150)<58;
   case'left':return b.x<230;case'right':return b.x>310;case'edges':return b.x<150||b.x>390;
   case'cross':return Math.abs(x)<52||Math.abs(y)<52;case'diagonal':return Math.abs(b.y-(.72*b.x+350))<62;
   case'diagonalCross':return Math.min(Math.abs(b.y-(.72*b.x+350)),Math.abs(b.y-(-.72*b.x+740)))<52;
   case'zigzag':return Math.abs(x-Math.sin((b.y-350)/70)*145)<58;
   case'fork':return Math.abs(Math.abs(x)-(b.y-390)*.4)<55||(b.y<450&&Math.abs(x)<55);
   case'cone':return b.x>75&&Math.abs(b.y-550)<(b.x-75)*.5;case'fan':return b.y>350&&Math.abs(x)<(b.y-350)*.45;
   case'split':return Math.abs(Math.abs(x)-100)<55;case'diamond':return Math.abs(x)+Math.abs(y)*.8<175;
   case'triangle':return b.y>450&&b.y<735&&Math.abs(x)<(b.y-450)*.62;
   case'checker':return (Math.trunc(b.x/73)+Math.trunc(b.y/65))%2===0;
   case'ladder':return Math.abs(Math.abs(x)-100)<40||(Math.abs(x)<130&&Math.trunc(b.y/70)%2===0);
   case'arch':return b.y<610&&Math.abs(Math.hypot(x,(b.y-610)*1.2)-170)<55;
   case'spokes':return Math.abs(Math.sin(Math.atan2(y,x)*3))*r<48;
   case'spiral':return Math.abs(r-(110+Math.sin(Math.atan2(y,x)*2)*65))<62;
   case'threePools':return [[120,520],[270,680],[420,520]].some(([x,y])=>d(x,y)<105);
   case'corners':return [[125,430],[415,430],[125,700],[415,700]].some(([x,y])=>d(x,y)<105);
   case'petals':return [0,1,2,3,4].some(i=>d(270+Math.cos(i*Math.PI*2/5)*115,590+Math.sin(i*Math.PI*2/5)*115)<85);
   case'heart':{const u=x/145,v=(590-b.y)/130;return (u*u+v*v-1)**3-u*u*v**3<=0;}
   case'largest':return b.type===types.at(-1);case'smallest':return b.type===types[0];default:return true;
  }
 };
 const order=b=>['lowest','bottom','bottomCenter'].includes(pattern)?-b.y:['highest','top'].includes(pattern)?b.y:
  ['scatter','checker'].includes(pattern)?((Math.imul(b.id,1664525)+seed)>>>0)%100000:['left','row'].includes(pattern)?b.x:pattern==='right'?-b.x:Math.hypot(b.x-270,b.y-610);
 const found=all.filter(area).sort((a,b)=>order(a)-order(b)||a.id-b.id);return step.amount?found.slice(0,step.amount):found;
}
export class Game{
 constructor(data,storage=null){
  this.data=data;this.storage=storage;this.previewCharacters=data.access?.previewAllCharacters===true;
  this.allowed=[...new Set([...data.catalog.freeCharacters,...(this.previewCharacters?data.characters.map(c=>c.id):[])])];this.powers=Object.fromEntries(data.powers.map(p=>[p.id,p]));
  this.profile={hero:'stitch',coins:0,best:0,sound:true,music:true,motion:true,layout:'auto',boosts:{}};
  this.round=null;this.paused=true;this.finished=false;this.chain=[];this.hints=[];this.feedback=[];this.superLeft=0;this.hintLeft=0;this.newBest=false;this.savingFailed=false;
  this.load();this.profile.progress=progress(this.profile.progress);this.practice=false;this.practiceLesson=0;this.result=null;this.nextChallenge=null;
  if(this.round?.metrics)delete this.round.metrics.mission;if(migrateUpgrades(this.data.progression,this.profile))this.save();
  if(this.round&&(this.round.boardVersion||4)<BOARD_VERSION){
   const r=this.round,plushies=r.bodies.filter(b=>b.type!=='bubble');
   if(!r.finale){
    if(plushies.length>POPULATION){const keep=new Set(Array.from({length:POPULATION},(_,i)=>plushies[Math.floor(i*plushies.length/POPULATION)].id));r.bodies=r.bodies.filter(b=>b.type==='bubble'||keep.has(b.id));}
    while(r.bodies.filter(b=>b.type!=='bubble').length<POPULATION)this.spawn(this.choose(r.active));
   }
   r.boardVersion=BOARD_VERSION;this.save();
  }
 }
 load(){try{
  const raw=this.storage?.getItem('plush_pop_share_v1');if(!raw||raw.length>1000000)return;
  const s=JSON.parse(raw);if(s.version!==1)return;
  const p=s.profile||{};this.profile={easy:p.easy!==false,hero:this.allowed.includes(p.hero)?p.hero:'stitch',coins:clamp(Number(p.coins)||0,0,1e9),best:clamp(Number(p.best)||0,0,1e9),sound:p.sound!==false,music:p.music!==false,motion:p.motion!==false,layout:p.layout==='classic'?'classic':'auto',boosts:{}};
  for(const k of ['time','score','skill'])this.profile.boosts[k]=clamp(Math.trunc(Number(p.boosts?.[k])||0),0,999);
  this.profile.progress=progress(p.progress);
  const r=s.round;if(!r)return;
  const nums=['timer','elapsed','ready','feverLeft','shuffleCooldown','lastClear','score','coins','combo','bestChain','popped','skill','fever','nextID','lane','multiplier','seed'];
  if(nums.some(k=>!Number.isFinite(r[k]))||r.timer<0||r.timer>1000||r.score<0||r.coins<0||r.coins>1e6||r.score>1e9||r.skill<0||r.skill>12||r.feverLeft<0||r.feverLeft>8)return;
  const count=r.easy===true?3:5;
  if(!this.allowed.includes(r.hero)||!Array.isArray(r.active)||r.active.length!==count||r.active.some(t=>!this.allowed.includes(t))||new Set(r.active).size!==count)return;
  if(!Array.isArray(r.bodies)||r.bodies.length>114||(!r.finale&&!r.bodies.length)||new Set(r.bodies.map(b=>b.id)).size!==r.bodies.length)return;
  if(r.bodies.some(b=>!(this.allowed.includes(b.type)||b.type==='bubble')||!['id','x','y','vx','vy','angle'].every(k=>Number.isFinite(b[k]))||b.id<1||b.id>=r.nextID||b.x< -100||b.x>650||b.y< -2500||b.y>1000||Math.abs(b.vx)>5000||Math.abs(b.vy)>5000))return;
  if(r.finale){const f=r.finale;if(r.timer!==0||!Number.isFinite(f.delay)||f.delay<0||f.delay>2||!Array.isArray(f.bubbles)||f.bubbles.length>12||f.bubbles.some(id=>!Number.isInteger(id)||id<1||id>=r.nextID)||(f.type&&!r.active.includes(f.type)))return;}else if(r.timer===0)return;
  if(r.power){if(!this.powers[r.power.id]||!r.power.timers||typeof r.power.timers!=='object'||Object.entries(r.power.timers).some(([k,v])=>!['stop','slow','link','reach','chain','blast','coins','score','drops','tap'].includes(k)||!Number.isFinite(v)||v<0||v>20))r.power=null;else r.power.pending=false;}
  if(r.pair&&(!this.allowed.includes(r.pair.hero)||r.pair.hero===r.hero||!Array.isArray(r.pair.targets)||r.pair.targets.length>6||new Set(r.pair.targets).size!==r.pair.targets.length||r.pair.targets.some(id=>!Number.isInteger(id)||id<1||id>=r.nextID)))r.pair=null;
  r.feverScore=clamp(Number(r.feverScore)||0,0,1e9);this.round=r;
 }catch{this.round=null;}}
 save(){try{this.storage?.setItem('plush_pop_share_v1',JSON.stringify({version:1,profile:this.profile,round:this.practice?(this.practiceWasFinished?null:this.practiceSaved):(this.finished?null:this.round)}));this.savingFailed=false;}catch{this.savingFailed=true;}}
 emit(kind,fields={}){this.feedback.push({kind,...fields});}
 random(){let x=this.round.seed>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;this.round.seed=x>>>0;return (x>>>0)/4294967296;}
 choose(list){return list[Math.floor(this.random()*list.length)];}
 start(seed=Date.now()>>>0,candidates=this.allowed,easy=false){
  const challenge=this.practice?null:this.nextChallenge;this.nextChallenge=null;if(challenge){seed=challenge.seed;this.profile.hero=this.data.characters[challenge.index].id;candidates=this.data.catalog.freeCharacters;}
  const hero=this.allowed.includes(this.profile.hero)?this.profile.hero:this.allowed[0];
  this.round={boardVersion:BOARD_VERSION,upgradeLevel:challenge?1:this.characterLevel(hero),metrics:metrics(),challenge:challenge?.code||null,id:Date.now()+'-'+seed,hero,active:[],bodies:[],timer:60,elapsed:0,ready:2.2,feverLeft:0,feverScore:0,shuffleCooldown:0,lastClear:-99,score:0,coins:0,combo:0,bestChain:0,popped:0,skill:0,fever:0,nextID:1,lane:0,multiplier:1,seed:seed||1,finale:null,power:null};
  this.round.multiplier=1+(this.round.upgradeLevel-1)*.1;
  this.round.easy=easy&&!this.practice&&!challenge;
  const friends=[...new Set([...candidates,...this.data.catalog.freeCharacters])].filter(id=>id!==hero&&this.allowed.includes(id));
  for(let i=friends.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[friends[i],friends[j]]=[friends[j],friends[i]];}
  this.round.active=[hero,...friends.slice(0,this.round.easy?2:4)];
  for(const k of ['time','score','skill'])if(!(this.round.easy&&k==='time')&&!this.practice&&!challenge&&this.profile.progress.boosts.includes(k)&&this.profile.boosts[k]>0){this.profile.boosts[k]--;if(k==='time')this.round.timer+=5;if(k==='score')this.round.multiplier*=1.15;if(k==='skill')this.round.skill=this.skillGoal;}
  for(let i=0;i<POPULATION;i++)this.spawn(i>=POPULATION-3?hero:this.choose(this.round.active));
  this.result=null;this.paused=false;this.finished=false;this.newBest=false;this.chain=[];this.hints=[];this.superLeft=0;this.feedback=[];this.emit('sound',{name:'ready'});this.save();
 }
 spawn(type){const r=this.round,x=60+(r.lane++%7)*70+this.random()*10-5;let y=92;
  for(const b of r.bodies)if(Math.abs(b.x-x)<RADIUS*2)y=Math.min(y,b.y-CANVAS-8);
  // A gentle inward drift prevents straight towers against the side walls.
  const id=r.nextID++,rest=((id*137)%101/100-.5)*1.3;r.bodies.push({id,type,x,y,vx:(270-x)*.1,vy:85,angle:rest*.4,kind:'blast',squash:0});
 }
 get canAct(){return !!this.round&&!this.paused&&!this.finished&&this.round.ready<=0&&this.superLeft<=0&&!this.round.finale;}
 has(k){return !this.round?.power?.pending&&(this.round?.power?.timers[k]||0)>0;}
 get minimumChain(){return this.round?.easy||this.has('chain')?2:3;}
 comboActive(){const r=this.round;return r.combo>0&&(r.feverLeft>0||r.elapsed-r.lastClear<2.3);}
 matches(a,b){return a.type!=='bubble'&&b.type!=='bubble'&&(a.type===b.type||this.has('link'));}
 adjacent(a,b){return distance(a,b)<RADIUS*2+24+(this.has('reach')?65:0);}
 extend(id){if(!this.canAct)return;const b=this.round.bodies.find(b=>b.id===id);if(!b||b.type==='bubble'||!playable(b))return;
  if(this.chain.length>1&&this.chain.at(-2)===id){this.chain.pop();return;}
  const last=this.round.bodies.find(b=>b.id===this.chain.at(-1));if(this.chain.includes(id)||(last&&!(this.matches(last,b)&&this.adjacent(last,b))))return;
  this.chain.push(id);this.emit('select',{body:clone(b),count:this.chain.length});
 }
 easyGroup(id){const first=this.round?.bodies.find(b=>b.id===id&&b.type!=='bubble'&&playable(b));if(!first)return [];const group=[first];for(let i=0;i<group.length&&group.length<24;i++)for(const b of this.round.bodies)if(!group.includes(b)&&playable(b)&&this.matches(group[i],b)&&this.adjacent(group[i],b)){group.push(b);if(group.length===24)break;}return group.map(b=>b.id);}
 release(){if(!this.canAct){this.chain=[];return;}if(this.round.easy&&this.chain.length===1){const group=this.easyGroup(this.chain[0]);this.chain=[];if(group.length>=2)this.clear(group);else this.hint();return;}if(this.chain.length<this.minimumChain){if(this.chain.length)this.emit('rejected',{body:clone(this.round.bodies.find(b=>b.id===this.chain.at(-1)))});this.chain=[];return;}
  let ids=[...this.chain];if(this.has('blast')){const chosen=this.round.bodies.filter(b=>ids.includes(b.id));ids.push(...this.round.bodies.filter(b=>b.type!=='bubble'&&!ids.includes(b.id)&&chosen.some(a=>distance(a,b)<100)).slice(0,8).map(b=>b.id));}
  this.clear(ids);this.chain=[];
 }
 hint(){if(!this.canAct)return;const all=this.round.bodies.filter(b=>b.type!=='bubble'&&playable(b));
  const search=path=>{if(path.length>=this.minimumChain)return path.map(b=>b.id);for(const b of all)if(!path.includes(b)&&this.matches(path.at(-1),b)&&this.adjacent(path.at(-1),b)){const found=search([...path,b]);if(found)return found;}};
  this.hints=[];for(const b of all){const found=search([b]);if(found){this.hints=found;break;}}
  this.hintLeft=2.8;if(!this.hints.length)this.emit('message',{text:'Try Shuffle!'});
 }
 shuffle(){const r=this.round;if(!this.canAct||r.shuffleCooldown>0)return;const d=this.random()<.5?-1:1,pile=r.bodies.filter(playable),cy=pile.reduce((s,b)=>s+b.y,0)/Math.max(1,pile.length);
  for(const b of pile){b.vx=d*clamp((b.y-cy)*3.5,-620,620);b.vy=-680-d*(b.x-270)*1.7;}
  r.shuffleCooldown=6;this.chain=[];this.hints=[];this.emit('shuffle');this.save();
 }
 beginFever(){this.endFever();if(this.round.metrics)this.round.metrics.fevers++;this.round.fever=0;this.round.feverLeft=8;this.round.feverScore=0;this.emit('fever');}
 endFever(){const r=this.round;if(r.feverLeft>0){if(r.combo)r.lastClear=r.elapsed;this.emit('feverEnd',{score:r.feverScore});}r.feverLeft=0;this.chain=[];this.hints=[];}
 clear(ids,{power=false,bubble=false,final=false}={}){
  const r=this.round,set=new Set(ids),removed=r.bodies.filter(b=>set.has(b.id));if(!removed.length)return;
  const n=removed.filter(b=>b.type!=='bubble').length,last=removed.at(-1);if(n)r.combo=this.comboActive()?r.combo+1:1;
  if(!power&&!bubble)r.bestChain=Math.max(r.bestChain,n);
  const gain=Math.round((n*100+n*n*15)*(1+Math.min(10,r.combo)*.06)*(r.feverLeft>0?3:1)*r.multiplier*(this.has('score')?2:1));
  const coins=Math.floor(n*.8)*(this.has('coins')?2:1);if(r.metrics)r.metrics.leaders+=removed.filter(b=>b.type===r.hero).length;if(this.practice&&!power&&!bubble){if(this.practiceLesson===0&&n>=3)this.practiceLesson=1;if(this.practiceLesson===1&&n>=7)this.practiceLesson=2;}r.score+=gain;r.coins+=coins;r.popped+=n;r.lastClear=r.elapsed;
  const skillBefore=r.skill;
  if(r.feverLeft>0)r.feverScore+=gain;r.skill=Math.min(this.skillGoal,r.skill+removed.filter(b=>b.type===r.hero).length);if(r.feverLeft<=0&&!final)r.fever+=n;
  const skillGain=Math.max(0,r.skill-skillBefore);
  r.bodies=r.bodies.filter(b=>!set.has(b.id));
  if(n>=7&&!power&&!bubble&&!final&&r.bodies.filter(b=>b.type==='bubble').length<3){const b={id:r.nextID++,type:'bubble',kind:this.choose(['blast','blast','time','coin','score']),x:last.x,y:last.y,vx:0,vy:0,angle:0,squash:0};r.bodies.push(b);this.emit('bubbleBorn',{body:clone(b)});}
  const remaining=r.bodies.filter(b=>b.type!=='bubble').length,before=remaining+n,drift=before<POPULATION?1:before>POPULATION+1?-1:0;
  const offset=[-2,-1,-1,0,0,0,1,1,2,3][Math.floor(this.random()*10)]+drift;
  const refill=final||!n?0:Math.max(1,MIN_POPULATION-remaining,Math.min(MAX_POPULATION-remaining,n+offset));for(let i=0;i<refill;i++)this.spawn(this.has('drops')&&this.random()<.7?r.hero:this.choose(r.active));
  this.emit('pop',{bodies:clone(removed),coins,score:gain,power,bubble,skillGain});this.chain=[];this.hints=[];
  if(!final&&r.fever>=30&&r.feverLeft<=0)this.beginFever();this.save();
 }
 bubbleTargets(id,partner=null){const r=this.round,b=r?.bodies.find(b=>b.id===id&&b.type==='bubble');if(!b)return [];
  const o=r.bodies.find(a=>a.id===partner&&a.id!==id&&a.type==='bubble'&&distance(a,b)<=180);
  return r.bodies.filter(a=>{if(a.type==='bubble'&&a.id!==id&&a.id!==o?.id)return false;if(!o)return distance(a,b)<117;if(a.id===id||a.id===o.id)return true;if(!playable(a))return false;const x=(b.x+o.x)/2,y=(b.y+o.y)/2;return b.kind===o.kind?Math.hypot(a.x-x,a.y-y)<185:distance(a,b)<117||distance(a,o)<117||Math.abs(a.x-x)<46||Math.abs(a.y-y)<46;}).map(a=>a.id);
 }
 bubbleBonus(b,final){const r=this.round;if(b.kind==='time'&&!final){r.timer+=3;this.emit('bonus',{type:'time',amount:3,x:b.x,y:b.y});}if(b.kind==='coin'){r.coins+=10;this.emit('bonus',{type:'coin',amount:10,x:b.x,y:b.y});}if(b.kind==='score'){r.score+=1000;if(r.feverLeft>0)r.feverScore+=1000;this.emit('bonus',{type:'score',amount:1000,x:b.x,y:b.y});}}
 activate(id,final=false,partner=null){if(!final&&!this.canAct)return;const r=this.round,b=r.bodies.find(b=>b.id===id);if(b?.type!=='bubble')return;
  const o=!final&&r.bodies.find(a=>a.id===partner&&a.id!==id&&a.type==='bubble'&&distance(a,b)<=180),targets=this.bubbleTargets(id,o?.id);
  if(r.metrics)r.metrics.bubbles+=o?2:1;if(this.practice&&this.practiceLesson===2){this.practiceLesson=3;r.skill=this.skillGoal;}
  for(const item of o?[b,o]:[b]){this.emit('bubble',{body:clone(item)});this.bubbleBonus(item,final);}
  if(o){this.emit('bubbleCombo',{a:clone(b),b:clone(o)});this.emit('message',{text:b.kind===o.kind?'DOUBLE BURST!':'CROSS BURST!'});this.emit('sound',{name:'chain_bloom'});}
  this.clear(targets,{bubble:true,final});this.save();
 }
 get pairTargets(){const r=this.round;return r?.pair?r.bodies.filter(b=>b.type!=='bubble'&&playable(b)&&r.pair.targets.includes(b.id)):[];}
 useBuddy(){const r=this.round;if(!this.canAct||!r.pair||!this.pairTargets.length)return;const targets=clone(this.pairTargets),hero=r.pair.hero;r.pair=null;this.chain=[];this.superLeft=this.profile.motion?5:.3;
  this.emit('super',{hero,spec:{...this.powers[hero],name:'Buddy '+this.powers[hero].name,steps:[{kind:'clear',pattern:'hero',amount:6}]},targets,clearIDs:targets.map(b=>b.id)});this.clear(targets.map(b=>b.id),{power:true});this.save();
 }
 useSkill(){const r=this.round;if(!this.canAct||r.skill<this.skillGoal)return;const spec=this.powers[r.hero];if(!spec)return;
  if(r.metrics)r.metrics.supers++;if(this.practice){this.practiceLesson=4;this.profile.progress.learned=true;}r.skill=0;this.chain=[];this.superLeft=this.profile.motion?5:.3;const before=clone(r.bodies),snapshots=new Map(),clear=new Set(),state={id:r.hero,pending:true,timers:{},taps:5};
  for(const step of spec.steps){if(step.kind==='buff'){if(step.pattern==='time'){r.timer+=step.amount;this.emit('bonus',{type:'time',amount:step.amount,x:270,y:425});}else state.timers[step.pattern]=step.amount;continue;}
   let targets=selectPattern(step,r.bodies.filter(b=>!clear.has(b.id)),r.hero,r.seed);if(step.kind==='bubbles')targets=targets.slice(0,Math.max(0,12-r.bodies.filter(b=>b.type==='bubble').length));
   for(const b of targets){if(!snapshots.has(b.id))snapshots.set(b.id,before.find(a=>a.id===b.id)||clone(b));if(step.kind==='clear')clear.add(b.id);else if(step.kind==='transform')b.type=r.hero;else if(step.kind==='bubbles'){b.type='bubble';b.kind=['blast','coin','time','score'][b.id%4];}}
  }
  r.power=Object.keys(state.timers).length?state:null;
  this.emit('super',{hero:r.hero,spec,targets:[...snapshots.values()],clearIDs:[...clear]});if(clear.size)this.clear([...clear],{power:true});
  while(r.bodies.filter(b=>b.type!=='bubble').length<MIN_POPULATION)this.spawn(this.choose(r.active));r.skill=0;
  if(!r.challenge){const hero=r.active.find(id=>id!==r.hero),targets=r.bodies.filter(b=>b.type!=='bubble'&&playable(b)).sort((a,b)=>(a.type===hero?0:1)-(b.type===hero?0:1)||a.id-b.id).slice(0,6).map(b=>b.id);r.pair=targets.length?{hero,targets}:null;}this.save();
 }
 powerTap(id){if(!this.canAct||!this.has('tap')||this.round.power.taps<=0)return false;const b=this.round.bodies.find(b=>b.id===id);if(!b||b.type==='bubble')return false;this.round.power.taps--;this.clear(this.round.bodies.filter(a=>a.type!=='bubble'&&playable(a)&&distance(a,b)<105).map(a=>a.id),{bubble:true});return true;}
 beginFinale(){const r=this.round;if(r.finale)return;this.endFever();this.chain=[];this.hints=[];r.power=null;r.pair=null;r.finale={bubbles:r.bodies.filter(b=>b.type==='bubble').map(b=>b.id),type:r.skill>=this.skillGoal?this.choose(r.active):null,delay:.8,announced:false,settled:false};r.skill=0;this.emit('announcement',{text:'TIME UP'});this.save();}
 tickFinale(dt){const r=this.round,f=r.finale;f.delay=Math.max(0,f.delay-dt);if(f.delay)return;
  if(!f.announced){f.announced=true;if(f.bubbles.length||f.type)this.emit('announcement',{text:'LAST BONUS'});}
  if(f.bubbles.length){const id=f.bubbles.shift();f.delay=.24;this.activate(id,true);}
  else if(f.type){const type=f.type;f.type=null;f.delay=.85;this.clear(r.bodies.filter(b=>b.type===type).map(b=>b.id),{bubble:true,final:true});}
  else if(!f.settled){f.settled=true;f.delay=.9;}else {this.finish();return;}this.save();
 }
 finish(){if(this.finished||this.practice)return;this.finished=true;this.paused=true;this.chain=[];this.newBest=this.round.score>this.profile.best;this.profile.best=Math.max(this.profile.best,this.round.score);this.profile.coins+=this.round.coins;this.result=award(this.data.progression,this.profile,this.round);this.emit('results',{record:this.newBest});this.save();}
 pause(){this.paused=true;this.chain=[];this.save();}
 resume(){if(this.round&&!this.finished)this.paused=false;}
 selectHero(id){if(this.allowed.includes(id)){this.profile.hero=id;this.save();}}
 toggleBoost(id){const p=this.profile.progress;if(!['time','score','skill'].includes(id))return;p.boosts=p.boosts.includes(id)?p.boosts.filter(x=>x!==id):[...p.boosts,id];this.save();}
 characterLevel(id=this.profile.hero){return powerLevel(this.profile.progress,id);}
 get skillGoal(){return 13-Math.max(1,Math.min(5,this.round?.upgradeLevel||1));}
 upgradeCost(id=this.profile.hero){const level=this.characterLevel(id);return this.data.progression.upgrades.find(u=>u.level===level+1)||null;}
 upgradeCharacter(id=this.profile.hero){const cost=this.upgradeCost(id),p=this.profile.progress;if(!this.allowed.includes(id)||!cost||this.profile.coins<cost.coins||p.stars<cost.stars)return false;
  this.profile.coins-=cost.coins;p.stars-=cost.stars;p.friends[id]||={xp:0,best:0,rounds:0,badge:false,supers:0,fevers:0};p.friends[id].powerLevel=cost.level;this.save();this.emit('sound',{name:'reward_chime'});return true;
 }
 prepareChallenge(code){const c=parseChallenge(code,this.data.characters.length);if(!c||!this.allowed.includes(this.data.characters[c.index].id))return false;this.nextChallenge=c;return true;}
 makeChallenge(){return challengeCode((Date.now()>>>0)||1,this.data.characters.findIndex(c=>c.id===this.profile.hero));}
 beginPractice(power=false){if(!this.practice){this.practiceSaved=this.round;this.practiceWasFinished=this.finished;}this.practice=true;this.practiceLesson=power?3:0;this.start(12345);this.round.skill=power?this.skillGoal:0;for(const b of this.round.bodies.slice(-14))b.type=this.round.hero;}
 endPractice(){if(!this.practice)return;this.round=this.practiceSaved;this.finished=this.practiceWasFinished;this.practice=false;this.paused=true;this.superLeft=0;this.chain=[];this.feedback=[];this.save();}
 get practiceText(){return ['Drag through 3 matching plushies','Now connect 7 to make a bubble','Tap your glowing bubble','Tap your leader to try a super','Well done! Try Fever, or finish'][Math.min(4,this.practiceLesson)];}
 buyBoost(id){const price={time:40,score:60,skill:80}[id];if(!price||this.profile.coins<price)return false;this.profile.coins-=price;this.profile.boosts[id]=(this.profile.boosts[id]||0)+1;this.save();return true;}
 tick(dt){if(this.paused||this.finished||!this.round)return;const r=this.round;this.hintLeft=Math.max(0,this.hintLeft-dt);if(!this.hintLeft)this.hints=[];
  if(this.superLeft>0){this.superLeft=Math.max(0,this.superLeft-dt);if(!this.superLeft){if(r.power)r.power.pending=false;this.save();}return;}
  if(r.finale){this.tickFinale(dt);return;}if(r.ready>0){r.ready=Math.max(0,r.ready-dt);if(!r.ready)this.emit('sound',{name:'go'});return;}
  if(this.practice){r.timer=60;if(this.practiceLesson>=3)r.skill=this.skillGoal;}
  const stopped=this.has('stop')?Math.min(dt,r.power.timers.stop):0,active=dt-stopped;
  if(r.power){for(const k of Object.keys(r.power.timers))r.power.timers[k]=Math.max(0,r.power.timers[k]-dt);if(!Object.values(r.power.timers).some(v=>v>0))r.power=null;}
  r.elapsed+=active;if(!r.easy)r.timer=Math.max(0,r.timer-active);r.shuffleCooldown=Math.max(0,r.shuffleCooldown-active);
  if(r.easy){if(r.popped>=30&&r.elapsed-r.lastClear>1.4){this.finish();return;}if(!this.chain.length&&!this.hintLeft&&r.elapsed-Math.max(0,r.lastClear)>4){this.hint();if(!this.hints.length&&r.shuffleCooldown<=0)this.shuffle();}}
  if(r.timer<=0){this.beginFinale();return;}if(r.feverLeft>0){r.feverLeft=Math.max(0,r.feverLeft-active);if(!r.feverLeft){r.lastClear=r.elapsed;this.emit('feverEnd',{score:r.feverScore});this.save();}}
 }
}
