// The wide view uses the same artwork and game model as the touch view.
export function drawDesktop(api){
 const {ctx,art,game,data,screen,image,label,button,meter,portrait,go,start,resume,pause,showSettings,
  drawBodies,drawFeverLights,fx,uiTime,resultAt,collectionPage,turnPage,chooseHero,card,powerText,input}=api;
 const r=game.round,playing=screen==='play'||screen==='paused';
 image('menu_background',600,400,1200,800);
 const footer=()=>!game.practice&&label(input==='touch'?'Touch and drag to connect 3+ matching plushies':'Drag with your mouse  /  H Hint  /  S Shuffle  /  B Super  /  Esc Pause',600,772,16,1080);
 const back=()=>button('back','Back',1060,64,176,62,()=>go('menu'),{color:'purple'});
 const header=title=>{label(title,420,69,42,710);back();};
 if(playing){
  // Crop only the unused mobile HUD area; circles, artwork, bowl and physics stay 1:1.
  ctx.save();ctx.beginPath();ctx.roundRect(330,72,540,680,20);ctx.clip();ctx.translate(330,-74);
  art.stage(ctx,fx.fever,uiTime,game.profile.motion);drawBodies();drawFeverLights();ctx.restore();
  if(game.has('stop')){ctx.fillStyle='#00000024';ctx.fillRect(0,0,1200,800);}
  label('Plush Pop',160,65,34,260);
  image('panel_blue',160,425,278,628);image('panel_blue',1040,425,278,628);
  label('TIME',160,145,19,240);image('timer_face',160,216,109);label(Math.max(0,Math.ceil(r.timer)),160,216,45,180);
  label('SCORE',160,314,19);image('score_pill',160,365,245,68);label(fx.value('score'),160,365,33,220);
  label('COINS',160,426,18);image('coin_pill',160,469,218,54);image('icon_coin',132,469,31);label(fx.value('coins'),182,469,27,116,{scaleX:fx.pulse('coin'),scaleY:fx.pulse('coin')});
  if(r.combo>1&&game.comboActive())label(r.combo+' COMBO',160,536,23,235);
  meter('meter_gold',fx.fever?r.feverLeft/8:fx.feverCharge,160,610,233,46);label(fx.fever?'FEVER x3':'FEVER',160,610,23,215);
  if(fx.fever){label('FEVER BONUS',160,669,17,240);label(fx.rewards.value('score',r.feverScore),160,703,27,240);}
  label('YOUR LEADER',1040,153,20,245);if(fx.value('skill')>=game.skillGoal)image('fx_rays',1040,260,205,205,{alpha:game.profile.motion?.45+Math.sin(uiTime*3)*.2:.5});image('char_'+r.hero,1040,260,158,158);
  label(game.powers[r.hero].name,1040,369,24,244);meter('meter_gold',fx.value('skill')/game.skillGoal,1040,414,222,21);
  button('skill',fx.value('skill')>=game.skillGoal?'Use super':'Charging '+Math.floor(fx.value('skill'))+'/'+game.skillGoal,1040,476,224,66,()=>game.useSkill(),{color:fx.value('skill')>=game.skillGoal?'gold':'purple',disabled:!game.canAct||fx.value('skill')<game.skillGoal,size:23});
  button('hint','Hint',1040,570,224,65,()=>game.hint(),{disabled:!game.canAct,color:'green'});
  button('shuffle',r.shuffleCooldown>0?'Shuffle '+Math.ceil(r.shuffleCooldown):'Shuffle',1040,660,224,65,()=>game.shuffle(),{color:'gold',disabled:!game.canAct||r.shuffleCooldown>0});
  button('pause','Pause',1090,58,160,61,pause,{color:'gold'});
  if(r.power&&!r.power.pending){const seconds=Math.ceil(Math.max(...Object.values(r.power.timers)));label(game.powers[r.hero].name+' '+seconds+'s',600,45,21,530);}
  else label(input==='touch'?'Connect 3+ matching plushies':'Click, hold and connect matching plushies',600,45,20,550);
  footer();
  ctx.save();ctx.translate(330,-74);fx.draw(ctx);ctx.restore();
  if(screen==='paused'){
   ctx.fillStyle='#082e34bb';ctx.fillRect(0,0,1200,800);image('panel_blue',600,408,480,620);label('PAUSED',600,173,47);
   button('resume','Resume',600,284,340,78,resume,{color:'green',size:30});button('new','New round',600,390,340,70,start,{color:'purple'});
   button('settings','Settings',600,488,340,70,showSettings,{color:'purple'});button('home','Home',600,586,340,70,()=>go('menu'));label('Your round is saved.',600,677,21);
   // Only overlay controls should receive clicks while paused.
   api.keepControls(['resume','new','settings','home']);return;
  }
  if(r.ready>0){label('READY',600,290,45);label('Connect '+game.minimumChain+' matching plushies',600,338,21,490);}
  else if(r.elapsed<.65&&!r.popped&&game.superLeft<=0)label('GO!',600,310,58);
  if(fx.super){const t=fx.time-fx.super.start,fade=Math.min(1,t/.3,(fx.super.duration-t)/.15);ctx.fillStyle='rgba(0,0,0,'+Math.max(0,.32*fade)+')';ctx.fillRect(0,0,1200,800);ctx.save();ctx.translate(330,-74);fx.drawSuper(ctx);ctx.restore();}
  ctx.save();ctx.translate(330,-74);fx.draw(ctx,{afterShade:true});ctx.restore();
  if(fx.super){image('button_gold_wide',1090,58,160,61);label('Pause',1090,58,25,136);}return;
 }
 if(screen==='menu'){
  button('settings','Settings',1100,62,68,68,showSettings,{color:'gold',icon:'gear'});
  label('Plush Pop',365,125,77,620);image('char_'+game.profile.hero,365,363,300,300);
  game.allowed.filter(id=>id!==game.profile.hero).slice(0,3).forEach((id,i)=>image('char_'+id,165+i*200,610,143,143));
  image('panel_blue',910,417,442,574);
  label('LET\'S PLAY!',910,209,38,380);label(game.profile.coins+' coins',910,272,24,365);label('BEST '+game.profile.best,910,324,25,370);
  const pending=r&&!game.finished;button(pending?'resume':'play',pending?'Resume round':'Play',910,427,370,100,pending?resume:start,{color:'green',size:37});
  button('collection','Collection',910,552,370,74,()=>go('collection'),{color:'purple',size:29});button('boosts','Boosts',910,650,370,69,()=>go('boosts'),{color:'purple'});
  label(game.previewCharacters?'All 140 characters unlocked for preview':'Pick your favorite plushie and play',365,715,21,620);footer();return;
 }
 if(screen==='collection'){
  header('YOUR PLUSHIES');label(game.previewCharacters?'All 140 unlocked for preview':'Pick your leader',420,116,20,740);
  game.allowed.slice(collectionPage*12,(collectionPage+1)*12).forEach((id,i)=>{
   const x=130+i%4*196,y=223+Math.floor(i/4)*165,selected=game.profile.hero===id,name=data.characters.find(c=>c.id===id).name;
   image(selected?'card_cream':'card_blue',x,y,180,151);image('char_'+id,x,y-22,94,94);label(name,x,y+35,19,162);label(selected?'SELECTED':'Choose',x,y+62,14,160);
   card(id,name,x,y,180,151,selected,()=>chooseHero(id));
  });
  const pages=Math.ceil(game.allowed.length/12);button('previous','Previous page',110,678,90,60,()=>turnPage(-1),{disabled:collectionPage===0,icon:'back'});label('PAGE '+(collectionPage+1)+' / '+pages,425,678,22,380);button('next','Next page',738,678,90,60,()=>turnPage(1),{disabled:collectionPage===pages-1,icon:'play'});
  image('panel_blue',1010,415,300,536);image('char_'+game.profile.hero,1010,297,206,206);label(data.characters.find(c=>c.id===game.profile.hero).name,1010,439,27,260);label(game.powers[game.profile.hero].name,1010,492,23,260);
  // Short lines keep powers readable beside the larger collection.
  game.powers[game.profile.hero].steps.slice(0,3).forEach((step,i)=>label(powerText(step),1010,540+i*34,17,256));footer();return;
 }
 if(screen==='boosts'){
  header('BOOSTS');label(game.profile.coins+' coins',600,152,30);
  [['time','5 extra seconds',40],['score','15% more points',60],['skill','Start with a full skill',80]].forEach(([id,title,cost],i)=>{
   const x=225+i*375;image('panel_blue',x,417,338,394);image('icon_'+({time:'clock',score:'trophy',skill:'star'})[id],x,303,83);label(title,x,407,26,302);label('Owned: '+(game.profile.boosts[id]||0),x,458,21,280);button('use-'+id,game.profile.progress.boosts.includes(id)?'Selected':'Select',x,503,230,42,()=>game.toggleBoost(id),{color:game.profile.progress.boosts.includes(id)?'green':'blue',size:20});
   button('buy-'+id,cost+' coins',x,573,270,62,()=>{if(game.buyBoost(id))api.purchaseFeedback();},{disabled:game.profile.coins<cost,color:'gold',size:27});
  });label('Only selected boosts are used next round.',600,694,23,1050);footer();return;
 }
 if(screen==='settings'){
  header('SETTINGS');api.replaceBack();image('char_'+game.profile.hero,310,385,290,290);label(input==='touch'?'Touch and drag to play':'Click and drag to play',310,581,26,490);
  [['sound','Sound effects'],['music','Music'],['motion','Animations']].forEach(([key,title],i)=>button(key,title+': '+(game.profile[key]?'On':'Off'),865,235+i*111,430,82,()=>api.toggleSetting(key),{color:game.profile[key]?'green':'purple',size:29}));
  button('layout','Layout: '+(game.profile.layout==='classic'?'Original app':'Automatic'),865,568,430,82,api.toggleLayout,{color:'purple',size:25});
  label('Turning animations off reduces motion.',865,688,20,470);if(game.previewCharacters)label('All characters unlocked for preview',310,669,17,490);footer();return;
 }
 if(screen==='results'){
  label('TIME UP!',355,105,53,590);image('icon_trophy',355,277,190);label(game.newBest?'NEW BEST!':'NICE PLAY!',355,418,34,530);
  const t=game.profile.motion?Math.min(1,(fx.time-resultAt)/.85):1;label(Math.round(r.score*t),355,502,67,570);label('POINTS',355,565,23);
  image('panel_blue',930,367,420,472);label('+'+r.coins+' coins',930,229,36,365);label('Best chain '+r.bestChain,930,326,27,365);label('Plushies popped '+r.popped,930,402,27,365);
  button('again','Play again',930,523,350,86,start,{color:'green',size:31});button('home','Home',930,674,285,73,()=>go('menu'),{color:'purple'});footer();
 }
}
