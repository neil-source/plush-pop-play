// Pure, portable progression rules. Round rewards are committed exactly once by Game.finish.
const integer=(n,max=1e9)=>Math.max(0,Math.min(max,Math.trunc(Number(n)||0)));
export function progress(raw={}){
 const p={mission:'pops',values:{},completed:{},friends:{},decor:[],shelf:[],boosts:[],learned:false,...raw};
 for(const field of ['values','completed'])p[field]=Object.fromEntries(Object.entries(p[field]||{}).slice(0,30).map(([k,v])=>[k,integer(v)]));
 p.friends=Object.fromEntries(Object.entries(p.friends||{}).slice(0,140).map(([k,v])=>[k,{xp:integer(v.xp),best:integer(v.best),rounds:integer(v.rounds),badge:!!v.badge,supers:integer(v.supers),fevers:integer(v.fevers),powerLevel:Math.max(1,integer(v.powerLevel||1,5))}]));
 for(const k of ['decor','shelf','boosts'])p[k]=[...new Set(Array.isArray(p[k])?p[k].filter(x=>typeof x==='string'):[])].slice(0,k==='shelf'?3:20);
 p.stars=integer(p.stars);return p;
}
export function migrateUpgrades(catalog,profile){const p=profile.progress;if(p.upgradeVersion===1)return false;
 p.stars+=catalog.missions.reduce((n,m)=>n+(p.completed[m.id]||0)*m.stars,0);
 profile.coins+=catalog.decorations.filter(d=>p.decor.includes(d.id)).reduce((n,d)=>n+d.cost,0);
 p.decor=[];p.shelf=[];p.upgradeVersion=1;return true;
}
export function powerLevel(p,id){return Math.max(1,Math.min(5,p.friends[id]?.powerLevel||1));}
export function level(catalog,xp){return Math.max(0,catalog.friendship.filter(t=>xp>=t).length-1);}
// Finish each goal in list order, then begin the next, slightly harder lap.
// Existing completions and partial progress survive the old selectable-goal save format.
export function nextMission(catalog,p){const lap=Math.min(...catalog.missions.map(m=>p.completed[m.id]||0));return catalog.missions.find(m=>(p.completed[m.id]||0)===lap).id;}
export function missionTarget(catalog,p,id=p.mission){const m=catalog.missions.find(m=>m.id===id)||catalog.missions[0],tier=Math.min(4,p.completed[m.id]||0);return {...m,target:m.target+Math.round(m.target*.25*tier),tier};}
export function metrics(mission='pops'){return {mission,supers:0,fevers:0,bubbles:0,leaders:0};}
export function award(catalog,profile,r){
 const p=profile.progress=progress(profile.progress);p.mission=nextMission(catalog,p);
 const previousLap=Math.min(...catalog.missions.map(m=>p.completed[m.id]||0));
 const m=missionTarget(catalog,p),v=r.metrics||{},before=p.friends[r.hero]||{xp:0,best:0,rounds:0,badge:false};
 const xp=20+Math.min(80,Math.floor(r.popped/5))+Math.min(40,(v.supers||0)*10),oldLevel=level(catalog,before.xp);
 const friend={powerLevel:before.powerLevel||1,xp:before.xp+xp,best:Math.max(before.best,r.score),rounds:before.rounds+1,badge:before.badge||r.bestChain>=10,supers:(before.supers||0)+(v.supers||0),fevers:(before.fevers||0)+(v.fevers||0)};p.friends[r.hero]=friend;
 const earned={xp,chapter:0,level:level(catalog,friend.xp),levelUp:false,mission:false,coins:0,stars:0,record:r.score>before.best,badge:!before.badge&&friend.badge||((before.supers||0)<3&&friend.supers>=3)||((before.fevers||0)<3&&friend.fevers>=3)};earned.levelUp=earned.level>oldLevel;
 const amount=m.metric==='chain'?r.bestChain:m.metric==='score'?r.score:m.metric==='popped'?r.popped:(v[m.metric]||0);
 p.values[m.id]=['chain','score'].includes(m.metric)?Math.max(p.values[m.id]||0,amount):(p.values[m.id]||0)+amount;
 if(p.values[m.id]>=m.target){earned.mission=true;earned.coins+=m.reward;p.values[m.id]=0;p.completed[m.id]=(p.completed[m.id]||0)+1;
  earned.stars=m.stars;p.stars+=m.stars;
  p.mission=nextMission(catalog,p);
  const lap=Math.min(...catalog.missions.map(m=>p.completed[m.id]||0));
  if(lap>previousLap){earned.chapter=lap;earned.coins+=catalog.chapterReward.coins;earned.stars+=catalog.chapterReward.stars;p.stars+=catalog.chapterReward.stars;}
 }
 if(earned.levelUp)earned.coins+=50*earned.level;
 profile.coins+=earned.coins;
 return earned;
}
export function challengeCode(seed,index){seed=integer(seed,4294967295)||1;return `PP1-${seed}-${index}-${(seed%997+index*31+73)%997}`;}
export function parseChallenge(input,count){const s=String(input).trim().toUpperCase();if(!/^PP1-[0-9]{1,10}-[0-9]{1,3}-[0-9]{1,3}$/.test(s))return null;const [,a,b]=s.split('-'),seed=Number(a),index=Number(b);if(!seed||seed>4294967295||index>=count||challengeCode(seed,index)!==s)return null;return {seed,index,code:s};}
