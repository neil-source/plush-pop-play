// Local adult task; never saved, never sent to a server.
export class AdultGate {
 constructor(first=12+Math.floor(Math.random()*28),second=12+Math.floor(Math.random()*28)){this.first=first;this.second=second;this.input='';}
 get question(){return `${this.first} + ${this.second} = ?`;}
 get correct(){return this.input!==''&&Number(this.input)===this.first+this.second;}
 digit(value){if(Number.isInteger(value)&&value>=0&&value<=9&&this.input.length<3)this.input+=String(value);}
}
