// Rendering changes with available space and input capabilities, never the game world.
export function chooseLayout({width,height,fine,hover}){
 const wide=fine&&hover&&width>=960&&height>=520&&width/height>=1.25;
 return {wide,width:wide?1200:540,height:wide?800:960,pageSize:wide?12:9,
  board:wide?{x:330,y:-74}:{x:0,y:0},input:fine&&hover?'mouse':'touch'};
}
export function boardPoint(layout,point){return{x:point.x-layout.board.x,y:point.y-layout.board.y};}
export function screenPoint(layout,point){return{x:point.x+layout.board.x,y:point.y+layout.board.y};}
export function rewardTarget(layout,kind){
 const compact={time:[64,65],coin:[230,95],score:[270,49],skill:[72,885],fever:[270,887]};
 const wide={time:[160,216],coin:[132,469],score:[160,365],skill:[1040,260],fever:[160,610]};
 const [x,y]=(layout.wide?wide:compact)[kind];return boardPoint(layout,{x,y});
}
export function inputHint({input,appleTouch=false,installed=false}){
 if(input==='mouse')return 'Mouse + keyboard: H hint / S shuffle / B super';
 return appleTouch&&!installed?'Share > Add to Home Screen':'Touch and drag through matching plushies';
}
