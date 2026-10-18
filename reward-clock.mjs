// Presentation holds never mutate the saved game model or depend on live particles.
export class RewardClock{
 constructor(){this.reset();}
 reset(){this.time=0;this.holds=[];}
 advance(dt){this.time+=Math.max(0,dt);this.holds=this.holds.filter(h=>h.until>this.time);}
 hold(key,amount,delay){if(amount>0&&delay>0)this.holds.push({key,amount,until:this.time+delay});}
 clear(key){this.holds=this.holds.filter(h=>h.key!==key);}
 pending(key){return this.holds.filter(h=>h.key===key).reduce((s,h)=>s+h.amount,0);}
 delay(key){return Math.max(0,...this.holds.filter(h=>h.key===key).map(h=>h.until-this.time));}
 value(key,total){return Math.max(0,total-this.pending(key));}
}
