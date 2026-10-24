// Pure, portable progression rules. Round rewards are committed exactly once by Game.finish.
const integer=(n,max=1e9)=>Math.max(0,Math.min(max,Math.trunc(Number(n)||0)));
export function progress(raw={}){
 // Old completion counts are read only for the one-time currency migration.
 const {mission,values,...saved}=raw;
 const p={completed:{},friends:{},decor:[],shelf:[],boosts:[],learned:false,...saved};
 p.completed=Object.fromEntries(Object.entries(p.completed||{}).slice(0,30).map(([k,v])=>[k,integer(v)]));
 p.friends=Object.fromEntries(Object.entries(p.friends||{}).slice(0,140).map(([k,v])=>[k,{xp:integer(v.xp),best:integer(v.best),rounds:integer(v.rounds),badge:!!v.badge,supers:integer(v.supers),fevers:integer(v.fevers),powerLevel:Math.max(1,integer(v.powerLevel||1,5))}]));
 for(const k of ['decor','shelf','boosts'])p[k]=[...new Set(Array.isArray(p[k])?p[k].filter(x=>typeof x==='string'):[])].slice(0,k==='shelf'?3:20);
 p.stars=integer(p.stars);return p;
}
export function migrateUpgrades(catalog,profile){const p=profile.progress;if(p.upgradeVersion===1)return false;
 p.stars+=Object.entries(catalog.legacyRewardStars).reduce((n,[id,stars])=>n+(p.completed[id]||0)*stars,0);
 profile.coins+=catalog.decorations.filter(d=>p.decor.includes(d.id)).reduce((n,d)=>n+d.cost,0);
 p.decor=[];p.shelf=[];p.upgradeVersion=1;return true;
}
export function powerLevel(p,id){return Math.max(1,Math.min(5,p.friends[id]?.powerLevel||1));}
export function level(catalog,xp){return Math.max(0,catalog.friendship.filter(t=>xp>=t).length-1);}
export function metrics(){return {supers:0,fevers:0,bubbles:0,leaders:0};}
export function award(catalog,profile,r){
 const p=profile.progress=progress(profile.progress),v=r.metrics||{},before=p.friends[r.hero]||{xp:0,best:0,rounds:0,badge:false};
 const xp=20+Math.min(80,Math.floor(r.popped/5))+Math.min(40,(v.supers||0)*10),oldLevel=level(catalog,before.xp);
 const friend={powerLevel:before.powerLevel||1,xp:before.xp+xp,best:Math.max(before.best,r.score),rounds:before.rounds+1,badge:before.badge||r.bestChain>=10,supers:(before.supers||0)+(v.supers||0),fevers:(before.fevers||0)+(v.fevers||0)};p.friends[r.hero]=friend;
 const earned={xp,level:level(catalog,friend.xp),levelUp:false,coins:0,stars:r.popped>0?catalog.roundStars:0,record:r.score>before.best,badge:!before.badge&&friend.badge||((before.supers||0)<3&&friend.supers>=3)||((before.fevers||0)<3&&friend.fevers>=3)};earned.levelUp=earned.level>oldLevel;
 p.stars+=earned.stars;
 if(earned.levelUp)earned.coins+=50*earned.level;
 profile.coins+=earned.coins;
 return earned;
}
export function challengeCode(seed,index){seed=integer(seed,4294967295)||1;return `PP1-${seed}-${index}-${(seed%997+index*31+73)%997}`;}
export function parseChallenge(input,count){const s=String(input).trim().toUpperCase();if(!/^PP1-[0-9]{1,10}-[0-9]{1,3}-[0-9]{1,3}$/.test(s))return null;const [,a,b]=s.split('-'),seed=Number(a),index=Number(b);if(!seed||seed>4294967295||index>=count||challengeCode(seed,index)!==s)return null;return {seed,index,code:s};}

// Preview access never becomes earned ownership. Credit old completed rounds once.
export function migrateCharacters(data,profile){
 const p=profile.progress,valid=data.characters.map(c=>c.id).filter(id=>!data.catalog.freeCharacters.includes(id));
 const previous=p.earnedCharacters,rounds=Math.min(135,Object.values(p.friends).reduce((n,f)=>n+Math.min(135,f.rounds||0),0));
 p.earnedCharacters=[...new Set((Array.isArray(previous)?previous:valid.slice(0,rounds)).filter(id=>valid.includes(id)))];
 return JSON.stringify(previous)!==JSON.stringify(p.earnedCharacters);
}
