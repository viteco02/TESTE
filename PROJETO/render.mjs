import {createCanvas,loadImage,GlobalFonts} from '@napi-rs/canvas';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import {once} from 'node:events';
import path from 'node:path';
process.chdir(path.dirname(new URL(import.meta.url).pathname));
GlobalFonts.registerFromPath('assets/Montserrat.ttf','Montserrat');
const W=1080,H=1920,FPS=60,D=57.652208;
const C=createCanvas(W,H),c=C.getContext('2d');
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const ease=v=>1-Math.pow(1-clamp(v),3);
const ramp=(t,a,b)=>ease((t-a)/(b-a));
let seed=42;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
const ivory='#FFF8E9',gold='#F7C642',navy='#142C56';
const cues=[
[0,.92,'ANTES DE\nEXISTIR',0],[.92,2.2,'QUALQUER\nCAMINHO',1],[2.2,3.56,'QUALQUER\nFLORESTA',2],[3.56,5.2,'QUALQUER\nSINAL DE VIDA',0],[5.2,7.42,'JÁ EXISTIA\nUM DEUS',3],
[7.42,8.52,'UM DEUS',0],[8.52,10.9,'O PODER DA\nSUA PALAVRA',1],[11.22,12.76,'LUZ',3],[13.66,14.38,'CÉUS',0],[15.12,15.9,'ÁGUAS',2],[17.14,18.12,'VIDA',3],
[18.12,19.38,'CADA\nÁRVORE',1],[19.38,20.52,'CADA\nFLOR',0],[20.52,24.2,'CADA\nDETALHE',2],[24.2,26.12,'SOMOS\nOBRAS',0],[26.12,28.64,'CRIADOR\nEXTRAORDINÁRIO',3],
[28.94,30.46,'NESTE\nSÁBADO',1],[30.46,32.4,'VOCÊ',2],[32.4,33.4,'CONTEMPLAR',0],[33.4,34.34,'AGRADECER',1],[34.34,35.66,'CELEBRAR',3],
[36.56,37.94,'SÁBADO\nDA CRIAÇÃO',3],[37.98,38.88,'MINISTÉRIOS\nJOVENS',0],[38.88,39.88,'ÁGAPE TEEN',1],[39.88,41.5,'ARAUTOS DA\nESPERANÇA',2],[41.5,43,'VOCÊ E\nSUA FAMÍLIA',0],[43,44.6,'PÔR DO SOL\nESPECIAL',3],[44.6,46.26,'EM MEIO\nÀ NATUREZA',0],
[46.26,47.42,'NESTE\nSÁBADO',1],[47.42,49.76,'17H',3],[49.76,51.52,'VENHA\nCELEBRAR',2],[51.52,52.7,'OS CÉUS\nPROCLAMAM',0],[52.7,53.84,'A GLÓRIA\nDE DEUS',3],[53.84,55.48,'TODA A\nCRIAÇÃO',1],[55.48,57.652208,'A GRANDEZA\nDO CRIADOR',3]
];
fs.writeFileSync('timeline_eventos.json',JSON.stringify(cues.map(([start,end,text,animation])=>({start,end,text,animation})),null,2));
let atlas=await loadImage('assets/elementos.png');
function sprite(rect){let s=createCanvas(rect[2],rect[3]);s.getContext('2d').drawImage(atlas,...rect,0,0,rect[2],rect[3]);return s;}
const tree=sprite([0,0,800,650]),branch=sprite([850,0,686,550]),grass=sprite([0,650,950,374]),flower=sprite([950,550,586,474]);
function circle(ctx,x,y,r,col){ctx.fillStyle=col;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
const mountains=[];
for(let k=0;k<4;k++){
 let a=createCanvas(1400,1200),g=a.getContext('2d');let pts=[];
 for(let i=0;i<=24;i++)pts.push([i*60,230+Math.sin(i*.7+k)*100+rnd()*160+k*40]);
 let grad=g.createLinearGradient(0,0,0,1200);grad.addColorStop(0,['#87c9dc','#58abc5','#258c9e','#246e59'][k]);grad.addColorStop(1,['#d3e7cc','#8abfa6','#4f9d72','#165b45'][k]);
 g.fillStyle=grad;g.beginPath();g.moveTo(0,1200);pts.forEach(p=>g.lineTo(...p));g.lineTo(1400,1200);g.closePath();g.fill();
 g.save();g.clip();for(let i=0;i<2500;i++){let x=rnd()*1400,y=rnd()*1200,r=2+rnd()*14;circle(g,x,y,r,`rgba(${k<2?'216,244,225':'137,199,91'},${.03+rnd()*.13})`);}g.restore();mountains.push(a);
}
const relief=await loadImage('assets/relevo.png');
const peaks=createCanvas(1536,524);peaks.getContext('2d').drawImage(relief,0,0,1536,524,0,0,1536,524);
const hills=createCanvas(1536,500);hills.getContext('2d').drawImage(relief,0,524,1536,500,0,0,1536,500);
{const g=hills.getContext('2d');g.globalCompositeOperation='destination-in';let m=g.createLinearGradient(0,0,0,190);m.addColorStop(0,'rgba(0,0,0,0)');m.addColorStop(.35,'rgba(0,0,0,0)');m.addColorStop(1,'rgba(0,0,0,1)');g.fillStyle=m;g.fillRect(0,0,1536,500);}
const clouds=[];for(let n=0;n<6;n++){let a=createCanvas(700,340),g=a.getContext('2d');for(let i=0;i<35;i++){let x=100+rnd()*500,y=160+rnd()*80,r=30+rnd()*70;let gr=g.createRadialGradient(x-r/3,y-r/2,0,x,y,r);gr.addColorStop(0,'rgba(255,255,247,.85)');gr.addColorStop(.65,'rgba(238,250,249,.55)');gr.addColorStop(1,'rgba(227,246,252,0)');circle(g,x,y,r,gr);}clouds.push(a);}
const particles=Array.from({length:75},()=>({x:rnd()*W,y:rnd()*H,s:1+rnd()*4,v:8+rnd()*26}));
function paintSprite(img,x,y,w,h,angle=0,opacity=1){c.save();c.globalAlpha=clamp(opacity);c.translate(x,y);c.rotate(angle);c.drawImage(img,-w/2,-h,w,h);c.restore();}
function scene(t){
 let day=ramp(t,10.9,13.7),life=ramp(t,15.9,18.2),sunset=ramp(t,28.64,44);
 let sky=c.createLinearGradient(0,0,0,H);sky.addColorStop(0,day?`rgb(${Math.round(49+sunset*77)},${Math.round(155-sunset*40)},${Math.round(208-sunset*45)})`:'#080D1A');sky.addColorStop(.58,day?(sunset>.5?'#ffd49b':'#c9f1ec'):'#101e32');sky.addColorStop(1,day?'#426e51':'#080D1A');c.fillStyle=sky;c.fillRect(0,0,W,H);
 if(t<12.9){let p=ramp(t,5.2,7.2),radius=15+p*800+ramp(t,10.9,12.9)*1400;let g=c.createRadialGradient(540,540,0,540,540,radius);g.addColorStop(0,`rgba(255,251,217,${p})`);g.addColorStop(.09,`rgba(255,227,149,${p*.95})`);g.addColorStop(.35,`rgba(247,198,66,${p*.15})`);g.addColorStop(1,'rgba(247,198,66,0)');c.fillStyle=g;c.fillRect(0,0,W,H);
  if(t>8.52){for(let j=0;j<4;j++){let rr=((t-8.52)*230+j*180)%1100;c.strokeStyle=`rgba(255,248,233,${.4*(1-rr/1100)})`;c.lineWidth=3;c.beginPath();c.arc(540,540,rr,0,Math.PI*2);c.stroke();}}
  if(t>.92&&t<2.2){let p=Math.sin((t-.92)/1.28*Math.PI);c.strokeStyle=`rgba(247,198,66,${p*.5})`;c.lineWidth=4;for(let j=0;j<7;j++){c.beginPath();c.ellipse(540+j*j*1.8,1250+j*70,20+j*21,6+j*5,0,0,7);c.stroke();}}
  if(t>2.2&&t<3.56){paintSprite(tree,200,1770,700,650,0,Math.sin((t-2.2)/1.36*Math.PI)*.18);paintSprite(tree,920,1650,600,600,0,.12);}
 }
 if(day>0){c.save();c.globalAlpha=day;
 let sy=530+sunset*280;let glow=c.createRadialGradient(700,sy,5,700,sy,550);glow.addColorStop(0,'rgba(255,242,182,.9)');glow.addColorStop(1,'rgba(255,218,135,0)');c.fillStyle=glow;c.fillRect(0,0,W,H);circle(c,700,sy,65+sunset*15,'#fff4c9');
 clouds.forEach((a,i)=>c.drawImage(a,-280+(i%3)*450+Math.sin(t*.035+i)*120,80+Math.floor(i/3)*260,800,400));
 let tilt=t>51.52&&t<53.84?Math.sin((t-51.52)/2.32*Math.PI)*200:0;
 for(let k=0;k<4;k++){let rise=ramp(t,14.38+k*.32,16.7+k*.3);c.drawImage(k===0?peaks:hills,-230+Math.sin(t*.08+k)*35*k,650+k*195+(1-rise)*1100+tilt,1540,650);}
 if(t>14.38){let sea=ramp(t,14.38,15.6);c.save();c.beginPath();c.moveTo(550,1020);c.bezierCurveTo(300,1200,850,1400,300,1920);c.lineTo(760,1920);c.bezierCurveTo(1040,1370,400,1200,580,1020);c.closePath();let wg=c.createLinearGradient(0,1000,0,1920);wg.addColorStop(0,'#a4e0dc');wg.addColorStop(1,'#248dac');c.fillStyle=wg;c.globalAlpha=sea;c.fill();c.clip();for(let j=0;j<60;j++){c.strokeStyle=`rgba(255,245,195,${.1+.15*Math.sin(t+j)})`;c.lineWidth=2;c.beginPath();let y=1050+j*17;c.moveTo(250+Math.sin(j+t)*30,y);c.lineTo(800+Math.sin(t+j)*50,y);c.stroke();}c.restore();}
 if(life>0){
  for(let k=0;k<3;k++){let sz=350+k*270,base=1370+k*230;for(let side of [-1,1]){let grow=ramp(t,15.9+k*.25,17.8+k*.2);paintSprite(tree,540+side*(370+k*110)+Math.sin(t*.15+k)*20,base,sz,sz*.82*grow,Math.sin(t*.4+k)*.012,life);}}
  paintSprite(branch,1010+Math.sin(t*.3)*15,650,850,650,Math.sin(t*.3)*.018,life);
  c.save();c.translate(W,0);c.scale(-1,1);paintSprite(branch,1080+Math.sin(t*.3)*18,540,700,550,Math.sin(t*.27)*.02,life);c.restore();
  paintSprite(grass,260,1990,1000,460,Math.sin(t*.7)*.01,life);paintSprite(grass,1000,2010,1000,460,-Math.sin(t*.6)*.01,life);
 }
 if(t>=18.12&&t<19.38){let p=ramp(t,18.12,18.75);paintSprite(tree,600,1800,1100*p,1000*p,Math.sin(t)*.01);}
 if(t>=19.38&&t<20.52){let p=ramp(t,19.38,20.05);paintSprite(flower,620,1700,900,900*p,(1-p)*-.25);}
 if(t>=20.52&&t<24.2){let z=(t-20.52);paintSprite(tree,-450+z*550,2100,1600,1500,Math.sin(t*.3)*.015);circle(c,650-z*90,1240,18,'rgba(222,250,255,.8)');}
 if(t>=41.5&&t<43){for(let i=0;i<4;i++){let x=450+i*48,y=1390+(i%2)*15;c.fillStyle='#234e47';circle(c,x,y-45,9,c.fillStyle);c.fillRect(x-7,y-33,14,39);c.fillRect(x-9,y,6,28);c.fillRect(x+4,y,6,28);}}
 c.restore();}
 // Atmospheric light and organic drifting particles.
 particles.forEach((p,i)=>{let a=t<5.2?.12:day?.36:.3;circle(c,(p.x+Math.sin(t*.3+i)*25+W)%W,(p.y-t*p.v+H*4)%H,p.s,`rgba(255,244,191,${a*(.5+.5*Math.sin(t+i))})`);});
 if(day){c.save();c.globalCompositeOperation='screen';c.globalAlpha=.07+.08*sunset;for(let i=0;i<5;i++){c.fillStyle='#ffe1a0';c.beginPath();c.moveTo(700,350);c.lineTo(100+i*270+Math.sin(t*.15)*60,1920);c.lineTo(210+i*270,1920);c.closePath();c.fill();}c.restore();}
 let vignette=c.createRadialGradient(540,850,350,540,900,1200);vignette.addColorStop(0,'rgba(8,13,26,0)');vignette.addColorStop(1,'rgba(8,13,26,.55)');c.fillStyle=vignette;c.fillRect(0,0,W,H);
}
function textBlock(text,x,y,size,color,mode,p,max=900){let lines=text.split('\n');c.save();c.translate(x,y);if(mode===1)c.translate((1-p)*-1100,0);if(mode===2){c.rotate((1-p)*-.08);c.translate((1-p)*1000,0);}if(mode===3){let s=.55+.45*p+.04*Math.sin(p*Math.PI);c.scale(s,s);}c.textAlign='center';c.textBaseline='middle';c.fillStyle=color;lines.forEach((line,j)=>{let sz=size;c.font=`900 ${sz}px Montserrat`;while(c.measureText(line).width>max){sz-=1;c.font=`900 ${sz}px Montserrat`;}c.save();let yy=(j-(lines.length-1)/2)*size*1.05;c.beginPath();c.rect(-540,yy-size*.55,1080,size*1.1);c.clip();c.shadowColor='rgba(0,18,30,.3)';c.shadowBlur=16;c.shadowOffsetY=4;c.fillText(line,0,yy+(mode===0?(1-p)*size*1.2:0));c.restore();});c.restore();}
function frame(t){scene(t);let cue=cues.find(q=>t>=q[0]&&t<q[1]);let card=(t>=28.94&&t<32.4)||(t>=34.34&&t<35.66)||(t>=37.98&&t<41.5)||(t>=46.26&&t<49.76);if(cue){let [a,b,txt,mode]=cue,p=ease((t-a)/.34);if(card){let col=t>=46.26?gold:(mode%2?navy:gold);c.save();c.beginPath();let r=ease((t-a)/.32)*2300;c.arc(mode%2?0:1080,900,r,0,7);c.clip();c.fillStyle=col;c.fillRect(0,0,W,H);c.strokeStyle=col===gold?'rgba(20,44,86,.13)':'rgba(247,198,66,.13)';c.lineWidth=3;for(let j=0;j<6;j++){c.beginPath();c.arc(1080,1700,150+j*170+(t-a)*30,0,7);c.stroke();}c.restore();}
 let y=card?880:(t<11?1030:680);let size=txt==='17H'?360:txt.length<8?200:128;let color=card&&(t>=46.26||mode%2===0)?navy:ivory;
 if(!card&&t>12.7){let scrim=c.createLinearGradient(0,300,0,980);scrim.addColorStop(0,'rgba(8,28,48,0)');scrim.addColorStop(.5,'rgba(8,28,48,.45)');scrim.addColorStop(1,'rgba(8,28,48,0)');c.fillStyle=scrim;c.fillRect(0,300,1080,680);}
 textBlock(txt,540,y,size,color,mode,p,870);
 if(txt==='17H'&&t>=48.84){textBlock('EM PONTO!',540,1190,90,navy,0,ease((t-48.84)/.22));c.fillStyle=navy;c.fillRect(200,1310,680*ramp(t,48.84,49.2),8);}
 if(t>=39.88&&t<41.5)textBlock('ÁGAPE TEEN',540,1160,48,color,0,1);
 if(t>=55.48){c.fillStyle=gold;c.fillRect(390,920,300*p,5);}
 }
 if(t>57.06){c.fillStyle=`rgba(8,13,26,${ramp(t,57.06,D)})`;c.fillRect(0,0,W,H);}}
if(process.argv.includes('--stills')){for(let t of [0.5,5.9,11.7,13.9,15.4,17.4,18.8,19.9,21.3,26.9,29.5,30.9,33.6,34.8,37.2,39.2,40.5,43.8,47.9,49.1,52.9,56.4]){frame(t);fs.mkdirSync('revisao',{recursive:true});fs.writeFileSync(`revisao/${t}.jpg`,C.toBuffer('image/jpeg',85));}process.exit();}
const out=process.argv[2]||'../sabado_da_criacao_reel_final.mp4';
const ff=spawn('ffmpeg',['-y','-v','warning','-f','rawvideo','-pix_fmt','rgba','-s',`${W}x${H}`,'-r',`${FPS}`,'-i','-','-i','assets/narracao.mp3','-i','assets/trilha.wav','-filter_complex','[2:a]volume=0.12[m];[1:a][m]amix=inputs=2:duration=first:normalize=0[a]','-map','0:v','-map','[a]','-c:v','libx264','-preset','veryfast','-crf','21','-pix_fmt','yuv420p','-c:a','aac','-b:a','320k','-t',`${D}`,'-movflags','+faststart',out],{stdio:['pipe','inherit','inherit']});
for(let f=0;f<Math.ceil(D*FPS);f++){frame(f/FPS);let raw=C.data();if(!ff.stdin.write(raw))await once(ff.stdin,'drain');if(f%300===0)console.log(`frame ${f}/${Math.ceil(D*FPS)}`);}ff.stdin.end();await once(ff,'close');console.log('Render concluído');
