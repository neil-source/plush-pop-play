// Reading-based adult task; no arithmetic, never saved or sent to a server.
export class AdultGate {
 static choices=['sun','heart','star','flower','gift','clock'];
 constructor(sequence){
  const choices=[...AdultGate.choices];
  for(let i=choices.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[choices[i],choices[j]]=[choices[j],choices[i]];}
  this.sequence=sequence?[...sequence]:choices.slice(0,3);this.input=[];
 }
 get question(){return `Tap ${this.sequence.join(', then ')}.`;}
 get correct(){return this.input.length===this.sequence.length&&this.input.every((x,i)=>x===this.sequence[i]);}
 select(value){if(this.correct||!AdultGate.choices.includes(value)||value!==this.sequence[this.input.length]){this.input=[];return false;}this.input.push(value);return true;}
}
