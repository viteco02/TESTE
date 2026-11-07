import {createCanvas,loadImage,GlobalFonts} from '@napi-rs/canvas';
import fs from 'node:fs';
import {once} from 'node:events';
const root=new URL('../',import.meta.url).pathname;
GlobalFonts.registerFromPath(root+'assets/fonts/Cormorant.ttf','Cormorant');
GlobalFonts.registerFromPath(root+'assets/fonts/BarlowCondensed-Bold.ttf','Barlow');
const names=['jardim','jane_lisbon','wylie_cho','rigsby_grace','poses'];
const imgs=Object.fromEntries(await Promise.all(names.map(async n=>[n,await loadImage(root+'assets/images/'+n+'.png')])));
const dialogs=JSON.parse(fs.readFileSync(root+'src/dialogue.json'));
const c=createCanvas(1080,1920),ctx=c.getContext('2d');
const defs={Jane:['jane_lisbon',0,768,450,202,55],Lisbon:['jane_lisbon',768,768,322,246,47],Wylie:['wylie_cho',0,768,320,220,46],Cho:['wylie_cho',768,768,487,215,42],Rigsby:['rigsby_grace',0,768,398,194,45],VanPelt:['rigsby_grace',768,768,424,276,47]};
const sprites={};for(const [n,d]of Object.entries(defs)){const a=createCanvas(d[2],1024);a.getContext('2d').drawImage(imgs[d[0]],d[1],0,d[2],1024,0,0,d[2],1024);sprites[n]=a;}
const ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
function mouth(n,t){const d=dialogs.find(v=>v.character.replace(' ','')===n&&t>=v.start&&t<v.end);return d?Math.min(1,(d.envelope[Math.floor((t-d.start)*30)]||0)*3.4):0;}
function puppet(n,x,y,s,t,rot=0,dance=false){
 const d=defs[n],a=mouth(n,t);ctx.save();ctx.translate(x+384*s,y+850*s);ctx.rotate(rot);ctx.scale(s,s);ctx.translate(-384,-850);
 if(dance){for(let row=0;row<1024;row+=16){let shift=Math.sin(t*6.5+row*.0018)*12*(1-row/1300);ctx.drawImage(sprites[n],0,row,768,Math.min(17,1024-row),shift,row,768,Math.min(17,1024-row));}}
 else ctx.drawImage(sprites[n],0,0);
 if(a>.035){let mx=d[3],my=d[4],w=d[5]*.73; if(dance)mx+=Math.sin(t*6.5+my*.0018)*12*(1-my/1300);ctx.fillStyle='rgba(66,25,24,.85)';ctx.beginPath();ctx.ellipse(mx,my+1,w/2,1+a*4.5,-.08,0,Math.PI*2);ctx.fill();if(a>.5){ctx.fillStyle='rgba(240,212,188,.8)';ctx.fillRect(mx-w*.32,my-1,w*.64,1.5);}}
 ctx.restore();
}
function close(n,t,start,side=0){const d=defs[n];const s=1.95+(t-start)*.008;puppet(n,540-d[3]*s+side,575-d[4]*s+3*Math.sin(t*1.4),s,t,.004*Math.sin(t*.8));}
function couple(t,invite=false,alpha=1){ctx.save();ctx.globalAlpha=alpha;let sx=invite?0:900,w=invite?900:636;let s=invite?1.48:1.78-.025*Math.max(0,t-52);let x=540-w*s/2+Math.sin(t*1.6)*12,y=invite?420:480;ctx.translate(540,1530);ctx.rotate(Math.sin(t*1.45)*.012);ctx.translate(-540,-1530);ctx.drawImage(imgs.poses,sx,0,w,1024,x,y,w*s,1024*s);if(invite){let a=mouth('Jane',t);if(a>.04){ctx.fillStyle='#552a25';ctx.beginPath();ctx.ellipse(x+250*s,y+236*s,18*s,(1+3*a)*s,-.12,0,Math.PI*2);ctx.fill();}}ctx.restore();}
function text(str,y,size,font='Barlow',color='#f4eee0'){ctx.font=`${size}px ${font}`;ctx.textAlign='center';ctx.fillStyle=color;ctx.fillText(str,540,y);}
function frame(t){
 ctx.fillStyle='#0d171a';ctx.fillRect(0,0,1080,1920);let z=1.06+.012*Math.sin(t*.14);ctx.drawImage(imgs.jardim,-32+12*Math.sin(t*.22),-55,1080*z,1920*z);
 ctx.fillStyle='rgba(8,16,23,.24)';ctx.fillRect(0,0,1080,1920);
 for(let i=0;i<24;i++){let x=(i*167.3+t*(3+i%4))%1120-20,y=(i*287.4-t*(4+i%3)+3840)%1920;ctx.fillStyle=`rgba(255,215,140,${.08+.1*(.5+.5*Math.sin(t+i))})`;ctx.beginPath();ctx.arc(x,y,1.5+i%3,0,7);ctx.fill();}
 if(t<6){puppet('Cho',95,430,1.47,t);puppet('Wylie',-210+Math.sin(t*3.2)*19,430+Math.abs(Math.sin(t*6.4))*16,1.52,t,Math.sin(t*3.2)*.045,true);}
 else if(t<12){puppet('Wylie',-710,620,1.7,t,.035*Math.sin(t*3),true);close('Cho',t,6,80);}
 else if(t<16){puppet('VanPelt',590,430,1.5,t);close('Rigsby',t,12,-85);}
 else if(t<19.5){puppet('Rigsby',-720,400,1.7,t);close('VanPelt',t,16,60);}
 else if(t<22){close('Rigsby',t,19.5,-25);}
 else if(t<26){puppet('Jane',-320,470,1.52,t,.008*Math.sin(t));let p=ease((t-22)/3.3);puppet('Lisbon',850-560*p,450+Math.sin(t*7)*4*(1-p),1.52,t);}
 else if(t<30){puppet('Jane',-780,410,1.9,t);close('Lisbon',t,26,45);}
 else if(t<37){puppet('Lisbon',670,470,1.6,t);close('Jane',t,30,-50);}
 else if(t<42){couple(t,true);}
 else if(t<46){close('Lisbon',t,42,30);}
 else if(t<49){close('Jane',t,46,-25);}
 else if(t<50.5){couple(t,true,1-ease((t-49.7)/.8));couple(t,false,ease((t-49.7)/.8));}
 else couple(t);
 // A soft foreground and lower vignette give depth without obscuring faces.
 let g=ctx.createLinearGradient(0,1200,0,1920);g.addColorStop(0,'rgba(7,13,18,0)');g.addColorStop(1,'rgba(7,13,18,.8)');ctx.fillStyle=g;ctx.fillRect(0,1200,1080,720);
 let v=ctx.createRadialGradient(540,830,390,540,960,1180);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.34)');ctx.fillStyle=v;ctx.fillRect(0,0,1080,1920);
 if(t<2){ctx.globalAlpha=(1-ease((t-1.4)/.6))*ease(t/.3);text('A ÚLTIMA DANÇA',1540,62,'Cormorant');text('FAN FILM • NÃO OFICIAL',1600,25,'Barlow','#d8c29c');ctx.globalAlpha=1;}
 if(t>54.3){ctx.globalAlpha=ease((t-54.3)/1.1);let g=ctx.createLinearGradient(0,0,0,650);g.addColorStop(0,'rgba(7,14,20,.92)');g.addColorStop(1,'rgba(7,14,20,0)');ctx.fillStyle=g;ctx.fillRect(0,0,1080,650);text('THE MENTALIST',275,100,'Cormorant');text('TEMPORADA 8',345,35,'Barlow','#d7b985');ctx.fillStyle='#c9aa73';ctx.fillRect(450,385,180,2);text('O DIA SEGUINTE',460,58,'Cormorant');text('FAN FILM • NÃO OFICIAL',1730,28,'Barlow','#d8c29c');ctx.globalAlpha=1;}
 if(t<.3){ctx.fillStyle=`rgba(5,10,14,${1-t/.3})`;ctx.fillRect(0,0,1080,1920);}
}
const [mode,a,b]=process.argv.slice(2);
if(mode==='preview'){frame(Number(a));fs.writeFileSync(b,c.toBuffer('image/jpeg'));}
else {for(let i=Number(a);i<Number(b);i++){frame(i/30);if(!process.stdout.write(c.toBuffer('image/jpeg',90)))await once(process.stdout,'drain');if(i%20===0&&global.gc)global.gc();}}
