import {createCanvas,loadImage,GlobalFonts} from '@napi-rs/canvas';
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {spawn} from 'node:child_process';import {once} from 'node:events';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const CACHE=process.env.FRAME_CACHE||path.join(ROOT,'.cache/frames');
const meta=JSON.parse(fs.readFileSync(path.join(CACHE,'meta.json')));
const timeline=JSON.parse(fs.readFileSync(path.join(ROOT,'src/timeline.json')));const D=timeline.duration;
for(const [file,name] of [['Anton-Regular.ttf','Anton'],['BarlowCondensed-Bold.ttf','BarlowBold'],['BarlowCondensed-Regular.ttf','Barlow']])GlobalFonts.registerFromPath(path.join(ROOT,'assets/fonts',file),name);
const W=1080,H=1920,c=createCanvas(W,H),ctx=c.getContext('2d'),layer=createCanvas(W,H),lc=layer.getContext('2d');
const portrait=await loadImage(path.join(ROOT,'assets/images/recorte.png')),bible=await loadImage(path.join(ROOT,'assets/images/biblia.png'));
const C={ink:'#0B1A1F',teal:'#0E3C43',paper:'#F4EDE0',lime:'#D7F312',gray:'#C6C9CC'};
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));const ease=x=>1-(1-clamp(x))**4;const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};const lerp=(a,b,p)=>a+(b-a)*p;const hash=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x)};
const grain=createCanvas(540,960),gc=grain.getContext('2d');let gd=gc.createImageData(540,960);for(let i=0;i<gd.data.length;i+=4){const v=Math.floor(hash(i)*255);gd.data[i]=gd.data[i+1]=gd.data[i+2]=v;gd.data[i+3]=18;}gc.putImageData(gd,0,0);
let vids={},vidCache=new Map();
async function footage(t){
 const needed=t<4.3?['multidao']:t<5.3?['estudos']:t<6.2?['trabalho']:t<7.75?['cansaco']:t<11.94?['trabalho']:t<14.572?[]:t<17.922?['cidade']:t<23.85?['cidade','montanhas','multidao']:t<26.73?['paginas']:t<29.1?[]:t<32.35?['cansaco','multidao','cidade']:t<35.096?['noite']:t<38.48?['cidade','estudos','multidao','montanhas','amigos']:t<41.12?['montanhas']:t<46.87?['cidade']:t<49.548?['montanhas']:t<56.388?['louvor','amigos','paginas']:t<58.3?[]:t<61.164?['amigos']:['cidade','montanhas'];
 const requests=needed.map(async name=>{let local=t;
  if(name==='montanhas'&&t>=61.164)local=t-61.164;if(name==='paginas')local=t*.72;if(name==='amigos')local=(t-49)*.75;if(name==='cidade')local=t*.7;if(name==='cansaco')local=4+(t%2);if(name==='louvor')local=3+(t-49.548)*.5;
  let idx=((Math.floor(local*30)%meta[name].frames)+meta[name].frames)%meta[name].frames+1;let key=name+'/'+idx;
  if(!vidCache.has(key))vidCache.set(key,await loadImage(path.join(CACHE,name,String(idx).padStart(5,'0')+'.jpg')));
  vids[name]=vidCache.get(key);
 });await Promise.all(requests);if(vidCache.size>45){const keep=new Set(Object.values(vids));for(const [k,v] of vidCache)if(!keep.has(v))vidCache.delete(k);}
}
function bg(col=C.ink){ctx.fillStyle=col;ctx.fillRect(0,0,W,H)}
function rect(x,y,w,h,col){ctx.fillStyle=col;ctx.fillRect(x,y,w,h)}
function line(x1,y1,x2,y2,col=C.lime,width=2){ctx.strokeStyle=col;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()}
function text(s,x,y,size=100,col=C.paper,opts={}){ctx.save();ctx.font=`${size}px ${opts.font||'Anton'}`;ctx.textBaseline='middle';ctx.textAlign=opts.align||'left';ctx.fillStyle=col;if(opts.stroke){ctx.strokeStyle=col;ctx.lineWidth=opts.stroke;ctx.strokeText(s,x,y,opts.max||2000)}else ctx.fillText(s,x,y,opts.max||2000);ctx.restore()}
function fitted(s,x,y,width,size=180,col=C.paper,opts={}){ctx.save();ctx.font=`${size}px ${opts.font||'Anton'}`;const m=ctx.measureText(s).width;ctx.translate(x,y);ctx.scale(width/m,1);text(s,0,0,size,col,opts);ctx.restore()}
function cover(img,x=0,y=0,w=W,h=H,zoom=1,px=.5,py=.5,target=ctx){const scale=Math.max(w/img.width,h/img.height)*zoom;const iw=img.width*scale,ih=img.height*scale;target.save();target.beginPath();target.rect(x,y,w,h);target.clip();target.drawImage(img,x+(w-iw)*px,y+(h-ih)*py,iw,ih);target.restore()}
function film(name,x=0,y=0,w=W,h=H,opt={}){cover(vids[name],x,y,w,h,opt.zoom||1,opt.px??.5,opt.py??.5);ctx.save();ctx.globalCompositeOperation='multiply';rect(x,y,w,h,opt.tint||'#a4bdb5');ctx.restore();if(opt.dark)rect(x,y,w,h,`rgba(5,20,25,${opt.dark})`)}
function gradient(){const g=ctx.createLinearGradient(0,250,0,H);g.addColorStop(0,'rgba(3,13,18,.1)');g.addColorStop(.55,'rgba(3,13,18,0)');g.addColorStop(1,'rgba(3,13,18,.9)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H)}
function paperPath(w,h,seed=0){ctx.beginPath();ctx.moveTo(0,0);for(let x=0;x<=w;x+=18)ctx.lineTo(x,(hash(x+seed)-.5)*13);ctx.lineTo(w,0);for(let y=0;y<=h;y+=22)ctx.lineTo(w+(hash(y+seed+9)-.5)*12,y);ctx.lineTo(w,h);for(let x=w;x>=0;x-=18)ctx.lineTo(x,h+(hash(x+seed+44)-.5)*17);ctx.lineTo(0,h);for(let y=h;y>=0;y-=22)ctx.lineTo((hash(y+seed+88)-.5)*12,y);ctx.closePath()}
function paper(x,y,w,h,col=C.paper,angle=0,seed=0){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.shadowColor='#00000066';ctx.shadowBlur=20;ctx.shadowOffsetY=12;paperPath(w,h,seed);ctx.fillStyle=col;ctx.fill();ctx.restore()}
function panel(name,x,y,w,h,rot=0,seed=0){ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.shadowColor='#0008';ctx.shadowBlur=30;ctx.shadowOffsetY=20;paperPath(w,h,seed);ctx.fillStyle=C.paper;ctx.fill();ctx.shadowColor='transparent';ctx.save();paperPath(w,h,seed);ctx.clip();film(name,0,0,w,h);ctx.restore();ctx.restore()}
function cross(x,y,col=C.paper){line(x-10,y,x+10,y,col,1);line(x,y-10,x,y+10,col,1)}
function grid(t,col='#f4ede022'){ctx.save();ctx.strokeStyle=col;ctx.lineWidth=1;for(let x=-100;x<1200;x+=120){ctx.beginPath();ctx.moveTo(x+t*7%120,0);ctx.lineTo(x+t*7%120,H);ctx.stroke()}for(let y=-100;y<2000;y+=120){ctx.beginPath();ctx.moveTo(0,y+t*4%120);ctx.lineTo(W,y+t*4%120);ctx.stroke()}ctx.restore()}
function chrome(t,section,light=false){let color=light?C.ink:C.paper;text('ÁGAPE TEEN',70,105,27,color,{font:'BarlowBold'});text('08—14 NOV / 2026',1010,105,27,color,{font:'Barlow',align:'right'});line(70,145,1010,145,light?'#0b1a1f55':'#f4ede055',1);text(section,70,1770,22,color,{font:'Barlow'});for(let i=0;i<7;i++)rect(866+i*22,1760,12,12,i<Math.ceil(t/D*7)?C.lime:light?'#0b1a1f33':'#f4ede033');cross(70,1630,color);cross(1010,1630,color)}
function dust(t){ctx.save();for(let i=0;i<65;i++){let x=hash(i+7)*W+Math.sin(t*.2+i)*20,y=(hash(i+400)*H-t*(7+hash(i)*15)+H*2)%H;ctx.globalAlpha=.08+hash(i+28)*.25;ctx.fillStyle=C.paper;ctx.beginPath();ctx.arc(x,y,hash(i+99)*2+.4,0,7);ctx.fill()}ctx.restore()}
function portraitAt(x,y,w,h,alpha=1){ctx.save();ctx.globalAlpha=alpha;ctx.drawImage(portrait,x,y,w,h);ctx.restore()}
function exposure(name,x,y,w,h){lc.clearRect(0,0,W,H);cover(vids[name],x,y,w,h,1,.5,.5,lc);lc.globalCompositeOperation='destination-in';lc.drawImage(portrait,x,y,w,h);lc.globalCompositeOperation='source-over';ctx.drawImage(layer,0,0)}
function tape(s,x,y,width,angle=0,col=C.lime,size=110){ctx.save();ctx.translate(x,y);ctx.rotate(angle);paper(0,0,width,size*1.35,col,0,Math.floor(y));fitted(s,25,size*.67,width-50,size,C.ink);ctx.restore()}
function title(y,t,scale=1){ctx.save();ctx.translate(540,y);ctx.scale(scale,scale);ctx.rotate(-.025);fitted('VERDADE',-460,-80,920,187);paper(-475,40,950,213,C.lime,0,24);fitted('DESAFIO',-445,147,900,195,C.ink);text('E',-3,29,44,C.paper,{align:'center',font:'BarlowBold'});ctx.restore()}
function quoteLines(lines,start,t,x=85,y=600,size=145,col=C.paper){for(let i=0;i<lines.length;i++){const p=ease((t-start-i*.14)/.5);ctx.save();ctx.beginPath();ctx.rect(x-5,y+i*size*1.08-size*.58,940,size*1.1);ctx.clip();text(lines[i],x+(1-p)*120,y+i*size*1.08+(1-p)*size,size,col);ctx.restore()}}
function endPoster(t){const u=t-61.16;bg(C.teal);film('montanhas',0,250,W,1400,{dark:.23});grid(t,'#f4ede018');
 const x=lerp(-420,185,ease(u/1.1)),yy=lerp(2100,350,ease((u-.18)/1.05));portraitAt(x,yy,740,1315);
 const bandY=yy+294;ctx.save();ctx.translate(0,bandY);ctx.rotate(-.035);film('cidade',-90,0,1260,148);rect(-90,0,1260,148,'#0e3c4344');line(0,148,1080,148,C.lime,3);ctx.restore();
 const yyTitle=lerp(1800,1135,ease((u-.45)/.9));title(yyTitle,t,.92);
 text('SEMANA DE ORAÇÃO JOVEM 2026',540,225,37,C.paper,{align:'center',font:'BarlowBold'});
 text('MINISTÉRIO JOVEM ÁGAPE TEEN',540,284,29,C.paper,{align:'center',font:'Barlow'});
 if(u>2.2){const q=ease((u-2.2)/.5);ctx.globalAlpha=q;text('Conhecer a Palavra.',540,1450,51,C.paper,{align:'center',font:'BarlowBold'});text('Viver a verdade.',540,1510,51,C.paper,{align:'center',font:'BarlowBold'});ctx.globalAlpha=1;}
 paper(110,1610,860,100,C.lime,0,31);text('8 A 14 DE NOVEMBRO',540,1660,53,C.ink,{align:'center',font:'BarlowBold'});
 text('Os desafios do jovem cristão contemporâneo.',540,1800,31,C.paper,{align:'center',font:'Barlow'});
 if(u>6.6){const p=ease((u-6.6)/.4);ctx.save();ctx.translate(540,430);ctx.rotate(.05);ctx.scale(p,p);paper(-230,-44,460,88,C.paper);text('A GENTE TE ESPERA LÁ!',0,0,37,C.ink,{align:'center',font:'BarlowBold'});ctx.restore()}
 dust(t);
}
function draw(t){ctx.resetTransform();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';bg();
 if(t<3.206){
  film('multidao',0,0,W,H,{dark:.63});grid(t);const z=1+.018*t;
  text('TODO DIA É UM NOVO',540,560,52,C.paper,{align:'center',font:'BarlowBold'});
  const p=ease((t-.12)/.6),shoot=smooth((t-2.48)/.7);ctx.save();ctx.translate(540,960);ctx.scale(z+shoot*3.5,z+shoot*3.5);ctx.rotate(-.035+shoot*.1);
  for(let i=0;i<7;i++){ctx.save();ctx.beginPath();ctx.rect(-600,-230+i*64,1200,65);ctx.clip();let offset=(1-p)*(i%2?900:-900)+(t<.3?Math.sin(t*110+i)*20:0);fitted('DESAFIO',-480+offset,0,960,280,C.paper);ctx.restore()}
  if(t>1.5){let a=ease((t-1.5)/.16);rect(-480,190,960*a,15,C.lime)}ctx.restore();text('CONHECER.  VIVER.',540,1450,30,C.lime,{align:'center',font:'Barlow'});chrome(t,'01 / TODO DIA');
 }else if(t<7.75){
  let j=t<4.3?0:t<5.3?1:t<6.2?2:3;const starts=[3.206,4.3,5.3,6.2],names=['multidao','estudos','trabalho','cansaco'],words=['CORRERIA','ESTUDOS','TRABALHO','CANSAÇO'];let u=t-starts[j];
  bg(j===1?C.paper:C.ink);if(j===0){film(names[j],-70+ease(u/.3)*70,0,W,H,{dark:.2});for(let k=0;k<3;k++){ctx.globalAlpha=.12;film('multidao',k*360,370,340,900);ctx.globalAlpha=1}tape(words[j],55,1100,970,-.07,C.lime,157)}
  if(j===1){grid(t,'#0b1a1f22');panel('estudos',80,310,890,1000,-.045);tape(words[j],100,1250,870,.03,C.ink,150);text('ESTUDOS',540,1350,150,C.paper,{align:'center'});line(100,1470,100+850*ease(u/.55),1470,C.teal,9)}
  if(j===2){film('trabalho',0,0,W,H,{dark:.2});for(let k=0;k<4;k++){ctx.globalAlpha=.12;text('TRABALHO',55,650+k*215,156,C.paper);ctx.globalAlpha=1}text(words[j].slice(0,Math.ceil(u*22)),55,1040,156,C.lime);rect(950,962,14,157,C.lime)}
  if(j===3){film('cansaco',0,-35+Math.sin(u)*15,W,H+70,{dark:.22});const fall=ease(u/.65);ctx.save();ctx.translate(65,1110+fall*180);ctx.rotate(.05*fall);fitted(words[j],0,0,950,190);ctx.restore();line(70,1530,1010,1530,C.paper,1)}
  chrome(t,`02 / ${words[j]}`,j===1);
 }else if(t<11.94){
  film('trabalho',0,0,W,H,{dark:.55});grid(t);let u=t-7.75;
  const phrases=['TRABALHO','PRAZO','ESTUDOS','MENSAGENS','ESCOLHAS','COMPROMISSOS','NOTIFICAÇÕES'];
  for(let i=0;i<10;i++){let age=u-i*.16;let p=ease(age/.6);ctx.save();ctx.translate(540+Math.sin(i*2.1+u*.4)*270*p,500+i*106);ctx.rotate((i%2?1:-1)*(.08+u*.01));ctx.scale(p,p);paper(-390,-63,780,126,i%3===0?C.lime:C.paper,0,i*41);text(phrases[i%phrases.length],-350,0,57,C.ink,{font:'BarlowBold'});text(String(12+i*7),350,0,36,C.ink,{align:'right',font:'Barlow'});ctx.restore()}
  rect(0,700,W,340,'#0b1a1fbb');quoteLines(['TANTAS COISAS'],7.9,t,70,860,125);chrome(t,'03 / TUDO AO MESMO TEMPO');
 }else if(t<14.572){
  const u=t-11.94;bg(C.ink);grid(t,'#f4ede010');const radius=360*(1+smooth(u/2)*.3);ctx.save();ctx.translate(540,855);ctx.strokeStyle='#f4ede033';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,radius,0,7);ctx.stroke();for(let i=0;i<60;i++){let a=i*Math.PI/30;line(Math.sin(a)*(radius-16),Math.cos(a)*(radius-16),Math.sin(a)*radius,Math.cos(a)*radius,i%5? '#f4ede033':C.lime,i%5?1:4)}const theta=u<.6?u*14:8.4;line(0,0,Math.sin(theta)*260,-Math.cos(theta)*260,C.lime,5);ctx.restore();
  text('PARECE IMPOSSÍVEL',540,435,40,C.paper,{align:'center',font:'Barlow'});
  const chars='TEMPO';for(let i=0;i<5;i++){let fly=smooth((u-1.25)/1.3);ctx.save();ctx.translate(130+i*171+(i-2)*fly*130,920+Math.sin(i*2)*fly*320);ctx.rotate((i-2)*fly*.3);ctx.globalAlpha=1-fly*.7;text(chars[i],0,0,230,C.paper);ctx.restore()}text('PRA TUDO.',540,1420,66,C.lime,{align:'center',font:'BarlowBold'});chrome(t,'04 / TEMPO');
 }else if(t<17.922){
  const u=t-14.572;film('cidade',0,0,W,H,{dark:.53,zoom:1.15-u*.025});grid(t,'#f4ede014');portraitAt(438,1100+u*10,205,365);line(540,430,540,1080,'#d7f31277',1);text('MAS EXISTE UM',540,520,41,C.paper,{align:'center',font:'Barlow'});quoteLines(['DESAFIO','AINDA MAIOR.'],15.1,t,100,715,145);chrome(t,'05 / ALÉM DA ROTINA');
 }else if(t<23.85){
  const u=t-17.922;bg(C.paper);grid(t,'#0e3c4322');film('montanhas',0,820,W,900,{dark:.15});
  let px=80+Math.sin(u*.25)*15,py=200+ease(u/.7)*60;portraitAt(px,py,940,1670);
  if(u>2.65){ctx.save();ctx.globalAlpha=.88*smooth((u-2.65)/.5);exposure('cidade',px,py,940,1670);ctx.restore()}
  const b=py+363;ctx.save();ctx.translate(-70,b);ctx.rotate(-.04);film('multidao',0,0,1220,180,{zoom:1.2});for(let i=0;i<5;i++){let yy=i*35;ctx.globalAlpha=.15;film('cidade',Math.sin(t*3+i)*20,yy,1220,15);ctx.globalAlpha=1}rect(0,174,1220,6,C.lime);ctx.restore();
  tape('SER JOVEM',66,1120,780,-.04,C.paper,145);tape('CRISTÃO',222,1340,790,.025,C.lime,162);
  if(u>2.7){for(let i=0;i<4;i++){const x=((t*230+i*330)%1400)-160;line(x,1050,x+130,1050,C.paper,5);line(x+130,1050,x+95,1025,C.paper,5)}}chrome(t,'06 / FÉ NO PRESENTE',true);
 }else if(t<26.73){
  let u=t-23.85;cover(bible,0,0,W,H,1.03+u*.015);dust(t);ctx.save();ctx.globalAlpha=.22;film('paginas',0,1030,W,400);ctx.restore();quoteLines(['CONHECER','A VERDADE.'],23.97,t,85,480,143);line(88,770,88+900*ease(u/1.4),770,C.lime,5);chrome(t,'07 / A PALAVRA');
 }else if(t<29.1){
  let u=t-26.73;bg(C.paper);grid(t,'#0b1a1f18');for(let i=7;i>=0;i--){ctx.save();ctx.translate(540,900);let z=1-i*.075+u*.04;ctx.scale(z,z);fitted('VERDADE',-490,0,980,210,i===0?C.teal:'#0e3c4320',{stroke:i===0?0:2});ctx.restore()}
  let p=ease((u-.65)/.5);ctx.save();ctx.translate(70+(1-p)*1200,1070);ctx.rotate(-.07);paper(0,0,940,250,C.lime);text('VIVER',470,125,205,C.ink,{align:'center'});ctx.restore();text('AGORA,',80,455,57,C.teal,{font:'BarlowBold'});chrome(t,'08 / DA VERDADE À VIDA',true);
 }else if(t<32.35){
  let u=t-29.1;bg(C.ink);let j=u<.88?0:u<1.65?1:2;const labels=['PRESSÕES','DISTRAÇÕES','ESCOLHAS'];const names=['cansaco','multidao','cidade'];
  for(let i=0;i<3;i++){let y=210+i*465;film(names[i],0,y,W,445,{dark:i===j?.1:.65,px:.5+Math.sin(u+i)*.08});if(i===j){paper(60,y+255,960,150,C.lime,-.025,i);fitted(labels[i],90,y+330,900,124,C.ink)}else fitted(labels[i],70,y+330,930,95,'#f4ede077')}
  chrome(t,'09 / ESCOLHAS DO NOSSO TEMPO');
 }else if(t<35.096){
  let u=t-32.35;film('noite',0,0,W,H,{dark:.35});ctx.save();ctx.translate(540,900);ctx.rotate(-.13+u*.025);for(let i=9;i>=0;i--){let z=.16+i*.085+u*.012;ctx.save();ctx.scale(z,z);fitted('DESAFIO',-485,0,970,200,i===9?C.lime:'#f4ede040',{stroke:i===9?0:2});ctx.restore()}ctx.restore();text('ESSE É O VERDADEIRO',540,520,43,C.paper,{align:'center',font:'BarlowBold'});chrome(t,'10 / VIVER A VERDADE');
 }else if(t<38.48){
  let u=t-35.096;bg(C.paper);grid(t,'#0b1a1f1a');for(let i=0;i<5;i++){let p=ease((u-i*.09)/1.25);let x=lerp(i%2?-1200:1300,100+(i%2)*95,p),y=lerp(-700+i*800,270+i*210,p);panel(['cidade','estudos','multidao','montanhas','amigos'][i],x,y,810,520,(i-2)*.045+(1-p)*1.4,i*21)}rect(0,710,W,370,'#0b1a1fe8');quoteLines(['VAMOS','CONVERSAR.'],35.7,t,90,815,135);chrome(t,'11 / UM ENCONTRO COM A NOSSA REALIDADE',true);
 }else if(t<41.12){
  let u=t-38.48;bg(C.teal);film('montanhas',0,600,W,800,{dark:.4});grid(t);text('NOVEMBRO',540,475,87,C.paper,{align:'center',font:'BarlowBold'});ctx.save();ctx.translate(540,900);ctx.rotate(-.035);paper(-460,-210,920,420,C.lime);fitted('8—14',-405,0,810,320,C.ink);ctx.restore();text('2026',540,1280,180,C.paper,{align:'center'});line(90,1450,90+900*ease(u/.9),1450,C.lime,4);chrome(t,'12 / RESERVE ESSES DIAS');
 }else if(t<46.87){
  let u=t-41.12;bg(C.paper);grid(t,'#0b1a1f15');ctx.save();ctx.globalAlpha=.22;film('cidade',0,200,W,1400);ctx.restore();portraitAt(520,720,570,1013);
  quoteLines(['SEMANA','DE ORAÇÃO','JOVEM'],41.12,t,80,480,170,C.teal);tape('2026',80,1040,490,-.04,C.lime,160);
  if(u>2.5){paper(70,1360,940,220,C.ink,-.025,48);text('MINISTÉRIO JOVEM',115,1425,46,C.paper,{font:'Barlow'});text('ÁGAPE TEEN',115,1520,84,C.paper,{font:'BarlowBold'})}chrome(t,'13 / 8 A 14 DE NOVEMBRO',true);
 }else if(t<49.548){
  let u=t-46.87;film('montanhas',0,0,W,H,{dark:.35});grid(t,'#f4ede022');let z=1+.08*(1-ease(u/.6));ctx.save();ctx.translate(540,940);ctx.scale(z,z);ctx.translate(-540,-940);title(830,t,1);ctx.restore();
  if(u>1){const p=ease((u-1)/.2);line(80,1300,80+920*p,1300,C.lime,5)}text('OS DESAFIOS DO JOVEM',540,1400,42,C.paper,{align:'center',font:'BarlowBold'});text('CRISTÃO CONTEMPORÂNEO.',540,1460,42,C.paper,{align:'center',font:'BarlowBold'});chrome(t,'14 / VERDADE E DESAFIO');
 }else if(t<56.388){
  let j=t<51.26?0:t<51.94?1:t<53?2:3;let names=['louvor','amigos','paginas','amigos'];film(names[j],0,0,W,H,{dark:.2,px:j===3?.68:.5});gradient();
  if(j<3){let word=['LOUVOR','COMUNHÃO','MENSAGENS'][j];tape(word,75,1150,930,j%2?-.04:.035,C.paper,140)}else {paper(55,1030,970,440,C.ink,-.025);quoteLines(['A NOSSA','REALIDADE.'],53,t,100,1150,145);line(105,1410,950,1410,C.lime,7)}
  text('IMAGENS ILUSTRATIVAS',70,1675,22,C.paper,{font:'Barlow'});chrome(t,'15 / LOUVOR • COMUNHÃO • MENSAGENS');
 }else if(t<58.3){
  let u=t-56.388;bg(C.paper);grid(t,'#0b1a1f18');text('MARCA NA',80,420,120,C.teal);text('AGENDA.',80,565,155,C.teal);paper(75,790,930,620,C.teal,-.02,33);text('NOVEMBRO 2026',540,880,54,C.paper,{align:'center',font:'BarlowBold'});
  for(let i=0;i<7;i++){let x=145+i*126;text(['D','S','T','Q','Q','S','S'][i],x,990,27,C.gray,{align:'center',font:'Barlow'});let p=ease((u-.25-i*.07)/.3);ctx.save();ctx.globalAlpha=p;rect(x-48,1070,96,120,C.lime);ctx.restore();text(String(i+8),x,1130,60,C.ink,{align:'center',font:'BarlowBold'})}text('UMA SEMANA. UM ENCONTRO.',540,1310,39,C.paper,{align:'center',font:'Barlow'});chrome(t,'16 / 8—14 NOVEMBRO',true);
 }else if(t<61.164){
  let u=t-58.3;bg(C.teal);panel('amigos',60-30*Math.sin(u),250,1000,1050,-.04);tape('CHAMA OS AMIGOS',45,1180,995,-.035,C.lime,113);text('E VEM COM A GENTE.',540,1500,69,C.paper,{align:'center',font:'BarlowBold'});chrome(t,'17 / ESSE CONVITE É SEU');
 }else endPoster(t);
 // Subtle analog surface and controlled vignette, coherent across mixed media.
 ctx.save();ctx.globalAlpha=.3;ctx.drawImage(grain,(Math.floor(t*12)%3-1)*4,0,W,H);ctx.restore();
 const vg=ctx.createRadialGradient(540,900,440,540,900,1200);vg.addColorStop(0,'#0000');vg.addColorStop(1,'#00000045');ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
}
async function frame(t){await footage(t);draw(t);return c}
if(process.argv.includes('--preview')){const times=[.7,2,3.8,4.7,5.7,6.8,9.7,13,16,19.4,22,25,28.4,30.5,34,37.2,40,44.5,48.2,50.4,54.2,57.8,59.5,62.7,66,69.8];const out=path.join(ROOT,'output/frames');fs.mkdirSync(out,{recursive:true});for(const t of times){await frame(t);fs.writeFileSync(path.join(out,`${String(t).replace('.','_')}.jpg`),c.toBuffer('image/jpeg',90))}console.log('Preview frames:',times.length);
}else{
 const start=Number(process.env.START||0),end=Math.min(D,Number(process.env.END||D));const out=process.env.VIDEO_OUT||path.join(ROOT,'output/visual.mp4');
 const ff=spawn('ffmpeg',['-v','warning','-y','-f','image2pipe','-vcodec','mjpeg','-framerate','60','-i','-','-an','-c:v','libx264','-threads','2','-preset','fast','-crf','20','-maxrate','8M','-bufsize','16M','-pix_fmt','yuv420p','-movflags','+faststart',out],{stdio:['pipe','inherit','inherit']});
 for(let f=Math.round(start*60);f<Math.round(end*60);f++){await frame(f/60);const b=c.toBuffer('image/jpeg',94);if(!ff.stdin.write(b))await once(ff.stdin,'drain');if(f%20===0&&global.gc)global.gc();if(f%120===0)console.log('render',f/60,'/',D)}ff.stdin.end();await once(ff,'exit');console.log('Video rendered:',out)
}
