/* GMSL Digital · SIGMSL – Sistema Integrado da Guarda Municipal de São Luís */
{
const CFG=window.GMSL_CFG;
const sb=window.supabase.createClient(CFG.url,CFG.key,{auth:{persistSession:true,autoRefreshToken:true}});
const LOGO="icons/brasao.webp";
const LIMITE_MES=4; // regra provisória
let POSTOS=[],POSTOS_ADM=new Set(),PATENTES=[],PAT_NOME={};
const PERFIL_NOME={gm:"Guarda",cp:"Coordenador de Posto",ccg:"Chefia do Corpo de Guarda",esc:"Escalante",he:"Gestor de HE",ron:"Rondante",arm:"Armeiro",admin:"Comando/Subcomando"};
const emailDe=m=>"m"+String(m).replace(/\D/g,"")+"@"+CFG.emailDominio;

/* ---------- utilidades ---------- */
const pad=n=>String(n).padStart(2,"0");
const iso=d=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const parse=s=>{const[a,b,c]=s.split("-").map(Number);return new Date(a,b-1,c)};
const add=(s,n)=>{const d=parse(s);d.setDate(d.getDate()+n);return iso(d)};
const hoje=()=>iso(new Date());
let TODAY=hoje();
const dnum=s=>Math.round((parse(s)-new Date(2026,0,1))/864e5);
const MES=["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
const MESF=["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const SEM=["dom","seg","ter","qua","qui","sex","sáb"];
const fd=s=>{if(!s)return"A combinar";const d=parse(s);return d.getDate()+" "+MES[d.getMonth()]+" "+d.getFullYear()+" ("+SEM[d.getDay()]+")"};
const fds=s=>{const d=parse(s);return pad(d.getDate())+"/"+pad(d.getMonth()+1)};
const d10=s=>s?pad(parse(s).getDate())+"/"+pad(parse(s).getMonth()+1)+"/"+parse(s).getFullYear():"—";
const dbr=s=>s?d10(s)+" ("+SEM[parse(s).getDay()]+")":"A combinar";
const mesDe=s=>s.slice(0,7);
const hm=t=>t?String(t).slice(0,5):"";
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const durH=(a,b)=>{const[h1,m1]=a.split(":").map(Number),[h2,m2]=b.split(":").map(Number);let d=(h2*60+m2)-(h1*60+m1);if(d<=0)d+=1440;return d/60};
const agora=()=>{const d=new Date();return pad(d.getDate())+"/"+pad(d.getMonth()+1)+"/"+d.getFullYear()+" às "+pad(d.getHours())+":"+pad(d.getMinutes())};
const codigo=o=>{let h=2166136261;const t=JSON.stringify(o);for(let i=0;i<t.length;i++){h^=t.charCodeAt(i);h=Math.imul(h,16777619)}const a=(h>>>0).toString(36).toUpperCase().padStart(7,"0");return "GMSL-"+a.slice(0,4)+"-"+a.slice(4)};
const fmtTel=v=>{v=v.replace(/\D/g,"").slice(0,11);if(v.length<3)return v;return "("+v.slice(0,2)+") "+(v.length>7?v.slice(2,v.length-4)+"-"+v.slice(-4):v.slice(2))};

/* ---------- estado em memória ---------- */
async function carregarRef(){const[p,t]=await Promise.all([sb.from("postos").select("*").eq("ativo",true).order("nome"),sb.from("patentes").select("*").order("ordem")]);if(p.data){POSTOS=p.data.map(x=>x.nome);POSTOS_ADM=new Set(p.data.filter(x=>x.tipo==="administrativo").map(x=>x.nome))}if(t.data){PATENTES=t.data.map(x=>x.sigla);t.data.forEach(x=>PAT_NOME[x.sigla]=x.nome)}}
const postoOpts=sel=>`<optgroup label="Postos operacionais">${POSTOS.filter(x=>!POSTOS_ADM.has(x)).map(x=>`<option ${x===sel?"selected":""}>${esc(x)}</option>`).join("")}</optgroup><optgroup label="Setores administrativos">${POSTOS.filter(x=>POSTOS_ADM.has(x)).map(x=>`<option ${x===sel?"selected":""}>${esc(x)}</option>`).join("")}</optgroup>`;
const patTxt=x=>(x.pat||"")+(x.bm?" · BM":"");
const habTxt=x=>[x.hab380?".380":"",x.hab38?".38":"",x.taser?"Taser":""].filter(Boolean).join(", ");
const S={tela:"carregando",param:null,feriados:new Set(),efetivo:[],uid:null,me:null,perfis:[],escalas:[],reqs:[],avisos:[],urls:{},filtro:"todas",mesOff:0,draft:null,cad:null,escEd:null,carregando:false};
const g=id=>S.perfis.find(p=>p.id===id)||{id,nome:"(servidor)",nomeC:"",mat:"—",pat:"",posto:"",perfil:"gm"};
const ativos=()=>S.perfis.filter(p=>p.status==="ativo");
const perfilPorMat=m=>S.perfis.find(p=>p.mat===m&&p.status==="ativo");
const pm=m=>{const p=perfilPorMat(m);if(p)return p;const o=(S.efetivo||[]).find(x=>x.mat===m);return o||{id:null,mat:m,nome:m,nomeC:"",pat:"",posto:""}};
const pessoas=()=>{const mp=new Map();(S.efetivo||[]).forEach(x=>mp.set(x.mat,x));ativos().forEach(x=>mp.set(x.mat,x));return [...mp.values()]};
const ME=()=>S.uid;
const ini=x=>{const w=(x.nome||"").replace(/^GCM\s*/i,"").trim();return (w.slice(0,2)||"GM").toUpperCase()};
const foto34=(src,txt,cls="")=>src?`<img class="f34 ${cls}" src="${esc(src)}" alt="Foto 3x4">`:`<div class="f34 ${cls} vazio">${txt||'<span class="ms">person</span>'}</div>`;
const av=gid=>{const x=g(gid);return x.foto?`<img class="avatar sm" style="object-fit:cover;object-position:top" src="${esc(x.foto)}" alt="">`:`<div class="avatar sm">${ini(x)}</div>`};

function mapPerfil(p){return{id:p.id,nome:p.guerra,nomeC:p.nome,mat:p.matricula,pat:p.patente,posto:p.posto,turno:p.turno,adm:p.adm,tel:p.tel,email:p.email,perfil:p.perfil,perfilSol:p.perfil_solicitado,bm:p.bm,hab380:p.hab_380,hab38:p.hab_38,taser:p.hab_taser,status:p.status,motivo:p.motivo,fotoPath:p.foto_path,fotoPendPath:p.foto_pend_path,fotoPendData:p.foto_pend_data,fotoMotivo:p.foto_motivo,selfiePath:p.selfie_path,criado:p.created_at?iso(new Date(p.created_at)):TODAY}}
function mapReq(r){return{id:r.id,cod:"P-"+r.id,tipo:r.tipo,sol:r.sol,col:r.col,posto:r.posto,saida:{data:r.saida_data,ini:hm(r.saida_ini),fim:hm(r.saida_fim)},repos:{data:r.repos_data,ini:hm(r.repos_ini)||hm(r.saida_ini),fim:hm(r.repos_fim)||hm(r.saida_fim)},obs:r.obs||"",criado:iso(new Date(r.created_at)),et:{col:r.et_col,cp:r.et_cp,ccg:r.et_ccg},motivo:r.motivo,msgCol:r.msg_col,cancel:r.cancelada}}
function mapEsc(e){const meta={},gr=(Array.isArray(e.grupos)?e.grupos:[]).map(g0=>(g0||[]).map(m=>{if(typeof m==="string")return m;meta[m.id]={funcao:m.funcao||"",desde:m.desde||"",ate:m.ate||""};return m.id}));return{id:e.id,nome:e.nome,posto:e.posto,ini:e.ini,fim:e.fim,hi:hm(e.hi),hf:hm(e.hf),horas:+e.horas,uteis:e.uteis,grupos:gr,meta,excluir:e.excluir||[],semFer:!!e.sem_feriados,st:e.status,devolucao:e.devolucao||"",enviada:e.enviada_em?String(e.enviada_em).slice(0,10):""}}
const gruposParaBanco=x=>x.grupos.map(gr=>gr.map(id=>{const m=x.meta[id];return m&&(m.funcao||m.desde||m.ate)?{id,...m}:id}));

async function carregar(){
 if(S.carregando)return;S.carregando=true;TODAY=hoje();
 try{
  const{data:me,error:e0}=await sb.from("perfis").select("*").eq("id",S.uid).maybeSingle();
  if(e0)throw e0;
  if(!me){S.me=null;return}
  S.me=mapPerfil(me);
  if(S.me.status!=="ativo"){S.perfis=[S.me];return}
  const[p,e,r,a,fe]=await Promise.all([
   sb.from("perfis").select("*").order("guerra"),
   sb.from("escalas").select("*").order("ini"),
   sb.from("permutas").select("*").order("created_at",{ascending:false}).limit(800),
   sb.from("avisos").select("*").eq("lido",false).order("created_at",{ascending:false}).limit(30),
   sb.from("feriados").select("*").order("data")]);
  for(const x of[p,e,r,a])if(x.error)throw x.error;

  S.feriadosLista=fe.data||[];S.feriados=new Set(S.feriadosLista.map(x=>x.data));S.perfis=p.data.map(mapPerfil);S.escalas=e.data.map(mapEsc);S.reqs=r.data.map(mapReq);S.avisos=a.data;
  const paths=new Set();S.perfis.forEach(x=>{if(x.fotoPath)paths.add(x.fotoPath);if(eGestor()||x.id===S.uid){if(x.fotoPendPath)paths.add(x.fotoPendPath);if(eGestor()&&x.selfiePath&&x.status==="pendente")paths.add(x.selfiePath)}});
  const novos=[...paths].filter(k=>!S.urls[k]);
  if(novos.length){const{data:u}=await sb.storage.from("gmsl").createSignedUrls(novos,60*60*6);(u||[]).forEach(o=>{if(o.signedUrl)S.urls[o.path]=o.signedUrl})}
  S.perfis.forEach(x=>{x.foto=S.urls[x.fotoPath]||null;x.fotoPend=S.urls[x.fotoPendPath]||null;x.selfie=S.urls[x.selfiePath]||null});
  S.me=g(S.uid);
  if(["cp","ccg","esc","arm","admin"].includes(perfilAtual())){const{data:ef}=await sb.from("efetivo").select("*").order("guerra");S.efetivo=(ef||[]).map(x=>({id:null,mat:x.matricula,nome:x.guerra,nomeC:x.nome,pat:x.patente||"",posto:x.posto||"",bm:x.bm,hab380:x.hab_380,hab38:x.hab_38,taser:x.hab_taser,oficial:true}))}
  if(["cp","ccg","esc","admin"].includes(perfilAtual())){const{data:al}=await sb.from("escala_alteracoes").select("*").order("created_at",{ascending:false}).limit(200);S.alteracoes=(al||[]).map(a=>({...a,gr:mapEsc({grupos:a.grupos}).grupos}))}
  if(["cp","ccg","esc","admin"].includes(perfilAtual())){const{data:rm}=await sb.from("remocoes").select("*").order("created_at",{ascending:false}).limit(200);S.remocoes=rm||[]}
 }finally{S.carregando=false}
}
const perfilAtual=()=>S.me&&S.me.status==="ativo"?S.me.perfil:null;
const eGestor=()=>["cp","ccg","admin"].includes(perfilAtual());

/* ---------- escala ---------- */
const DIAS_UTEIS=s=>{const d=parse(s).getDay();return d!==0&&d!==6};
function grupoDoDia(e,s){if(s<e.ini||s>e.fim)return -1;if((e.excluir||[]).includes(s)||(e.semFer&&S.feriados.has(s)))return -1;const n=e.grupos.length;if(!n)return -1;if(e.uteis&&!DIAS_UTEIS(s))return -1;let k=0;if(e.uteis){for(let d=e.ini;d<s;d=add(d,1))if(DIAS_UTEIS(d))k++}else k=dnum(s)-dnum(e.ini);return k%n}
function escalaDia(gid,s){const k=g(gid).mat;let em=false;for(const e of S.escalas){if(e.st!=="publicada"||s<e.ini||s>e.fim)continue;const gi=e.grupos.findIndex(gr=>gr.includes(k));if(gi<0)continue;const mt=(e.meta||{})[k]||{};if((mt.desde&&s<mt.desde)||(mt.ate&&s>mt.ate))continue;em=true;if(grupoDoDia(e,s)===gi)return{t:"regular",e,f:mt.funcao}}return em?{t:"folga"}:null}
function status(r){
 if(r.cancel)return{k:"fim",t:"Cancelada",c:""};
 if(r.et.col==="recusado")return{k:"fim",t:"Recusada pelo colega",c:"red"};
 if(r.et.col==="pendente")return r.col?{k:"pend",t:"Aguardando aceite do colega",c:""}:{k:"pend",t:"Publicada no mural",c:"gold"};
 if(r.et.cp==="recusado")return{k:"fim",t:"Indeferida pelo Coordenador",c:"red"};
 if(r.et.cp==="pendente")return{k:"pend",t:"Aguardando Coord. de Posto",c:"blue"};
 if(r.et.ccg==="recusado")return{k:"fim",t:"Indeferida pela Chefia",c:"red"};
 if(r.et.ccg==="pendente")return{k:"pend",t:"Aguardando Chefia do C.G.",c:"blue"};
 return{k:"ok",t:"Aprovada",c:"green"};
}
function dia(gid,s){
 const ed=escalaDia(gid,s);let t=ed?ed.t:"sem",nota=ed?"":"Sem escala publicada",hor=null,h=0;
 if(ed&&ed.e){nota=ed.e.nome+(ed.f?" · "+ed.f:"");hor=ed.e.hi+" às "+ed.e.hf;h=ed.e.horas}
 for(const r of S.reqs){if(status(r).k!=="ok")continue;
  if(r.saida.data===s){if(r.sol===gid){t="coberto";nota="Coberto por "+g(r.col).nome;h=0}else if(r.col===gid){t="cobrindo";nota="Cobrindo "+g(r.sol).nome;hor=r.saida.ini+" às "+r.saida.fim;h=durH(r.saida.ini,r.saida.fim)}}
  if(r.repos.data===s){if(r.col===gid){t="coberto";nota="Reposição feita por "+g(r.sol).nome;h=0}else if(r.sol===gid){t="cobrindo";nota="Reposição para "+g(r.col).nome;hor=r.repos.ini+" às "+r.repos.fim;h=durH(r.repos.ini,r.repos.fim)}}}
 return{t,nota,hor,h};
}
const trabalha=(gid,s)=>["regular","cobrindo"].includes(dia(gid,s).t);
const proximos=(gid,from,n)=>{const o=[];let s=from;for(let i=0;o.length<n&&i<70;i++,s=add(s,1))if(dia(gid,s).t==="regular")o.push(s);return o};
const horasMes=(gid,mes)=>{let t=0,n=0;for(let s=mes+"-01";mesDe(s)===mes;s=add(s,1)){const d=dia(gid,s);if(d.t==="regular"||d.t==="cobrindo"){t+=d.h;n++}}return{h:t,n}};
const dots=r=>`<span class="dots" title="Colega · Coordenador · Chefia"><span class="dot ${r.et.col==="aceito"?"red":r.et.col==="recusado"?"x":""}"></span><span class="dot ${r.et.cp==="aprovado"?"blue":r.et.cp==="recusado"?"x":""}"></span><span class="dot ${r.et.ccg==="aprovado"?"green":r.et.ccg==="recusado"?"x":""}"></span></span>`;
const contaMes=(gid,s)=>S.reqs.filter(r=>!r.cancel&&r.sol===gid&&r.et.col!=="recusado"&&r.et.cp!=="recusado"&&r.et.ccg!=="recusado"&&mesDe(r.saida.data)===mesDe(s)).length;
const minhas=()=>S.reqs.filter(r=>r.sol===ME()||r.col===ME());
const paraMim=()=>S.reqs.filter(r=>r.col===ME()&&r.et.col==="pendente"&&!r.cancel);
const filaCP=()=>S.reqs.filter(r=>!r.cancel&&r.et.col==="aceito"&&r.et.cp==="pendente");
const filaCCG=()=>S.reqs.filter(r=>!r.cancel&&r.et.cp==="aprovado"&&r.et.ccg==="pendente");
const cadsPend=()=>S.perfis.filter(p=>p.status==="pendente");
const fotosPend=()=>S.perfis.filter(p=>p.status==="ativo"&&p.fotoPendPath);
const mural=()=>S.reqs.filter(r=>r.tipo==="mural"&&!r.col&&!r.cancel&&r.saida.data>=TODAY);

/* ---------- navegação ---------- */
const HOME={gm:"inicio",cp:"cp",ccg:"ccg",esc:"escalante",he:"breve",ron:"breve",admin:"comando"};
const NAV={
 gm:[["inicio","home","Início"],["escala","calendar_month","Escala"],["mural","campaign","Mural"],["solic","swap_horiz","Trocas"],["perfil","person","Perfil"]],
 cp:[["cp","shield_person","Gestão"],["equipe","groups","Equipe"],["efetivo","badge","Efetivo"],["perfil","person","Perfil"]],
 ccg:[["ccg","verified","Aprovações"],["ccgescalas","calendar_month","Escalas"],["efetivo","badge","Efetivo"],["panorama","monitoring","Panorama"],["perfil","person","Perfil"]],
 esc:[["escalante","calendar_month","Escalas"],["escuni","merge","Unificada"],["efetivo","badge","Efetivo"],["feriados","event_busy","Feriados"],["perfil","person","Perfil"]],
 admin:[["comando","military_tech","Comando"],["ccg","verified","Aprovações"],["escalante","calendar_month","Escalas"],["efetivo","badge","Efetivo"],["perfil","person","Perfil"]],
 he:[["breve","more_time","Início"],["perfil","person","Perfil"]],ron:[["breve","directions_car","Início"],["perfil","person","Perfil"]]
};
const TITULO={comando:"Comando/Subcomando",ccgescalas:"Escalas de Serviço",escver:"Escala",cpgrupos:"Grupos da Escala",inicio:"GMSL Digital",escala:"Minha Escala",mural:"Mural de Permutas",solic:"Minhas Trocas",perfil:"Perfil",nova:"Solicitar Permuta",enviado:"Solicitação Enviada",det:"Detalhes",cp:"Coordenação de Posto",equipe:"Equipe do Posto",ccg:"Chefia do Corpo de Guarda",panorama:"Panorama",efetivo:"Efetivo",escalante:"Escalante",escnova:"Escala",escuni:"Escala Unificada",feriados:"Feriados",comp:"Comprovante",breve:"Em desenvolvimento"};
const VOLTA={nova:null,det:null,enviado:null,comp:null,escnova:"escalante"};
const go=(tela,param=null)=>{if(tela!==S.tela&&!["comp"].includes(tela))S.voltar={t:S.tela,p:S.param};S.tela=tela;S.param=param;render();window.scrollTo(0,0)};
let toastT;
const toast=m=>{const l=document.getElementById("layer");clearTimeout(toastT);l.querySelector(".toast")?.remove();l.insertAdjacentHTML("beforeend",`<div class="toast" role="status">${m}</div>`);toastT=setTimeout(()=>l.querySelector(".toast")?.remove(),3600)};
const sheet=html=>{document.getElementById("layer").innerHTML=`<div class="sheet-bg" data-a="closeSheet"><div class="sheet" role="dialog" aria-modal="true">${html}</div></div>`};
const closeSheet=()=>{document.getElementById("layer").querySelector(".sheet-bg")?.remove()};
const errBox=(id,er)=>{const b=document.getElementById(id);if(!b)return;b.innerHTML=er.map(t=>`<div class="err"><span class="ms">error</span>${esc(t)}</div>`).join("");if(er.length)b.scrollIntoView({block:"center"})};
const msgErro=e=>{const m=(e&&(e.message||e.erro))||"";return /permitid|não encontrad|indisponível|pendente|Chefia|Informe|Já existe|não está escalado|Somente|não pode|Quem passou|já foi|já decidid|Sem permissão|Anexe|Sessão|Escolha|Confira/i.test(m)?m:"Não foi possível concluir. Verifique a conexão e tente de novo."};

/* ---------- notificações (sininho) ---------- */
function notifs(){const p=perfilAtual(),o=[],nm=id=>(g(id)||{}).nome||"—",gest=p==="admin";
 (S.avisos||[]).forEach(a=>o.push({ic:"campaign",t:a.texto,sub:a.created_at?fds(String(a.created_at).slice(0,10)):"",aviso:a.id}));
 if(p==="gm"||gest){paraMim().forEach(r=>o.push({ic:"swap_horiz",t:nm(r.sol)+" pediu para trocar plantão com você",sub:r.cod+" · saída "+fds(r.saida.data),go:"det",id:r.id}));
  S.reqs.filter(r=>r.sol===ME()&&!r.cancel&&status(r).k==="pend").forEach(r=>o.push({ic:"hourglass_top",t:"Sua permuta "+r.cod+": "+status(r).t.toLowerCase(),sub:"Saída "+fds(r.saida.data),go:"det",id:r.id}));
  if(S.me&&S.me.fotoPendPath)o.push({ic:"photo_camera",t:"Sua nova foto está em análise pela Chefia",sub:"",go:"perfil"})}
 if(p==="cp"||gest){filaCP().forEach(r=>o.push({ic:"swap_horiz",t:"Permuta "+r.cod+" para validar",sub:nm(r.sol)+" → "+(r.col?nm(r.col):"mural"),go:"cp"}))}
 if(p==="cp"||p==="ccg"||gest){cadsPend().forEach(k=>o.push({ic:"person_add",t:"Cadastro de "+k.nome+" aguardando validação",sub:"Matrícula "+k.mat,go:p==="ccg"?"ccg":"cp"}))}
 if(p==="ccg"||gest){filaCCG().forEach(r=>o.push({ic:"verified",t:"Permuta "+r.cod+" aguardando aprovação final",sub:nm(r.sol)+" → "+(r.col?nm(r.col):"mural"),go:"ccg"}));
  fotosPend().forEach(x=>o.push({ic:"photo_camera",t:"Troca de foto de "+x.nome+" para analisar",sub:"Matrícula "+x.mat,go:"ccg"}))}
 if(["ccg","esc"].includes(p)||gest)altPend().filter(altMinha).forEach(a=>{const e=S.escalas.find(x=>x.id===a.escala_id)||{};o.push({ic:"edit_calendar",t:"Alteração nos grupos de “"+(e.nome||"escala")+"” para aprovar",sub:a.posto,go:p==="esc"?"escalante":"ccg"})});
 if(p==="cp")altPend().filter(a=>a.solicitante===ME()).forEach(a=>{const e=S.escalas.find(x=>x.id===a.escala_id)||{};o.push({ic:"hourglass_top",t:"Alteração nos grupos de “"+(e.nome||"escala")+"” em análise",sub:"Chefia: "+(a.ok_ccg?"aprovou":"aguardando")+" · Escalante: "+(a.ok_esc?"aprovou":"aguardando"),go:"equipe"})});
 if(p==="ccg"||gest)S.escalas.filter(e=>e.st==="enviada").forEach(e=>o.push({ic:"fact_check",t:"Escala “"+e.nome+"” recebida para aprovação",sub:e.posto,go:"escver",id:e.id}));
 if(p==="ccg"||gest)remPend().forEach(r=>o.push({ic:"person_remove",t:"Pedido de remoção de "+r.guerra+" do posto",sub:r.posto,go:"ccg"}));
 if(p==="cp")remPend().filter(r=>r.solicitante===ME()).forEach(r=>o.push({ic:"hourglass_top",t:"Remoção de "+r.guerra+" em análise pela Chefia",sub:r.posto,go:"efetivo"}));
 if(p==="esc"||gest){S.escalas.filter(e=>e.st==="rascunho").forEach(e=>o.push({ic:e.devolucao?"undo":"edit_calendar",t:e.devolucao?"Escala “"+e.nome+"” devolvida pela Chefia":"Escala “"+e.nome+"” em rascunho",sub:e.devolucao||"Envie à Chefia do Corpo de Guarda para aprovação",go:"escalante"}));
  const cf=conflitos(S.escalas);if(cf.length)o.push({ic:"warning",t:cf.length+" conflito(s) entre escalas",sub:"Mesmo guarda em duas escalas no mesmo dia",go:"escuni"})}
 return o}
function shell(body){
 const p=perfilAtual(),nav=NAV[p]||[],back=["nova","det","enviado","comp","escnova","cpgrupos","escver"].includes(S.tela)||(p==="admin"&&["cp","ccgescalas","escuni","equipe","feriados","panorama"].includes(S.tela))||(window.X_BACK&&X_BACK.has(S.tela));
 const bell=notifs().length;
 return `<header class="top">${back?`<button class="iconbtn" data-a="back" aria-label="Voltar"><span class="ms">arrow_back</span></button>`:""}<img src="${LOGO}" alt="Brasão da Guarda Municipal de São Luís"><h1>${TITULO[S.tela]||""}</h1><button class="iconbtn" data-a="atualizar" aria-label="Atualizar"><span class="ms ${S.carregando?"sync":""}">refresh</span></button><button class="iconbtn" data-a="notifs" aria-label="Notificações"><span class="ms">notifications</span>${bell?`<span class="badge">${bell}</span>`:""}</button></header>
 <main>${body}</main>
 ${nav.length>1?`<nav class="bottom">${nav.map(([t,ic,l])=>`<button class="${S.tela===t||(t==="solic"&&S.tela==="det")?"on":""}" data-a="go" data-t="${t}"><span class="ms">${ic}</span>${l}</button>`).join("")}</nav>`:""}`;
}
const V={};

/* ---------- acesso ---------- */
V.carregando=()=>`<div class="loading"><img src="${LOGO}" alt="" style="height:96px"><div>Carregando…</div></div>`;
V.login=()=>`<main style="padding-bottom:30px">
 <div class="login-hero"><img src="${LOGO}" alt="Brasão da Guarda Municipal de São Luís"><h2 style="margin-top:14px;letter-spacing:.5px">GMSL Digital</h2><p class="sub" style="margin:2px 0 0"><b style="color:var(--gold)">SIGMSL</b> · Sistema Integrado da Guarda Municipal de São Luís</p></div>
 <form id="flogin"><div class="field"><label for="mat">Matrícula</label><input id="mat" inputmode="numeric" autocomplete="username" required placeholder="00000-0"></div>
 <div class="field"><label for="pw">Senha</label><input id="pw" type="password" autocomplete="current-password" required></div>
 <label class="row small" style="cursor:pointer;margin:-4px 0 14px;gap:10px"><input type="checkbox" id="lg-manter" ${(()=>{try{return localStorage.getItem("gmsl_manter")!=="0"}catch(e){return true}})()?"checked":""} style="width:22px;min-height:22px;box-shadow:none;accent-color:#e6c429;flex:none"><span><b style="color:#fff">Continuar conectado</b><span class="muted" style="display:block">Não pede a senha toda vez que abrir o app. Desmarque em celular compartilhado.</span></span></label>
 <div id="lerr"></div><button class="btn gold block">Entrar <span class="ms">login</span></button></form>
 <button class="link" style="display:block;margin:14px auto 0;font-size:13px" data-a="recIniciar">Esqueceu a senha?</button>
 <button class="cadcta" data-a="novoCad"><span class="ic"><span class="ms">person_add</span></span><span style="flex:1"><b style="color:#fff">Primeiro acesso? Solicite seu cadastro</b><div class="muted">Dados, foto 3x4 e selfie. A Coordenação valida e libera o acesso.</div></span><span class="ms">chevron_right</span></button>
 <div class="foot">SECRETARIA MUNICIPAL DE SEGURANÇA COM CIDADANIA<br>Prefeitura Municipal de São Luís · versão piloto</div></main>`;
const recFn=async body=>{try{const r=await fetch(CFG.url+"/functions/v1/recuperar-senha",{method:"POST",headers:{"Content-Type":"application/json",apikey:CFG.key,Authorization:"Bearer "+CFG.key},body:JSON.stringify(body)});const j=await r.json().catch(()=>({}));return r.ok&&j.ok?j:{erro:j.erro||"Não foi possível concluir. Tente de novo."}}catch(x){return{erro:"Sem conexão. Tente de novo."}}};
V.recuperar=()=>{const r=S.rec||{etapa:0};const top=`<header class="top"><button class="iconbtn" data-a="recSair" aria-label="Voltar"><span class="ms">arrow_back</span></button><img src="${LOGO}" alt=""><h1>Recuperar senha</h1></header>`,passos=`<div class="steps">${[0,1,2].map(i=>`<i class="${i<=r.etapa?"on":""}"></i>`).join("")}</div>`;
 if(r.etapa===0)return top+`<main>${passos}<h2 style="margin-top:14px">Esqueceu a senha?</h2><p class="sub">Informe o e-mail ou o CPF do seu cadastro. Vamos mandar um código de 6 números para o e-mail cadastrado.</p>
 <form id="frec1"><div class="field"><label for="rc1">E-mail ou CPF</label><input id="rc1" value="${esc(r.ident||"")}" placeholder="nome@exemplo.com ou 000.000.000-00" autocomplete="username" required></div><div id="rerr"></div><button class="btn gold block">Enviar código <span class="ms">send</span></button></form>
 <p class="muted" style="text-align:center;margin-top:14px">Não tem mais acesso ao e-mail? Procure a Chefia do Corpo de Guarda.</p></main>`;
 if(r.etapa===1)return top+`<main>${passos}<h2 style="margin-top:14px">Digite o código</h2><p class="sub">Se houver cadastro com esses dados, o código foi enviado para <b style="color:#fff">${esc(r.destino||"o e-mail cadastrado")}</b>. Ele vale por 15 minutos. Confira também a caixa de spam.</p>
 <form id="frec2"><div class="field"><label for="rc2">Código</label><input id="rc2" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="000000" required style="letter-spacing:6px;font-size:22px;text-align:center"></div><div id="rerr"></div><button class="btn gold block">Confirmar código</button></form>
 <button class="link" style="display:block;margin:14px auto 0;font-size:13px" data-a="recReenviar">Não chegou? Enviar outro código</button></main>`;
 return top+`<main>${passos}<h2 style="margin-top:14px">Nova senha</h2><p class="sub">Código confirmado. Crie a nova senha.</p>
 <form id="frec3"><div class="field"><label for="rc3">Nova senha</label><input id="rc3" type="password" minlength="6" autocomplete="new-password" required></div><div class="field"><label for="rc4">Confirmar nova senha</label><input id="rc4" type="password" minlength="6" autocomplete="new-password" required></div><div id="rerr"></div><button class="btn gold block">Salvar nova senha</button></form></main>`};
V.pendente=()=>{const m=S.me;return `<main style="text-align:center;padding-top:50px">${foto34(m.fotoPend||m.foto,ini(m),"xl")}
 <h2 style="margin-top:16px">${m.status==="recusado"?"Cadastro recusado":m.status==="inativo"?"Acesso desativado":"Cadastro em análise"}</h2>
 <p class="sub">${m.status==="recusado"?esc(m.motivo||"Procure a Coordenação."):m.status==="inativo"?"Procure a Coordenação.":"A Coordenação vai conferir seus dados e sua selfie. Quando o acesso for liberado, você entra direto por aqui."}</p>
 <div class="card low" style="text-align:left"><div class="kv"><div><span>Nome de guerra</span><b>${esc(m.nome)}</b></div><div><span>Matrícula</span><b>${esc(m.mat)}</b></div><div style="grid-column:1/-1"><span>Lotação</span><b>${esc(m.posto)}</b></div></div></div>
 <button class="btn ghost block" data-a="atualizar"><span class="ms">refresh</span>Verificar de novo</button><button class="btn ghost block" style="margin-top:8px" data-a="sair">Sair</button></main>`};

/* ---------- cadastro ---------- */
const CAD_ETAPAS=["Dados pessoais","Dados funcionais","Fotos","Acesso e envio"];
const cadNovo=()=>({etapa:0,nome:"",guerra:"",tel:"",email:"",cpf:"",mat:"",pat:PATENTES[PATENTES.length-1]||"2ª CL",bm:false,adm:"",posto:POSTOS[0],turno:"07:00 - 19:00 (12x36)",perfil:"gm",foto:null,selfie:null,senha:"",senha2:"",termo:false});
const cin=(k,label,o={})=>`<div class="field"><label for="cf-${k}">${label}${o.req===false?" <span class='muted'>(opcional)</span>":""}</label>${o.sel?`<select id="cf-${k}" data-c="${k}">${o.sel.map(x=>{const[v,l]=Array.isArray(x)?x:[x,x];return `<option value="${esc(v)}" ${S.cad[k]===v?"selected":""}>${esc(l)}</option>`}).join("")}</select>`:`<input id="cf-${k}" data-c="${k}" type="${o.type||"text"}" value="${esc(S.cad[k])}" ${o.ph?`placeholder="${o.ph}"`:""} ${o.im?`inputmode="${o.im}"`:""} ${o.ac?`autocomplete="${o.ac}"`:""} ${o.max?`max="${o.max}"`:""}>`}</div>`;
V.cadastro=()=>{const c=S.cad,e=c.etapa;let body="";
 if(e===0)body=`${cin("nome","Nome completo",{ph:"Como está no documento",ac:"name"})}${cin("guerra","Nome de guerra",{ph:"Como aparece na escala. Ex.: MARY"})}${cin("tel","Celular (WhatsApp)",{ph:"(98) 90000-0000",im:"tel",ac:"tel"})}${cin("cpf","CPF",{ph:"000.000.000-00",im:"numeric"})}${cin("email","E-mail",{type:"email",ph:"nome@exemplo.com",ac:"email"})}<p class="muted" style="margin-top:-6px">O e-mail e o CPF servem para recuperar a senha se você esquecer.</p>`;
 if(e===1)body=`${cin("mat","Matrícula funcional",{ph:"00000-0",im:"numeric"})}${cin("pat","Patente",{sel:PATENTES.map(x=>[x,x+" · "+(PAT_NOME[x]||"")])})}${cin("adm","Data de admissão",{type:"date",max:TODAY})}<div class="field"><label for="cf-posto">Lotação (posto ou setor)</label><select id="cf-posto" data-c="posto">${postoOpts(S.cad.posto)}</select></div><label class="card low row" style="cursor:pointer"><input type="checkbox" data-c="bm" ${S.cad.bm?"checked":""} style="width:22px;min-height:22px;box-shadow:none;accent-color:#e6c429;flex:none"><span class="small">Sou integrante da Banda de Música (BM)</span></label>${cin("turno","Horário atual",{sel:["07:00 - 19:00","19:00 - 07:00","10:00 - 22:00","07:00 - 07:00 (24h)","09:00 - 15:00 (expediente)","Outro"]})}${cin("perfil","Perfil de acesso solicitado",{sel:Object.entries(PERFIL_NOME).filter(([k])=>k!=="admin")})}<div class="note"><span class="ms">info</span><span>Perfis de gestão são liberados pela Chefia depois da aprovação.</span></div>`;
 if(e===2)body=`<div class="row" style="align-items:flex-start;gap:16px"><button class="fotobtn" data-a="fotoInstr" data-k="cad" aria-label="Foto 3x4">${foto34(c.foto,"","lg")}</button><div style="flex:1"><b style="color:#fff">Foto 3x4 do perfil</b><p class="small muted" style="margin:6px 0 10px">Vai aparecer no seu perfil depois que o cadastro for aprovado.</p><button class="btn sm gold" data-a="fotoInstr" data-k="cad"><span class="ms">add_a_photo</span>${c.foto?"Trocar foto":"Adicionar foto"}</button></div></div>
 <div class="hr" style="margin:18px 0"></div>
 <div class="row" style="align-items:flex-start;gap:16px"><label for="upself" style="cursor:pointer">${c.selfie?`<img class="f34" src="${c.selfie}" alt="Selfie">`:`<div class="f34 vazio"><span class="ms">face</span></div>`}</label><div style="flex:1"><b style="color:#fff">Selfie de validação</b><p class="small muted" style="margin:6px 0 10px">Tire agora, segurando a carteira funcional ao lado do rosto. Serve só para a Coordenação confirmar sua identidade.</p><label class="btn sm ghost" for="upself"><span class="ms">photo_camera</span>${c.selfie?"Refazer selfie":"Enviar selfie"}</label><input id="upself" type="file" accept="image/*" capture="user" data-foto="selfie" hidden></div></div>`;
 if(e===3)body=`<div class="grid2">${cin("senha","Senha",{type:"password",ac:"new-password"})}${cin("senha2","Confirmar senha",{type:"password",ac:"new-password"})}</div><p class="muted" style="margin-top:-6px">Mínimo de 6 caracteres. Você vai entrar com a matrícula e essa senha.</p>
 <div class="lbl">Confira seus dados</div><div class="card"><div class="row" style="align-items:flex-start;gap:14px">${foto34(c.foto)}<div class="kv" style="flex:1"><div style="grid-column:1/-1"><span>Nome</span><b>${esc(c.nome)}</b></div><div><span>Nome de guerra</span><b>${esc(c.guerra.replace(/^gcm\s*/i,"").toUpperCase())}</b></div><div><span>Matrícula</span><b>${esc(c.mat)}</b></div></div></div><div class="hr"></div><div class="kv"><div><span>CPF</span><b>${esc(c.cpf)}</b></div><div><span>Celular</span><b>${esc(c.tel)}</b></div><div style="grid-column:1/-1"><span>E-mail</span><b>${esc(c.email)}</b></div><div><span>Patente</span><b>${esc(c.pat)}${c.bm?" · BM":""}</b></div><div><span>Lotação</span><b>${esc(c.posto)}</b></div><div><span>Perfil</span><b>${PERFIL_NOME[c.perfil]}</b></div></div><button class="btn sm ghost" style="margin-top:12px" data-a="cadIr" data-e="0"><span class="ms">edit</span>Corrigir dados</button></div>
 <label class="card low row" style="cursor:pointer;align-items:flex-start"><input type="checkbox" data-c="termo" ${c.termo?"checked":""} style="width:22px;min-height:22px;box-shadow:none;accent-color:#e6c429;flex:none;margin-top:2px"><span class="small">Declaro que as informações são verdadeiras e autorizo a Coordenação a conferi-las com os registros funcionais da Guarda Municipal.</span></label>`;
 return `<header class="top"><button class="iconbtn" data-a="${e?"cadVoltar":"cadSair"}" aria-label="Voltar"><span class="ms">arrow_back</span></button><img src="${LOGO}" alt=""><h1>Solicitar cadastro</h1></header><main style="padding-bottom:30px">
 <div class="steps" style="grid-template-columns:repeat(4,minmax(0,1fr))">${CAD_ETAPAS.map((t,i)=>`<i class="${i<=e?"on":""}"></i>`).join("")}</div>
 <div class="muted" style="margin-top:10px">Etapa ${e+1} de ${CAD_ETAPAS.length}</div><h2 style="margin-bottom:16px">${CAD_ETAPAS[e]}</h2>
 ${body}<div id="cerr"></div>
 <div class="grid2" style="margin-top:8px">${e?`<button class="btn ghost" data-a="cadVoltar">Voltar</button>`:`<button class="btn ghost" data-a="cadSair">Cancelar</button>`}${e<3?`<button class="btn gold" data-a="cadAvancar">Continuar <span class="ms">arrow_forward</span></button>`:`<button class="btn gold" data-a="cadEnviar" id="btnCad">Solicitar <span class="ms">send</span></button>`}</div></main>`};
const fmtCPF=v=>{v=v.replace(/\D/g,"").slice(0,11);let o=v.slice(0,3);if(v.length>3)o+="."+v.slice(3,6);if(v.length>6)o+="."+v.slice(6,9);if(v.length>9)o+="-"+v.slice(9);return o};
const cpfOk=c=>{c=c.replace(/\D/g,"");if(c.length!==11||/^(\d)\1+$/.test(c))return false;for(let t=9;t<11;t++){let s=0;for(let i=0;i<t;i++)s+=+c[i]*(t+1-i);if(((s*10)%11)%10!==+c[t])return false}return true};
const cadValida=e=>{const c=S.cad,er=[];
 if(e===0){if(c.nome.trim().split(/\s+/).length<2)er.push("Informe o nome completo.");if(!c.guerra.trim())er.push("Informe o nome de guerra.");if(c.tel.replace(/\D/g,"").length<10)er.push("Informe um celular com DDD.");if(!cpfOk(c.cpf||""))er.push("Informe um CPF válido.");if(!/^\S+@\S+\.\S+$/.test(c.email))er.push("Informe um e-mail válido. Ele é usado para recuperar a senha.")}
 if(e===1){if(!/^\d{3,8}(-\d)?$/.test(c.mat.trim()))er.push("Informe a matrícula funcional como está na escala (só números).");if(!c.adm)er.push("Informe a data de admissão.")}
 if(e===2){if(!c.foto)er.push("Adicione a foto 3x4.");if(!c.selfie)er.push("Envie a selfie de validação.")}
 if(e===3){if(c.senha.length<6)er.push("A senha precisa ter pelo menos 6 caracteres.");if(c.senha!==c.senha2)er.push("As senhas não conferem.");if(!c.termo)er.push("Marque a declaração de veracidade.")}
 errBox("cerr",er);return !er.length};
V.cadastrook=()=>`<main style="padding-top:50px;text-align:center"><span class="ms fill" style="font-size:72px;color:var(--green);width:auto;height:auto">verified</span><h2 style="margin-top:12px">Cadastro solicitado</h2><p class="sub">Protocolo <b style="color:#fff">${esc(S.param||"")}</b></p>
 <div class="card low" style="text-align:left"><b>O que acontece agora</b><ol class="small" style="margin:8px 0 0;padding-left:18px"><li>A Coordenação confere seus dados e a selfie</li><li>Entre com sua matrícula e senha para acompanhar</li><li>Quando for liberado, o app abre direto</li></ol></div>
 <button class="btn gold block" data-a="irLogin">Ir para o login</button></main>`;

/* ---------- foto: instruções ---------- */
const FOTO_OK=["Do pescoço para cima, rosto centralizado","De frente, olhando para a câmera","Expressão neutra, olhos abertos","Fundo claro e liso","Boa iluminação, sem sombra no rosto","Fardado, com a gola aparecendo"];
const FOTO_NAO=["Óculos (escuros ou de grau)","Boné, chapéu, capuz ou cobertura","Filtros, figurinhas ou edição","Outras pessoas ou objetos","Foto de outra foto ou da tela","Selfie de longe ou de corpo inteiro"];
const GUIA_SVG=`<svg viewBox="0 0 90 120" width="90" height="120" role="img" aria-label="Exemplo de enquadramento 3x4" style="flex:none;border-radius:3px"><rect width="90" height="120" fill="#e9eef4"/><path d="M8 120c2-22 16-30 37-30s35 8 37 30z" fill="#16325c"/><path d="M33 92l12 14 12-14z" fill="#e9eef4"/><path d="M38 78h14v14H38z" fill="#c99b7a"/><ellipse cx="45" cy="56" rx="17" ry="22" fill="#d9ab88"/><path d="M28 50c0-14 8-20 17-20s17 6 17 20c-4-6-10-9-17-9s-13 3-17 9z" fill="#3a2a20"/><line x1="4" y1="31" x2="86" y2="31" stroke="#2e9e5b" stroke-width="1.2" stroke-dasharray="3 2"/><line x1="4" y1="79" x2="86" y2="79" stroke="#2e9e5b" stroke-width="1.2" stroke-dasharray="3 2"/><text x="86" y="28" font-size="6.5" text-anchor="end" fill="#2e9e5b" font-family="Public Sans,sans-serif">topo da cabeça</text><text x="86" y="87" font-size="6.5" text-anchor="end" fill="#2e9e5b" font-family="Public Sans,sans-serif">queixo</text></svg>`;
async function lerFoto(file,w,h){const url=URL.createObjectURL(file);try{const img=new Image();await new Promise((ok,er)=>{img.onload=ok;img.onerror=er;img.src=url});const c=document.createElement("canvas");c.width=w;c.height=h;const r=Math.max(w/img.naturalWidth,h/img.naturalHeight),sw=w/r,sh=h/r;const x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,w,h);x.drawImage(img,(img.naturalWidth-sw)/2,(img.naturalHeight-sh)/2,sw,sh,0,0,w,h);return c.toDataURL("image/jpeg",.85)}finally{URL.revokeObjectURL(url)}}
const dataUrlBlob=d=>{const[h,b]=d.split(",");const bin=atob(b);const u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return new Blob([u],{type:"image/jpeg"})};

/* ---------- guarda ---------- */
V.inicio=()=>{const me=S.me,h=dia(ME(),TODAY),mesH=horasMes(ME(),mesDe(TODAY)),pm=paraMim(),mu=mural().filter(r=>r.sol!==ME());
 return shell(`<div class="idcard">${foto34(me.foto,ini(me),"lg")}<div style="position:relative"><span class="tag gold">Identificação funcional</span><div style="font-size:22px;font-weight:800;color:#fff;margin-top:6px">${esc(me.nome.toUpperCase())}</div><div class="muted">Matrícula ${esc(me.mat)}</div><div class="small">${esc(patTxt(me))} · ${esc(me.posto)}</div></div></div>
 <div class="card low row" style="margin-top:10px"><span class="ms fill" style="color:${trabalha(ME(),TODAY)?"var(--gold)":"var(--mute)"}">${trabalha(ME(),TODAY)?"shield":"bedtime"}</span><div style="flex:1"><b>${trabalha(ME(),TODAY)?"Você está de serviço hoje":h.t==="sem"?"Sem escala publicada para hoje":"Folga hoje"}</b><div class="muted">${trabalha(ME(),TODAY)?esc((h.hor||"")+" · "+(h.nota||"")):(()=>{const p=proximos(ME(),add(TODAY,1),1)[0];return p?"Próximo serviço: "+fd(p):"O Escalante ainda não publicou sua escala."})()}</div></div></div>
 ${S.avisos.map(a=>`<div class="banner"><span class="ms">campaign</span><span style="flex:1">${esc(a.texto)}</span><button class="link" style="font-size:12px" data-a="avisoOk" data-id="${a.id}">Ok</button></div>`).join("")}
 ${pm.length?`<div class="lbl between"><span>Pedidos de permuta para você</span><span class="tag red">${pm.length}</span></div>${pm.map(r=>`<div class="card" style="box-shadow:inset 4px 0 0 var(--gold)"><div class="row">${av(r.sol)}<div style="flex:1"><b style="color:#fff">${esc(g(r.sol).nome)}</b><div class="muted">${r.cod} · ${esc(r.posto)}</div></div></div><div class="kv" style="margin-top:10px"><div><span>Você cobre</span><b>${fd(r.saida.data)}</b><div class="muted">${r.saida.ini} às ${r.saida.fim}</div></div><div><span>Ele repõe</span><b>${fd(r.repos.data)}</b></div></div>${r.obs?`<div class="muted" style="margin-top:6px">“${esc(r.obs)}”</div>`:""}<div class="grid2" style="margin-top:12px"><button class="btn sm red" data-a="responder" data-id="${r.id}" data-v="0">Recusar</button><button class="btn sm gold" data-a="responder" data-id="${r.id}" data-v="1">Aceitar</button></div></div>`).join("")}`:""}
 <div class="grid2" style="margin-top:10px"><button class="pick on" data-a="nova" style="min-height:96px"><span class="ms" style="font-size:30px;width:auto;height:auto">swap_horiz</span>Solicitar permuta</button><button class="pick" data-a="go" data-t="solic" style="min-height:96px"><span class="ms" style="font-size:30px;width:auto;height:auto">history</span>Minhas trocas</button></div>
 <div class="lbl between"><span>Mural de permutas</span><span class="tag gold">${mu.length} abertas</span></div>
 ${mu.slice(0,2).map(muralCard).join("")||`<div class="empty">Nenhuma oferta aberta.</div>`}
 <button class="btn ghost block" data-a="go" data-t="mural">Ver o mural</button>
 <div class="lbl">${MESF[parse(TODAY).getMonth()]}</div>
 <div class="card"><div class="row between"><span class="small">Serviços no mês</span><b>${mesH.n}</b></div><div class="row between"><span class="small">Horas de serviço</span><b>${mesH.h} h</b></div><div class="row between"><span class="small">Permutas no mês</span><b>${contaMes(ME(),TODAY)} de ${LIMITE_MES}</b></div></div>
 <div class="lbl">Documentos</div><div class="card low"><button class="list-item" style="width:100%;background:none;border:0;cursor:pointer;text-align:left" data-a="comp" data-p="escala:${mesDe(TODAY)}"><span class="ms">calendar_month</span><span style="flex:1"><b>Comprovante de escala</b><div class="muted">Serviços e horas do mês em PDF</div></span><span class="ms">chevron_right</span></button></div>`)};
function muralCard(r){const a=g(r.sol),mine=r.sol===ME();return `<div class="card"><div class="row between"><div class="row">${av(r.sol)}<div><b>${esc(a.nome)}</b><div class="muted">${esc(r.posto)}</div></div></div><span class="muted">${r.criado===TODAY?"Hoje":fds(r.criado)}</span></div>
 <div class="kv" style="margin-top:12px"><div><span>Serviço a cobrir</span><b>${fd(r.saida.data)}</b><div class="muted">${r.saida.ini} às ${r.saida.fim}</div></div><div><span>Reposição oferecida</span><b>${fd(r.repos.data)}</b></div></div>
 ${r.obs?`<div class="muted" style="margin-top:6px">“${esc(r.obs)}”</div>`:""}
 ${mine?`<div class="note" style="margin-top:12px"><span class="ms">campaign</span>Sua oferta. Aguardando um interessado.</div>`:`<button class="btn gold block sm" style="margin-top:12px" data-a="aceitarMural" data-id="${r.id}">Tenho interesse</button>`}</div>`}
V.mural=()=>{const posto=S.fPosto||"",l=mural().filter(r=>!posto||r.posto===posto).sort((a,b)=>a.saida.data<b.saida.data?-1:1);
 return shell(`<h2>Mural de Permutas</h2><p class="sub">Ofertas de troca publicadas pela tropa. Quem demonstra interesse assume o serviço e a troca segue para o Coordenador de Posto.</p>
 <div class="field"><label for="fposto">Filtrar por posto</label><select id="fposto" data-sel="fPosto"><option value="">Todos os postos</option>${postoOpts(posto)}</select></div>
 ${l.map(muralCard).join("")||`<div class="empty">Nenhuma oferta aberta.</div>`}
 <button class="btn ghost block" data-a="nova" data-mural="1"><span class="ms">add</span>Publicar oferta no mural</button>`)};
V.escala=()=>{const base=parse(TODAY);base.setDate(1);base.setMonth(base.getMonth()+S.mesOff);const y=base.getFullYear(),m=base.getMonth(),mes=y+"-"+pad(m+1);
 const first=new Date(y,m,1).getDay(),start=add(iso(new Date(y,m,1)),-first);let cells="";
 for(let i=0;i<42;i++){const s=add(start,i),d=parse(s),inM=d.getMonth()===m,x=dia(ME(),s);if(i>=35&&!inM&&d.getDay()===0)break;
  cells+=`<button class="d ${inM?"":"out"} ${s===TODAY?"today":""}" data-a="dia" data-s="${s}" aria-label="${fd(s)}">${d.getDate()}${["regular","coberto","cobrindo"].includes(x.t)?`<i class="k-${x.t}"></i>`:""}</button>`}
 const sel=S.diaSel||TODAY,xs=dia(ME(),sel),hm2=horasMes(ME(),mes);
 const lab={regular:"Serviço · "+(xs.hor||""),coberto:"Serviço permutado",cobrindo:"Cobrindo colega · "+(xs.hor||""),folga:"Folga",sem:"Sem escala publicada"};
 return shell(`<div class="row between" style="margin-bottom:12px"><h2 style="margin:0">${MESF[m]} ${y}</h2><div class="row" style="gap:4px"><button class="iconbtn" data-a="mes" data-d="-1" aria-label="Mês anterior"><span class="ms">chevron_left</span></button><button class="iconbtn" data-a="mes" data-d="1" aria-label="Próximo mês"><span class="ms">chevron_right</span></button></div></div>
 <div class="cal">${SEM.map(d=>`<div class="h">${d}</div>`).join("")}${cells}</div>
 <div class="legend"><span><i class="k-regular"></i>Serviço</span><span><i class="k-cobrindo"></i>Cobrindo / reposição</span><span><i class="k-coberto"></i>Permutado</span></div>
 <div class="card" style="margin-top:14px"><div class="muted">${fd(sel)}</div><b style="font-size:17px;color:#fff">${lab[xs.t]}</b>${xs.nota&&xs.t!=="sem"?`<div class="small">${esc(xs.nota)}</div>`:""}${xs.t==="regular"&&sel>TODAY?`<button class="btn gold sm" style="margin-top:10px" data-a="nova" data-s="${sel}">Pedir permuta deste dia</button>`:""}</div>
 <div class="grid2"><div class="card low"><div class="muted">Serviços</div><div class="big">${hm2.n}</div></div><div class="card low"><div class="muted">Horas</div><div class="big">${hm2.h}h</div></div></div>
 <button class="btn ghost block" data-a="comp" data-p="escala:${mes}"><span class="ms">picture_as_pdf</span>Comprovante da escala de ${MESF[m].toLowerCase()}</button>`)};
V.solic=()=>{const f=S.filtro,all=minhas().sort((a,b)=>b.id-a.id);
 const list=all.filter(r=>{const k=status(r).k;return f==="todas"||(f==="pend"&&k==="pend")||(f==="ok"&&k==="ok")||(f==="fim"&&k==="fim")});
 return shell(`<h2>Minhas trocas</h2><p class="sub">Permutas que você pediu ou que está cobrindo.</p>
 <div class="tabs">${[["todas","Todas"],["pend","Em andamento"],["ok","Aprovadas"],["fim","Encerradas"]].map(([k,l])=>`<button class="chip ${f===k?"on":""}" data-a="filtro" data-f="${k}">${l}</button>`).join("")}</div>
 <div class="card low small" style="display:flex;flex-wrap:wrap;gap:6px 14px"><span><span class="dot" style="display:inline-block;vertical-align:-1px"></span> aguardando</span><span><span class="dot red" style="display:inline-block;vertical-align:-1px"></span> colega aceitou</span><span><span class="dot blue" style="display:inline-block;vertical-align:-1px"></span> Coord. de Posto</span><span><span class="dot green" style="display:inline-block;vertical-align:-1px"></span> Chefia</span></div>
 ${list.map(r=>{const st=status(r),outro=r.sol===ME()?r.col:r.sol;return `<div class="card"><div class="row between"><div><div class="muted">${r.cod} · ${esc(r.posto)}</div><b style="color:#fff">${r.sol===ME()?(r.tipo==="mural"&&!r.col?"Oferta no mural":"Você pediu a troca"):"Você está cobrindo"}</b></div>${dots(r)}</div>
 <div class="kv" style="margin-top:10px"><div><span>Serviço original</span><b>${fd(r.saida.data)}</b></div><div><span>Reposição</span><b>${fd(r.repos.data)}</b></div></div>
 ${st.k==="fim"&&r.motivo?`<div class="err" style="margin:12px 0 0"><span class="ms">block</span><span><b>Motivo:</b> ${esc(r.motivo)}</span></div>`:""}
 <div class="row between" style="margin-top:12px"><span class="tag ${st.c}">${st.t}</span><span class="row"><span class="muted">${outro?esc(g(outro).nome):""}</span><button class="btn sm ghost" data-a="go" data-t="det" data-id="${r.id}">Detalhes</button></span></div></div>`}).join("")||`<div class="empty">Nada por aqui.</div>`}
 <button class="btn gold block" data-a="nova"><span class="ms">add</span>Nova solicitação</button>`)};
const novoDraft=(o={})=>{const me=S.me;const h=(me.turno||"").match(/(\d\d:\d\d)\s*-\s*(\d\d:\d\d)/);return{saida:null,posto:me.posto,ini:h?h[1]:"07:00",fim:h?h[2]:"19:00",tipo:"direta",col:"",combinar:false,repos:null,obs:"",...o}};
V.nova=()=>{const d=S.draft,col=d.col?g(d.col):null,meus=proximos(ME(),add(TODAY,1),6),dele=col?proximos(col.id,add(TODAY,1),10).filter(s=>s!==d.saida&&!trabalha(ME(),s)).slice(0,6):[];
 return shell(`${!meus.length?`<div class="err"><span class="ms">event_busy</span>Você não tem serviços publicados nos próximos dias. A permuta só pode ser pedida para um dia em que você está escalado.</div>`:""}
 <div class="lbl"><span class="ms" style="font-size:18px">logout</span>Serviço de saída</div>
 <div class="field"><label for="n1">Data do serviço</label><input id="n1" type="date" data-k="saida" value="${d.saida||""}" min="${add(TODAY,1)}"><div class="chips">${meus.map(s=>`<button class="chip ${d.saida===s?"on":""}" data-a="setd" data-k="saida" data-s="${s}">${fds(s)} ${SEM[parse(s).getDay()]}</button>`).join("")}</div></div>
 <div class="field"><label for="n2">Posto de serviço</label><select id="n2" data-k="posto">${postoOpts(d.posto)}</select></div>
 <div class="grid2"><div class="field"><label for="n3">Início</label><input id="n3" type="time" data-k="ini" value="${d.ini}"></div><div class="field"><label for="n4">Término</label><input id="n4" type="time" data-k="fim" value="${d.fim}"></div></div>
 <div class="lbl"><span class="ms" style="font-size:18px">groups</span>Modalidade</div>
 <div class="grid2" style="margin-bottom:14px"><button class="pick ${d.tipo==="direta"?"on":""}" data-a="tipo" data-v="direta"><span class="ms">person_search</span>Troca direta</button><button class="pick ${d.tipo==="mural"?"on":""}" data-a="tipo" data-v="mural"><span class="ms">campaign</span>Publicar no mural</button></div>
 ${d.tipo==="direta"?`<div class="field"><label for="n5">Colega (nome de guerra)</label><select id="n5" data-k="col"><option value="">Selecione o colega…</option>${ativos().filter(x=>x.id!==ME()).sort((a,b)=>a.nome.localeCompare(b.nome)).map(x=>`<option value="${x.id}" ${x.id===d.col?"selected":""}>${esc(x.nome)} · ${esc(x.mat)}</option>`).join("")}</select></div>`:`<div class="note" style="margin-bottom:14px"><span class="ms">campaign</span>A oferta fica visível para toda a tropa até alguém assumir.</div>`}
 <div class="lbl"><span class="ms" style="font-size:18px">login</span>Reposição</div>
 <label class="card low row" style="cursor:pointer"><input type="checkbox" data-k="combinar" ${d.combinar?"checked":""} style="width:22px;min-height:22px;box-shadow:none;accent-color:#e6c429"><span><b>Data a combinar depois</b><div class="muted">Vocês informam a data pelo app mais tarde.</div></span></label>
 ${d.combinar?`<div class="note gold" style="margin-bottom:14px"><span class="ms">gavel</span><span>O solicitante e o colega combinarão uma forma de compensação mútua, que pode incluir ajuste de escalas futuras.</span></div>`:`<div class="field"><label for="n6">Data em que o serviço será pago</label><input id="n6" type="date" data-k="repos" value="${d.repos||""}" min="${add(TODAY,1)}">${col?`<div class="chips">${dele.map(s=>`<button class="chip ${d.repos===s?"on":""}" data-a="setd" data-k="repos" data-s="${s}">${fds(s)} ${SEM[parse(s).getDay()]}</button>`).join("")}</div><div class="muted" style="margin-top:6px">${dele.length?"Próximos serviços de "+esc(col.nome)+".":"Nenhum serviço publicado para "+esc(col.nome)+"."}</div>`:""}</div>`}
 <div class="field"><label for="n7">Observações</label><textarea id="n7" data-k="obs" placeholder="Informações para a chefia imediata…">${esc(d.obs)}</textarea></div>
 <div id="nerr"></div>
 <button class="btn gold block" data-a="enviar" id="btnEnviar">Enviar solicitação <span class="ms">send</span></button>
 <p class="muted" style="text-align:center">A aprovação final depende do Coordenador de Posto e da Chefia do Corpo de Guarda.</p>`)};
V.enviado=()=>{const r=S.reqs.find(x=>x.id===+S.param);if(!r)return shell(`<div class="empty">Enviado.</div>`);return shell(`<div style="text-align:center;padding:20px 0"><span class="ms fill" style="font-size:72px;color:var(--gold);width:auto;height:auto">task_alt</span><h2>Solicitação enviada</h2><p class="sub">Protocolo <b style="color:#fff">${r.cod}</b></p></div>
 <div class="card"><div class="kv"><div><span>Serviço de saída</span><b>${fd(r.saida.data)}</b></div><div><span>Reposição</span><b>${fd(r.repos.data)}</b></div><div><span>Posto</span><b>${esc(r.posto)}</b></div><div><span>${r.col?"Colega":"Modalidade"}</span><b>${r.col?esc(g(r.col).nome):"Mural"}</b></div></div></div>
 <div class="card low"><b>Próximos passos</b><ol class="small" style="margin:8px 0 0;padding-left:18px"><li>${r.col?esc(g(r.col).nome)+" aceita pelo app":"Um colega assume pelo mural"}</li><li>O Coordenador de Posto valida</li><li>A Chefia do Corpo de Guarda aprova</li><li>A escala dos dois é atualizada</li></ol></div>
 <button class="btn gold block" data-a="go" data-t="det" data-id="${r.id}">Acompanhar</button><button class="btn ghost block" style="margin-top:8px" data-a="comp" data-p="permuta:${r.id}"><span class="ms">receipt_long</span>Protocolo em PDF</button>`)};
V.det=()=>{const r=S.reqs.find(x=>x.id===+S.param);if(!r)return shell(`<div class="empty">Solicitação não encontrada.</div>`);const st=status(r),coli=r.col?g(r.col).nome:"Colega (via mural)";
 const step=(ok,no,ic,t,sub)=>`<div class="step ${ok?"ok":no?"no":""}"><div class="ic"><span class="ms">${ok?"check":no?"close":ic}</span></div><div style="flex:1"><div class="row between"><b>${t}</b><span class="tag ${ok?"green":no?"red":""}">${ok?"Aprovado":no?"Recusado":"Pendente"}</span></div><div class="muted">${sub}</div></div></div>`;
 const eu=ME(),p=perfilAtual();
 return shell(`<div class="row between"><span class="muted">${r.cod}</span><span class="tag ${st.c}">${st.t}</span></div>
 <div class="lbl">Servidores</div><div class="card"><div class="kv"><div><span>Solicitante</span><b>${esc(g(r.sol).nome)}</b></div><div><span>Colega</span><b>${esc(coli)}</b></div><div style="grid-column:1/-1"><span>Posto</span><b>${esc(r.posto)}</b></div></div></div>
 <div class="lbl">Datas</div><div class="card"><div class="kv"><div><span>Serviço original</span><b>${fd(r.saida.data)}</b><div class="muted">${r.saida.ini} às ${r.saida.fim}</div></div><div><span>Reposição</span><b style="${r.repos.data?"":"color:var(--gold)"}">${fd(r.repos.data)}</b>${r.repos.data?`<div class="muted">${r.repos.ini} às ${r.repos.fim}</div>`:""}</div></div>
 ${!r.repos.data&&st.k!=="fim"&&(r.sol===eu||r.col===eu)?`<div class="hr"></div><div class="row"><input type="date" id="rdata" min="${add(TODAY,1)}" style="flex:1"><button class="btn sm gold" data-a="informarRepos" data-id="${r.id}">Informar</button></div><div class="muted" style="margin-top:6px">Informe a data combinada para a reposição.</div>`:""}</div>
 ${r.obs?`<div class="card low small"><b>Observações:</b> ${esc(r.obs)}</div>`:""}
 <div class="lbl">Fluxo de aprovação</div><div class="card">
 ${step(r.et.col==="aceito",r.et.col==="recusado","person","Aceite do colega",r.et.col==="aceito"?(r.msgCol?"“"+esc(r.msgCol)+"”":esc(coli)+" aceitou"):r.et.col==="recusado"?esc(r.motivo||""):r.col?"Aguardando "+esc(coli):"Aguardando interessado no mural")}
 ${step(r.et.cp==="aprovado",r.et.cp==="recusado","shield_person","Coordenador de Posto",r.et.cp==="aprovado"?"Validada":r.et.cp==="recusado"?esc(r.motivo||""):r.et.col==="aceito"?"Em análise":"Aguardando etapa anterior")}
 ${step(r.et.ccg==="aprovado",r.et.ccg==="recusado","stars","Chefia do Corpo de Guarda",r.et.ccg==="aprovado"?"Aprovada. Escalas atualizadas.":r.et.ccg==="recusado"?esc(r.motivo||""):r.et.cp==="aprovado"?"Em análise":"Aguardando etapas anteriores")}</div>
 ${r.col===eu&&r.et.col==="pendente"&&!r.cancel?`<div class="grid2" style="margin-bottom:8px"><button class="btn red" data-a="responder" data-id="${r.id}" data-v="0">Recusar</button><button class="btn gold" data-a="responder" data-id="${r.id}" data-v="1">Aceitar</button></div>`:""}
 ${(p==="cp"||p==="admin")&&r.et.col==="aceito"&&r.et.cp==="pendente"&&!r.cancel?`<div class="grid2" style="margin-bottom:8px"><button class="btn red" data-a="decidir" data-papel="cp" data-v="0" data-id="${r.id}">Indeferir</button><button class="btn gold" data-a="decidir" data-papel="cp" data-v="1" data-id="${r.id}">Validar</button></div>`:""}
 ${(p==="ccg"||p==="admin")&&r.et.cp==="aprovado"&&r.et.ccg==="pendente"&&!r.cancel?`<div class="grid2" style="margin-bottom:8px"><button class="btn red" data-a="decidir" data-papel="ccg" data-v="0" data-id="${r.id}">Indeferir</button><button class="btn gold" data-a="decidir" data-papel="ccg" data-v="1" data-id="${r.id}">Aprovar</button></div>`:""}
 ${!r.cancel?`<button class="btn ${st.k==="ok"?"gold":"ghost"} block" style="margin-bottom:8px" data-a="comp" data-p="permuta:${r.id}"><span class="ms">${st.k==="ok"?"verified":"receipt_long"}</span>${st.k==="ok"?"Comprovante de permuta (PDF)":"Protocolo da solicitação (PDF)"}</button>`:""}
 ${st.k==="pend"&&r.sol===eu?`<button class="btn red block" data-a="cancelar" data-id="${r.id}"><span class="ms">cancel</span>Cancelar solicitação</button>`:""}`)};
V.perfil=()=>{const me=S.me,p=perfilAtual();
 return shell(`<div class="card" style="text-align:center;padding:22px 16px"><div style="display:inline-block;position:relative">${foto34(me.foto,ini(me),"xl")}${me.fotoPendPath?`<span class="tag blue" style="position:absolute;left:50%;bottom:-10px;transform:translateX(-50%)">em análise</span>`:""}</div>
 <div style="font-size:22px;font-weight:800;color:#fff;margin-top:16px">${esc(me.nome.toUpperCase())}</div><div class="muted">${PERFIL_NOME[p]} · Matrícula ${esc(me.mat)}</div>
 ${me.fotoPendPath?`<div class="card low row" style="text-align:left;margin:14px 0 0">${me.fotoPend?`<img class="f34" src="${esc(me.fotoPend)}" alt="Nova foto">`:""}<div style="flex:1"><b style="color:#fff">Nova foto enviada para análise</b><div class="muted">Ela só aparece no perfil depois que a Chefia do Corpo de Guarda aprovar.</div><button class="link" style="margin-top:8px;font-size:13px" data-a="fotoInstr" data-k="troca">Substituir</button></div></div>`
 :`${me.fotoMotivo?`<div class="err" style="text-align:left;margin:14px 0 0"><span class="ms">block</span><span><b>Foto recusada:</b> ${esc(me.fotoMotivo)}</span></div>`:""}<button class="btn sm ghost" style="margin-top:14px" data-a="fotoInstr" data-k="troca"><span class="ms">add_a_photo</span>${me.foto?"Solicitar troca de foto":"Enviar foto 3x4"}</button><p class="muted" style="margin:8px 0 0">Toda troca de foto passa pela análise da Coordenação.</p>`}</div>
 <div class="lbl">Dados funcionais</div><div class="card low"><div class="kv"><div style="grid-column:1/-1"><span>Nome completo</span><b>${esc(me.nomeC)}</b></div><div><span>Patente</span><b>${esc(patTxt(me))}</b></div>${habTxt(me)?`<div><span>Habilitação</span><b>${habTxt(me)}</b></div>`:""}<div><span>Admissão</span><b>${d10(me.adm)}</b></div><div><span>Lotação</span><b>${esc(me.posto)}</b></div><div><span>Turno</span><b>${esc(me.turno||"—")}</b></div></div></div>
 <div class="lbl">Contato</div><div class="card low"><div class="kv"><div><span>Celular</span><b>${esc(me.tel||"—")}</b></div><div><span>E-mail</span><b style="overflow-wrap:anywhere">${esc(me.email||"—")}</b></div></div><button class="btn sm ghost" style="margin-top:12px" data-a="editContato"><span class="ms">edit</span>Editar contato</button></div>
 <p class="muted">Dados funcionais errados: procure a Coordenação.</p>
 <button class="btn ghost block" data-a="trocarSenha"><span class="ms">key</span>Trocar senha</button>
 <button class="btn ghost block" style="margin-top:8px" data-a="sair"><span class="ms">logout</span>Sair</button>`)};
V.breve=()=>shell(`<div style="text-align:center;padding-top:40px"><span class="ms" style="font-size:64px;color:var(--gold);width:auto;height:auto">construction</span><h2>Módulo na próxima versão</h2><p class="sub">As telas de ${PERFIL_NOME[perfilAtual()]} entram na segunda versão do piloto.</p></div>`);

/* ---------- gestão ---------- */
const filaCard=(r,papel)=>{const a=g(r.sol),b=r.col?g(r.col):null,mes=contaMes(r.sol,r.saida.data),livre=b&&!trabalha(b.id,r.saida.data);return `<div class="card"><div class="row between"><div class="row">${av(r.sol)}<div><b>${esc(a.nome)} → ${b?esc(b.nome):"?"}</b><div class="muted">${esc(r.posto)}</div></div></div><span class="tag">${r.cod}</span></div>
 <div class="kv" style="margin-top:12px"><div><span>Saída</span><b>${fd(r.saida.data)}</b></div><div><span>Reposição</span><b>${fd(r.repos.data)}</b></div></div>
 ${r.obs?`<div class="muted" style="margin-top:8px">“${esc(r.obs)}”</div>`:""}
 <div class="chips" style="margin-top:10px"><span class="tag ${livre?"green":"red"}">${livre?"Colega livre no dia":"Conflito de escala"}</span><span class="tag ${mes<=LIMITE_MES?"green":"red"}">${mes}/${LIMITE_MES} no mês</span></div>
 <div class="grid2" style="margin-top:12px"><button class="btn sm red" data-a="decidir" data-papel="${papel}" data-v="0" data-id="${r.id}">Indeferir</button><button class="btn sm gold" data-a="decidir" data-papel="${papel}" data-v="1" data-id="${r.id}">${papel==="cp"?"Validar":"Aprovar"}</button></div></div>`};
const cadCard=k=>{const pode=["ccg","admin"].includes(perfilAtual());return `<div class="card"><div class="row" style="align-items:flex-start;gap:12px">${foto34(k.fotoPend,ini(k))}<div style="flex:1"><b style="color:#fff">${esc(k.nome)}</b><div class="muted">${esc(k.nomeC)}</div><div class="small">Matrícula ${esc(k.mat)} · ${esc(patTxt(k))}</div>${k.motivo?`<div class="small" style="color:var(--red)">${esc(k.motivo)}</div>`:""}<div class="small">${esc(k.posto)} · pediu: ${PERFIL_NOME[k.perfilSol]||"Guarda"}</div><div class="small muted">${esc(k.tel||"")}</div></div></div>
 ${k.selfie?`<div class="row small muted" style="margin-top:10px"><img src="${esc(k.selfie)}" alt="Selfie" style="width:64px;height:84px;object-fit:cover;border-radius:3px">Selfie com a carteira funcional. Confira o rosto e a matrícula.</div>`:""}
 ${pode?`<div class="field" style="margin-top:10px"><label for="pf-${k.id}">Liberar como</label><select id="pf-${k.id}">${Object.entries(PERFIL_NOME).filter(([x])=>x!=="admin"||perfilAtual()==="admin").map(([x,l])=>`<option value="${x}" ${x===(k.perfilSol||"gm")?"selected":""}>${l}</option>`).join("")}</select></div>`:k.perfilSol&&k.perfilSol!=="gm"?`<div class="note" style="margin-top:10px"><span class="ms">info</span>Pediu perfil de gestão: você libera como Guarda e a Chefia ajusta o perfil depois.</div>`:""}
 <div class="grid2" style="margin-top:12px"><button class="btn sm red" data-a="cadDecidir" data-v="0" data-id="${k.id}">Recusar</button><button class="btn sm gold" data-a="cadDecidir" data-v="1" data-id="${k.id}">Liberar acesso</button></div></div>`};
const fotoCard=x=>`<div class="card"><div class="row between"><b style="color:#fff">${esc(x.nome)}</b><span class="muted">${esc(x.mat)}</span></div><div class="row" style="gap:14px;margin-top:12px;justify-content:center"><div style="text-align:center">${foto34(x.foto,ini(x),"lg")}<div class="muted" style="margin-top:4px">Atual</div></div><span class="ms" style="color:var(--gold)">arrow_forward</span><div style="text-align:center">${foto34(x.fotoPend,"","lg")}<div class="muted" style="margin-top:4px">Nova</div></div></div><div class="note" style="margin-top:12px"><span class="ms">rule</span>Confira: é o servidor, de frente, do pescoço para cima, sem óculos ou boné, fundo claro.</div><div class="grid2" style="margin-top:12px"><button class="btn sm red" data-a="fotoDecidir" data-v="0" data-id="${x.id}">Recusar</button><button class="btn sm gold" data-a="fotoDecidir" data-v="1" data-id="${x.id}">Aprovar foto</button></div></div>`;
V.cp=()=>{const f=filaCP(),c=cadsPend(),me=S.me,hj=ativos().filter(x=>x.posto===me.posto&&trabalha(x.id,TODAY));
 return shell(`<div class="idcard">${foto34(me.foto,ini(me),"lg")}<div style="position:relative"><span class="tag gold">${PERFIL_NOME[perfilAtual()]}</span><div style="font-size:20px;font-weight:800;color:#fff;margin-top:6px">${esc(me.nome)}</div><div class="muted">${esc(me.posto)}</div></div></div>
 <div class="grid2" style="margin-top:10px"><div class="card low"><div class="muted">Efetivo do posto</div><div class="big">${ativos().filter(x=>x.posto===me.posto).length}</div></div><div class="card low"><div class="muted">De serviço hoje</div><div class="big">${hj.length}</div></div></div>
 <div class="lbl between"><span>Permutas para validar</span>${f.length?`<span class="tag gold">${f.length}</span>`:""}</div>
 ${f.map(r=>filaCard(r,"cp")).join("")||`<div class="empty">Nenhuma permuta aguardando.</div>`}
 ${c.length?`<div class="lbl between"><span>Cadastros aguardando</span><span class="tag gold">${c.length}</span></div>${c.map(cadCard).join("")}`:""}
 <div class="lbl">De serviço hoje · ${fds(TODAY)}</div><div class="card">${hj.map(x=>`<div class="list-item">${av(x.id)}<div style="flex:1"><b>${esc(x.nome)}</b><div class="muted">${esc(dia(x.id,TODAY).hor||"")} · ${esc(dia(x.id,TODAY).nota||"")}</div></div></div>`).join("")||`<div class="muted">Ninguém escalado hoje neste posto.</div>`}</div>`)};
V.equipe=()=>{const me=S.me,ehCp=perfilAtual()==="cp",posto=ehCp?me.posto:(S.eqPosto||me.posto),nP=matsDoPosto(posto),ps=ativos().filter(x=>nP.has(x.mat)),dias=[0,1,2,3,4,5,6].map(i=>add(TODAY,i));
 return shell(`<h2>Equipe do posto</h2>${ehCp?`<p class="sub">${esc(posto)} · guardas escalados neste posto.</p>`:`<div class="field"><select data-sel="eqPosto">${postoOpts(posto)}</select></div>`}
 <div class="card scroll"><table class="egrid fit"><thead><tr><th></th>${dias.map(s=>`<th>${SEM[parse(s).getDay()].slice(0,1).toUpperCase()}<br>${parse(s).getDate()}</th>`).join("")}</tr></thead><tbody>${ps.map(x=>`<tr><td class="nm">${esc(x.nome.replace("GCM ",""))}</td>${dias.map(s=>{const t=dia(x.id,s).t;return `<td><span class="cell k-${["regular","coberto","cobrindo"].includes(t)?t:"folga"}" style="cursor:default"></span></td>`}).join("")}</tr>`).join("")||`<tr><td class="muted">Ninguém neste posto.</td></tr>`}</tbody></table>
 <div class="legend"><span><i class="k-regular"></i>Serviço</span><span><i class="k-cobrindo"></i>Cobrindo</span><span><i class="k-coberto"></i>Permutado</span></div></div>
 ${ehCp?`<div class="lbl">Escalas do posto</div>${S.escalas.filter(e=>e.posto===posto&&e.fim>=TODAY).map(e=>{const pa=altPend().find(a=>a.escala_id===e.id);return `<div class="card"><div class="row between"><div><b style="color:#fff">${esc(e.nome)}</b><div class="muted">${e.hi}–${e.hf} · ${regime(e)} · ${fds(e.ini)} a ${fds(e.fim)}</div></div>${tagSt(e)}</div>
 ${pa?`<div class="note gold" style="margin-top:10px"><span class="ms">hourglass_top</span><span>Alteração dos grupos em análise. Chefia: ${pa.ok_ccg?"aprovou":"aguardando"} · Escalante: ${pa.ok_esc?"aprovou":"aguardando"}.</span></div>`:`<button class="btn sm ghost" style="margin-top:10px" data-a="grEditar" data-id="${e.id}"><span class="ms">edit</span>Editar grupos</button>`}</div>`}).join("")||`<div class="empty">Nenhuma escala ativa neste posto.</div>`}`:""}`)};
V.cpgrupos=()=>{const x=S.grEd,e=S.escalas.find(q=>q.id===x.id);if(!e)return shell(`<div class="empty">Escala não encontrada.</div>`);const nG=x.grupos.length,prev=[...Array(14)].map((_,i)=>add(TODAY>e.ini?TODAY:e.ini,i)).filter(s=>s<=e.fim),tmp={...e,grupos:x.grupos};
 return shell(`<h2>Editar grupos</h2><p class="sub">${esc(e.nome)} · ${esc(e.posto)}</p>
 <div class="note gold" style="margin-bottom:10px"><span class="ms">info</span><span>Toque num guarda para mudá-lo de grupo. A mudança só vale depois de aprovada pela Chefia do Corpo de Guarda e pelo Escalante.</span></div>
 <div class="lbl between"><span>Grupos (${nG})</span><span class="row" style="gap:6px"><button class="btn sm ghost" data-a="grGrupo" data-d="-1" ${nG<=1?"disabled":""} aria-label="Remover grupo">−</button><button class="btn sm ghost" data-a="grGrupo" data-d="1" ${nG>=6?"disabled":""} aria-label="Adicionar grupo">+</button></span></div>
 ${x.grupos.map((gr,i)=>`<div class="card" style="box-shadow:inset 4px 0 0 ${CORES[i%CORES.length]}"><div class="row between"><b style="color:#fff">${GRUPO(i)}</b><span class="muted">${gr.length} guarda(s)</span></div><div class="chips">${gr.map(k=>`<button class="chip on" data-a="grMover" data-k="${esc(k)}" data-i="${i}">${esc(pm(k).nome)}${((e.meta||{})[k]||{}).funcao?" · "+esc(e.meta[k].funcao):""} ⇄</button>`).join("")||`<span class="muted">Vazio</span>`}</div></div>`).join("")}
 <div class="lbl">Prévia · regime ${regime(tmp)}</div>
 <div class="card scroll" style="padding:8px"><table class="egrid fit"><thead><tr><th></th>${prev.map(s=>`<th>${SEM[parse(s).getDay()].slice(0,1).toUpperCase()}<br>${parse(s).getDate()}</th>`).join("")}</tr></thead><tbody>${x.grupos.map((gr,i)=>`<tr><td class="nm">${GRUPO(i)}<small>${gr.length} guarda(s)</small></td>${prev.map(s=>`<td><span class="cell" style="cursor:default;${grupoDoDia(tmp,s)===i?"background:"+CORES[i%CORES.length]:"background:var(--low)"}"></span></td>`).join("")}</tr>`).join("")}</tbody></table></div>
 <div class="field"><label for="gr-obs">Observação para a Chefia e o Escalante</label><textarea id="gr-obs" placeholder="Ex.: equilibrar os grupos depois da saída de um guarda.">${esc(x.obs||"")}</textarea></div>
 <div id="grerr"></div><button class="btn gold block" data-a="grSalvar"><span class="ms">send</span>Salvar e enviar para aprovação</button>`)};
V.ccg=()=>{const f=filaCCG(),c=perfilAtual()==="ccg"?cadsPend():[],fo=fotosPend(),envE=S.escalas.filter(e=>e.st==="enviada");return shell(`${envE.length?`<button class="card row" style="width:100%;border:0;text-align:left;cursor:pointer;color:inherit;box-shadow:inset 4px 0 0 var(--gold)" data-a="go" data-t="ccgescalas"><span class="ms" style="color:var(--gold)">fact_check</span><div style="flex:1"><b style="color:#fff">${envE.length} escala(s) recebida(s) para aprovação</b><div class="muted">Toque para analisar e aprovar</div></div><span class="ms">chevron_right</span></button>`:""}<h2>Aprovação final</h2><p class="sub">Permutas já validadas pelos Coordenadores de Posto.</p>
 ${f.map(r=>filaCard(r,"ccg")).join("")||`<div class="empty">Nenhuma permuta aguardando a Chefia.</div>`}
 ${fo.length?`<div class="lbl between"><span>Trocas de foto para análise</span><span class="tag gold">${fo.length}</span></div>${fo.map(fotoCard).join("")}`:""}
 ${c.length?`<div class="lbl between"><span>Cadastros aguardando</span><span class="tag gold">${c.length}</span></div>${c.map(cadCard).join("")}`:""}
 ${altPend().length?`<div class="lbl between"><span>Alterações de grupos propostas</span><span class="tag gold">${altPend().filter(altMinha).length}</span></div>${altPend().map(altCard).join("")}`:""}
 ${remPend().length?`<div class="lbl between"><span>Pedidos de remoção do posto</span><span class="tag gold">${remPend().length}</span></div>${remPend().map(remCard).join("")}`:""}`)};
const remCard=r=>{const x=(S.efetivo||[]).find(q=>q.mat===r.matricula)||{},sol=g(r.solicitante)||{};return `<div class="card"><div class="row between"><div><b style="color:#fff">${esc(r.guerra)}</b> <span class="muted">${esc(x.pat||"")}</span><div class="muted">Matrícula ${esc(r.matricula)}${x.nomeC?" · "+esc(x.nomeC):""}</div></div><span class="tag">R-${r.id}</span></div>
 <div class="kv" style="margin-top:10px"><div><span>Posto</span><b>${esc(r.posto)}</b></div><div><span>Pedido por</span><b>${esc(sol.nome||"Coordenação")}</b></div><div style="grid-column:1/-1"><span>Motivo</span><b>${esc(r.motivo)}</b></div></div>
 <p class="muted" style="margin:8px 0 0">Se aprovar, o guarda sai das escalas deste posto a partir de hoje e o Escalante é avisado para ajustar.</p>
 <div class="grid2" style="margin-top:12px"><button class="btn sm red" data-a="remRecusar" data-id="${r.id}">Recusar</button><button class="btn sm gold" data-a="remAprovar" data-id="${r.id}">Aprovar remoção</button></div></div>`};
V.comando=()=>{const sit={serv:0,folga:0,sem:0};(S.efetivo||[]).forEach(x=>{const k=sitDia(x.mat,TODAY).k;sit[k==="perm"?"folga":k]++});
 const env=S.escalas.filter(e=>e.st==="enviada").length,ras=S.escalas.filter(e=>e.st==="rascunho").length,vig=S.escalas.filter(e=>e.st==="publicada"&&e.fim>=TODAY).length,chef=filaCCG().length+fotosPend().length+remPend().length+altPend().length;
 const t=(ic,tit,sub,go,n,cor)=>`<button class="card" style="border:0;text-align:left;cursor:pointer;color:inherit;margin:0;display:block;${n?"box-shadow:inset 3px 0 0 var(--gold)":""}" data-a="go" data-t="${go}"><div class="row between"><span class="ms" style="color:var(--gold)">${ic}</span>${n?`<span class="tag ${cor||"gold"}">${n}</span>`:""}</div><b style="color:#fff;display:block;margin-top:6px">${tit}</b><div class="muted small">${sub}</div></button>`;
 return shell(`<div class="idcard">${foto34(S.me.foto,ini(S.me),"lg")}<div style="position:relative"><span class="tag gold">Comando/Subcomando</span><div style="font-size:20px;font-weight:800;color:#fff;margin-top:6px">${esc(S.me.nome)}</div><div class="muted">Acesso total ao sistema</div></div></div>
 <div class="grid2" style="grid-template-columns:repeat(3,1fr);margin-top:10px"><button class="card low" style="border:0;text-align:left;color:inherit;margin:0;cursor:pointer" data-a="go" data-t="efetivo"><div class="muted small">De serviço hoje</div><div class="big">${sit.serv}</div></button><button class="card low" style="border:0;text-align:left;color:inherit;margin:0;cursor:pointer" data-a="go" data-t="efetivo"><div class="muted small">De folga</div><div class="big">${sit.folga}</div></button><button class="card low" style="border:0;text-align:left;color:inherit;margin:0;cursor:pointer" data-a="go" data-t="efetivo"><div class="muted small">Sem escala</div><div class="big">${sit.sem}</div></button></div>
 <div class="lbl">Pendências</div>
 <div class="grid2">${t("shield_person","Coordenação de Posto","Permutas e cadastros para validar","cp",filaCP().length+cadsPend().length)}${t("verified","Chefia do Corpo de Guarda","Aprovação final, fotos, remoções e grupos","ccg",chef)}${t("fact_check","Escalas recebidas","Aprovar ou devolver escalas","ccgescalas",env)}${t("edit_calendar","Montar escalas",ras+" em rascunho · "+vig+" em vigor","escalante",0)}</div>
 <div class="lbl">Gestão</div>
 <div class="grid2">${t("merge","Escala unificada","Mês completo de todas as escalas","escuni",0)}${t("groups","Equipe por posto","Quem está de serviço em cada posto","equipe",0)}${t("badge","Efetivo","Editar dados, lotação e acessos","efetivo",0)}${t("event_busy","Feriados","Feriados das escalas","feriados",0)}${t("monitoring","Panorama","Números das permutas","panorama",0)}${t("swap_horiz","Permutas","Todas as solicitações","cp",0)}</div>
 <p class="muted" style="margin-top:12px">O Comando/Subcomando pode aprovar em qualquer etapa e alterar qualquer dado, exceto a matrícula dos servidores.</p>`)};
V.ccgescalas=()=>{const env=S.escalas.filter(e=>e.st==="enviada"),vig=S.escalas.filter(e=>e.st==="publicada"&&e.fim>=TODAY),ras=S.escalas.filter(e=>e.st==="rascunho");
 const card=e=>{const nG=e.grupos.reduce((t,gr)=>t+gr.length,0);return `<button class="card" style="width:100%;border:0;text-align:left;cursor:pointer;color:inherit;display:block" data-a="go" data-t="escver" data-id="${e.id}"><div class="row between"><div><div class="muted">${esc(e.posto)}</div><b style="color:#fff">${esc(e.nome)}</b></div>${tagSt(e)}</div><div class="muted" style="margin-top:6px">${e.hi}–${e.hf} · ${regime(e)} · ${fds(e.ini)} a ${fds(e.fim)} · ${nG} guardas</div></button>`};
 return shell(`<h2>Escalas de serviço</h2><p class="sub">O Escalante monta, a Chefia aprova. Nenhuma escala entra em vigor sem a aprovação da Chefia do Corpo de Guarda.</p>
 <div class="lbl between"><span>Escalas recebidas para aprovação</span><span class="tag ${env.length?"gold":""}">${env.length}</span></div>${env.map(card).join("")||`<div class="empty">Nenhuma escala aguardando aprovação.</div>`}
 <div class="lbl between"><span>Em vigor</span><span class="tag">${vig.length}</span></div>${vig.map(card).join("")||`<div class="empty">Nenhuma escala em vigor.</div>`}
 ${ras.length?`<p class="muted">${ras.length} escala(s) ainda em elaboração pelo Escalante.</p>`:""}`)};
V.escver=()=>{const e=S.escalas.find(q=>q.id===+S.param);if(!e)return shell(`<div class="empty">Escala não encontrada.</div>`);const mes=S.verMes&&S.verMes>=e.ini.slice(0,7)&&S.verMes<=e.fim.slice(0,7)?S.verMes:(TODAY>=e.ini&&TODAY<=e.fim?TODAY:e.ini).slice(0,7),dias=[];for(let d=mes+"-01";mesDe(d)===mes;d=add(d,1))dias.push(d);const b=parse(mes+"-01"),st=escStats(e),cf=conflitos(S.escalas.filter(x=>x.st!=="rascunho")).filter(q=>e.grupos.flat().includes(q.gid));
 const mem=e.grupos.flatMap((gr,i)=>gr.map(m=>({m,i}))),cel=(o,d)=>{const on=grupoDoDia(e,d)===o.i&&ativoNaEsc(e,o.m,d);return `<td><span class="cell ${on?"ucell":""}" style="cursor:default;background:${on?CORES[o.i%CORES.length]:"var(--low)"}">${on?codTurno(e):""}</span></td>`};
 return shell(`<div class="muted">${esc(e.posto)}</div><h2 style="margin:2px 0 6px">${esc(e.nome)}</h2>${tagSt(e)}
 <div class="kv" style="margin-top:12px"><div><span>Horário</span><b>${e.hi} às ${e.hf}</b></div><div><span>Regime</span><b>${regime(e)}</b></div><div><span>Período</span><b>${fds(e.ini)} a ${fds(e.fim)}</b></div><div><span>Grupos</span><b>${e.grupos.length} · ${mem.length} guardas</b></div>${e.semFer?`<div><span>Feriados</span><b>Não trabalha</b></div>`:""}${(e.excluir||[]).length?`<div><span>Dias sem serviço</span><b>${e.excluir.map(fds).join(", ")}</b></div>`:""}</div>
 ${cf.length?`<div class="err" style="margin-top:10px"><span class="ms">warning</span><span>${cf.length} conflito(s) com outras escalas: ${cf.slice(0,3).map(q=>esc(pm(q.gid).nome)+" em "+fds(q.s)).join(", ")}.</span></div>`:""}
 <div class="lbl">Grupos</div>${e.grupos.map((gr,i)=>`<div class="card" style="box-shadow:inset 4px 0 0 ${CORES[i%CORES.length]}"><b style="color:#fff">${GRUPO(i)}</b><div class="small" style="margin-top:4px">${gr.map(m=>{const x=pm(m),f=((e.meta||{})[m]||{}).funcao;return esc(x.nome)+(f?" ("+esc(f)+")":"")+" · "+(st[m]?st[m].n+" serv.":"")}).join("<br>")}</div></div>`).join("")}
 <div class="row between" style="margin-top:8px"><div class="lbl" style="margin:0">${MESF[b.getMonth()]} ${b.getFullYear()}</div><span class="row" style="gap:2px"><button class="iconbtn" data-a="verMes" data-d="-1" data-ini="${e.ini.slice(0,7)}" data-fim="${e.fim.slice(0,7)}" aria-label="Mês anterior"><span class="ms">chevron_left</span></button><button class="iconbtn" data-a="verMes" data-d="1" data-ini="${e.ini.slice(0,7)}" data-fim="${e.fim.slice(0,7)}" aria-label="Próximo mês"><span class="ms">chevron_right</span></button></span></div>
 <div class="dica"><span class="ms" style="font-size:16px">swipe</span>Arraste a tabela para o lado para ver o mês inteiro.</div>
 <div class="card scroll" style="padding:8px"><table class="egrid"><thead><tr><th></th>${dias.map(d=>`<th>${SEM[parse(d).getDay()].slice(0,1).toUpperCase()}<br>${parse(d).getDate()}</th>`).join("")}</tr></thead><tbody>${mem.map(o=>`<tr><td class="nm">${esc(pm(o.m).nome)}<small>${GRUPO(o.i)}</small></td>${dias.map(d=>cel(o,d)).join("")}</tr>`).join("")}</tbody></table></div>
 ${["ccg","admin"].includes(perfilAtual())&&e.st==="enviada"?`<div class="grid2" style="margin-top:12px"><button class="btn red" data-a="escDevolver" data-id="${e.id}"><span class="ms">undo</span>Devolver</button><button class="btn gold" data-a="escAprovar" data-id="${e.id}" ${cf.length?"disabled":""}><span class="ms">verified</span>Aprovar</button></div><p class="muted">Ao aprovar, a escala entra em vigor e cada guarda recebe um aviso.${cf.length?" Há conflitos: devolva ao Escalante para corrigir.":""}</p>`:""}`)};
V.panorama=()=>{const c={pend:0,ok:0,fim:0};S.reqs.forEach(r=>c[status(r).k]++);const tot=c.pend+c.ok+c.fim||1;
 const por=POSTOS.map(p=>[p,S.reqs.filter(r=>r.posto===p).length]).filter(x=>x[1]).sort((a,b)=>b[1]-a[1]),mx=Math.max(...por.map(x=>x[1]),1);
 return shell(`<h2>Panorama de permutas</h2><p class="sub">${ativos().length} servidores ativos no app.</p>
 <div class="grid2" style="grid-template-columns:repeat(3,minmax(0,1fr))"><div class="card low"><div class="muted">Em andamento</div><div class="big">${c.pend}</div></div><div class="card low"><div class="muted">Aprovadas</div><div class="big" style="color:var(--green)">${c.ok}</div></div><div class="card low"><div class="muted">Encerradas</div><div class="big" style="color:var(--red)">${c.fim}</div></div></div>
 <div class="bar" style="height:10px;display:flex;margin:6px 0 18px"><i style="width:${c.ok/tot*100}%;background:var(--green)"></i><i style="width:${c.pend/tot*100}%;background:var(--blue)"></i><i style="width:${c.fim/tot*100}%;background:var(--red)"></i></div>
 <div class="lbl">Por posto</div><div class="card">${por.map(([p,n])=>`<div style="margin-bottom:10px"><div class="row between small"><span>${esc(p)}</span><b>${n}</b></div><div class="bar"><i style="width:${n/mx*100}%"></i></div></div>`).join("")||`<div class="muted">Nenhuma permuta ainda.</div>`}</div>`)};
const matsDoPosto=posto=>{const o=new Set();S.escalas.filter(e=>e.posto===posto&&e.fim>=TODAY).forEach(e=>e.grupos.flat().forEach(m=>{const a=((e.meta||{})[m]||{}).ate;if(!a||a>=TODAY)o.add(m)}));return o};
const altPend=()=>(S.alteracoes||[]).filter(a=>a.status==="pendente");
const altMinha=a=>{const p=perfilAtual();return p==="esc"?a.ok_esc==null:p==="ccg"?a.ok_ccg==null:p==="admin"};
const altDiff=a=>{const e=S.escalas.find(x=>x.id===a.escala_id);if(!e)return[];const de={},para={};e.grupos.forEach((gr,i)=>gr.forEach(m=>de[m]=i));a.gr.forEach((gr,i)=>gr.forEach(m=>para[m]=i));return Object.keys(de).filter(m=>de[m]!==para[m]).map(m=>pm(m).nome+": "+GRUPO(de[m])+" → "+(para[m]==null?"fora":GRUPO(para[m])))};
const altCard=a=>{const e=S.escalas.find(x=>x.id===a.escala_id)||{nome:"(escala removida)",grupos:[]},d=altDiff(a),sol=g(a.solicitante)||{},minha=altMinha(a),st=v=>v==null?`<span class="tag">aguardando</span>`:v?`<span class="tag green">aprovou</span>`:`<span class="tag red">recusou</span>`;
 return `<div class="card"><div class="row between"><div><div class="muted">${esc(a.posto)}</div><b style="color:#fff">${esc(e.nome)}</b></div><span class="tag">A-${a.id}</span></div>
 <div class="kv" style="margin-top:10px"><div><span>Pedido por</span><b>${esc(sol.nome||"Coordenação")}</b></div><div><span>Grupos</span><b>${e.grupos.length} → ${a.gr.length}</b></div>${a.obs?`<div style="grid-column:1/-1"><span>Observação</span><b>${esc(a.obs)}</b></div>`:""}</div>
 <div class="card low" style="margin-top:8px">${d.map(t=>`<div class="small">${esc(t)}</div>`).join("")||`<div class="small muted">Só mudou a quantidade de grupos.</div>`}</div>
 <div class="row" style="gap:8px;margin-top:8px;flex-wrap:wrap"><span class="small">Chefia ${st(a.ok_ccg)}</span><span class="small">Escalante ${st(a.ok_esc)}</span></div>
 ${a.status==="pendente"&&minha?`<div class="grid2" style="margin-top:12px"><button class="btn sm red" data-a="altRecusar" data-id="${a.id}">Recusar</button><button class="btn sm gold" data-a="altAprovar" data-id="${a.id}">Aprovar</button></div>`:""}</div>`};
const remPend=()=>(S.remocoes||[]).filter(r=>r.status==="pendente");
V.efetivo=()=>efetivoOficial();
const podeEf=()=>["esc","ccg","admin"].includes(perfilAtual());
const sitDia=(m,d)=>{const q=perfilPorMat(m),dd=q?dia(q.id,d):null;if(dd&&dd.t==="cobrindo")return{k:"serv",t:"De serviço (cobrindo permuta) · "+(dd.hor||"")};
 for(const e of S.escalas){if(e.st!=="publicada"||d<e.ini||d>e.fim)continue;const gi=e.grupos.findIndex(gr=>gr.includes(m));if(gi<0||!ativoNaEsc(e,m,d))continue;
  if(dd&&dd.t==="coberto")return{k:"perm",t:"Folga por permuta",e,gi};if(e.semFer&&S.feriados.has(d))return{k:"folga",t:"De folga (feriado)",e,gi};if((e.excluir||[]).includes(d))return{k:"folga",t:"Sem serviço neste dia",e,gi};
  return grupoDoDia(e,d)===gi?{k:"serv",t:"De serviço · "+e.hi+"–"+e.hf,e,gi}:{k:"folga",t:"De folga",e,gi}}
 return{k:"sem",t:"Sem escala em vigor"}};
const SIT_COR={serv:"green",folga:"",perm:"blue",sem:""};
function efetivoOficial(){const q=(S.efBusca||"").toLowerCase(),ehCp=perfilAtual()==="cp",nP=ehCp?matsDoPosto(S.me.posto):null,ehCg=["ccg","admin"].includes(perfilAtual()),sit={},todos=(S.efetivo||[]).filter(x=>!ehCp||nP.has(x.mat));if(ehCg)todos.forEach(x=>sit[x.mat]=sitDia(x.mat,TODAY));const fl=ehCg?(S.efFiltro||"todos"):"todos",l=todos.filter(x=>(fl==="todos"||sit[x.mat].k===fl||(fl==="folga"&&sit[x.mat].k==="perm"))&&(!q||(x.nome+" "+x.nomeC+" "+x.mat+" "+x.posto+" "+x.pat).toLowerCase().includes(q))),ed=podeEf(),conta=m=>S.perfis.find(p=>p.mat===m&&p.status!=="pendente");
 const ordem=PATENTES.concat([""]),grupos=ordem.map(pt=>[pt,l.filter(x=>(x.pat||"")===pt).sort((a,b)=>a.nome.localeCompare(b.nome))]).filter(([,v])=>v.length);
 const linha=x=>{const c=conta(x.mat),rp=ehCp&&remPend().some(r=>r.matricula===x.mat&&r.posto===S.me.posto),acao=ehCg?`data-a="efInfo" data-k="${esc(x.mat)}"`:ed?`data-a="efEdit" data-k="${esc(x.mat)}"`:ehCp?`data-a="remAbrir" data-k="${esc(x.mat)}"`:c?`data-a="efAcoes" data-id="${c.id}"`:"";return `<button class="card row" style="width:100%;border:0;text-align:left;cursor:${acao?"pointer":"default"};color:inherit" ${acao}><div style="flex:1;min-width:0"><b style="color:#fff">${esc(x.nome)}</b>${x.bm?` <span class="tag">BM</span>`:""}<div class="muted">${esc(x.nomeC)}</div><div class="small">${esc(x.mat)} · ${esc(x.posto||"lotação a confirmar")}${habTxt(x)?" · "+habTxt(x):""}</div>${ehCg?`<div class="small" style="margin-top:3px">${sit[x.mat].e?"Escalado em "+esc(sit[x.mat].e.posto)+" · "+esc(sit[x.mat].e.nome)+" ("+GRUPO(sit[x.mat].gi)+")":"Não está em escala em vigor"}</div><span class="tag ${SIT_COR[sit[x.mat].k]}" style="margin-top:4px;display:inline-block">${esc(sit[x.mat].t)}</span>`:""}</div>${rp?`<span class="tag gold">remoção em análise</span>`:""}${acao?`<span class="ms" style="color:var(--muted)">${ehCg?"chevron_right":ed?"edit":"more_vert"}</span>`:""}</button>`};
 return shell(`<h2>Efetivo</h2><p class="sub">${ehCp?`Guardas escalados em ${esc(S.me.posto)}: ${todos.length}. Toque num guarda para pedir a remoção dele do posto.`:`Efetivo oficial: ${todos.length} servidores.`}${ed?" Toque num servidor para corrigir nome, nome de guerra, patente, lotação, BM ou habilitações.":""}</p>
 ${ehCg?(()=>{const c={serv:0,folga:0,sem:0};todos.forEach(x=>{const k=sit[x.mat].k;c[k==="perm"?"folga":k]++});return `<div class="grid2" style="grid-template-columns:repeat(3,1fr);margin-bottom:10px">${[["serv","De serviço hoje"],["folga","De folga"],["sem","Sem escala"]].map(([k,lb])=>`<button class="card low" style="border:0;text-align:left;cursor:pointer;color:inherit;margin:0;${fl===k?"box-shadow:inset 0 0 0 2px var(--gold)":""}" data-a="efFiltro" data-v="${fl===k?"todos":k}"><div class="muted small">${lb}</div><div class="big">${c[k]}</div></button>`).join("")}</div>${fl!=="todos"?`<button class="link" style="font-size:13px;margin-bottom:8px" data-a="efFiltro" data-v="todos">Mostrar todos</button>`:""}`})():""}
 ${ed?`<button class="btn gold block" data-a="efNovo"><span class="ms">person_add</span>Adicionar guarda</button>`:""}
 <div class="field" style="margin-top:12px"><input id="efb" data-busca="efBusca" value="${esc(S.efBusca||"")}" placeholder="Buscar por nome, matrícula, posto ou patente"></div>
 ${grupos.length>1?`<div class="chips" style="margin-bottom:6px">${grupos.map(([pt,v])=>`<button class="chip" data-a="efPula" data-p="${esc(pt||"sem")}">${esc(pt||"Sem patente")} · ${v.length}</button>`).join("")}</div>`:""}
 ${grupos.map(([pt,v])=>`<div class="lbl between" id="pat-${esc(pt||"sem")}"><span>${esc(pt?pt+" · "+(PAT_NOME[pt]||""):"Sem patente informada")}</span><span class="tag">${v.length}</span></div>${v.map(linha).join("")}`).join("")||`<div class="empty">${ehCp&&!q?"Nenhum guarda escalado neste posto ainda.":"Ninguém encontrado."}</div>`}`)}
function efForm(x){const novo=!x;x=x||{mat:"",nome:"",nomeC:"",pat:PATENTES[PATENTES.length-1]||"",posto:"",bm:false,hab380:false,hab38:false,taser:false};
 sheet(`<div class="row between"><h2 style="margin:0">${novo?"Adicionar guarda":esc(x.nome)}</h2><button class="iconbtn" data-a="x" aria-label="Fechar"><span class="ms">close</span></button></div>
 <form id="fef" style="margin-top:12px"><input type="hidden" id="ef-novo" value="${novo?1:""}">
 ${novo?`<div class="field"><label for="ef1">Matrícula</label><input id="ef1" inputmode="numeric" placeholder="00000-0" required></div>`:`<input type="hidden" id="ef1" value="${esc(x.mat)}"><div class="card low" style="margin-bottom:12px"><div class="muted">Matrícula</div><b style="color:#fff">${esc(x.mat)}</b><div class="muted small">A matrícula não pode ser alterada.</div></div>`}
 <div class="field"><label for="ef2">Nome completo</label><input id="ef2" value="${esc(x.nomeC)}" required></div>
 <div class="field"><label for="ef3">Nome de guerra</label><input id="ef3" value="${esc(x.nome)}" required placeholder="Ex.: SILVA"></div>
 <div class="grid2"><div class="field"><label for="ef4">Patente</label><select id="ef4"><option value="">Sem patente</option>${PATENTES.map(k=>`<option value="${k}" ${k===x.pat?"selected":""}>${k}</option>`).join("")}</select></div><div class="field"><label for="ef5">Lotação</label><select id="ef5"><option value="">A confirmar</option>${postoOpts(x.posto)}</select></div></div>
 <div class="card low">${[["ef6","bm","Banda de Música (BM)"],["ef7","hab380","Habilitação pistola .380 (**)"],["ef8","hab38","Habilitação revólver .38 (*)"],["ef9","taser","Habilitação Taser (T)"]].map(([id,k,l])=>`<label class="row small" style="padding:6px 0;cursor:pointer"><input type="checkbox" id="${id}" ${x[k]?"checked":""} style="width:22px;min-height:22px;box-shadow:none;accent-color:#e6c429;flex:none">${l}</label>`).join("")}</div>
 ${(()=>{if(novo)return "";const c=S.perfis.find(p=>p.mat===x.mat&&p.status!=="pendente");return c&&["ccg","admin"].includes(perfilAtual())?`<button type="button" class="btn ghost block" style="margin-bottom:10px" data-a="efAcoes" data-id="${c.id}"><span class="ms">key</span>Acesso ao app (senha, perfil, situação)</button>`:""})()}
 <div class="grid2">${novo?`<button type="button" class="btn ghost" data-a="x">Cancelar</button>`:`<button type="button" class="btn red" data-a="efRemover" data-k="${esc(x.mat)}">Remover</button>`}<button class="btn gold">Salvar</button></div></form>`)}
/* ---------- escalante ---------- */
const TURNOS=[["07:00","19:00","12h diurno"],["19:00","07:00","12h noturno"],["10:00","22:00","12h (GSE)"],["07:00","07:00","24h"],["09:00","15:00","6h expediente"],["07:00","13:00","6h manhã"],["13:00","19:00","6h tarde"]];
const GRUPO=i=>"Grupo "+String.fromCharCode(65+i);
const ST_TXT={rascunho:["Rascunho","gold","rasc."],enviada:["Aguardando Chefia","blue","aguard."],publicada:["Em vigor","green","vigor"]};
const tagSt=(e,c)=>{const t=ST_TXT[e.st]||ST_TXT.rascunho;return `<span class="tag ${t[1]}">${c?t[2]:t[0]}</span>`};
const CORES=["#e6c429","#5aa9ff","#3ecf8e","#c084fc","#fb923c","#f472b6"];
const codTurno=e=>e.horas===24?"24":e.hi==="07:00"&&e.hf==="19:00"?"D":e.hi==="19:00"&&e.hf==="07:00"?"N":String(e.horas);
const regime=e=>{const n=e.grupos.length||1;if(e.uteis)return n===1?e.horas+"h em dias úteis":e.horas+"h, revezamento de "+n+" grupos em dias úteis";const f=n*24-e.horas;return f>0?e.horas+"x"+f:e.horas+"h diárias"};
const proxMes=()=>{const d=parse(TODAY);d.setDate(1);d.setMonth(d.getMonth()+1);const a=iso(d);d.setMonth(d.getMonth()+1);d.setDate(0);return[a,iso(d)]};
const escNova=()=>{const[a,b]=proxMes();return{id:null,nome:"",posto:POSTOS.includes(S.me.posto)?S.me.posto:POSTOS[0],ini:a,fim:b,hi:"07:00",hf:"19:00",horas:12,grupos:[[],[],[]],meta:{},excluir:[],semFer:false,uteis:false,st:"rascunho"}};
const ativoNaEsc=(e,gid,s)=>{const m=(e.meta||{})[gid]||{};return !(m.desde&&s<m.desde)&&!(m.ate&&s>m.ate)};
const escStats=e=>{const o={};e.grupos.forEach(gr=>gr.forEach(gid=>o[gid]={n:0,h:0}));for(let s=e.ini;s<=e.fim;s=add(s,1)){const gi=grupoDoDia(e,s);if(gi>=0)e.grupos[gi].forEach(gid=>{if(ativoNaEsc(e,gid,s)){o[gid].n++;o[gid].h+=e.horas}})}return o};
const conflitos=es=>{const o=[],mapa={};for(const e of es)for(let s=e.ini;s<=e.fim;s=add(s,1)){const gi=grupoDoDia(e,s);if(gi<0)continue;for(const gid of e.grupos[gi]){if(!ativoNaEsc(e,gid,s))continue;const k=gid+"|"+s;if(mapa[k]&&mapa[k]!==e.id)o.push({gid,s});else mapa[k]=e.id}}return o};
const corEsc=e=>CORES[Math.max(0,S.escalas.findIndex(x=>x.id===e.id))%CORES.length];
V.escalante=()=>{const es=S.escalas;
 return shell(`<h2>Escalas</h2><p class="sub">Crie uma escala para cada posto e turno e envie à Chefia do Corpo de Guarda. Ela só entra em vigor depois de aprovada.</p>
 ${altPend().length?`<div class="lbl between"><span>Alterações de grupos propostas pelos Coordenadores</span><span class="tag gold">${altPend().filter(altMinha).length}</span></div>${altPend().map(altCard).join("")}<div class="hr" style="margin:14px 0"></div>`:""}
 ${(()=>{const env=es.filter(e=>e.st==="enviada"),dev=es.filter(e=>e.st==="rascunho"&&e.devolucao);return env.length||dev.length?`<div class="lbl between"><span>Escalas enviadas para aprovação</span><span class="tag blue">${env.length}</span></div>${env.map(e=>`<div class="card row"><span class="ms" style="color:#5aa9ff">hourglass_top</span><div style="flex:1"><b style="color:#fff">${esc(e.nome)}</b><div class="muted">Enviada${e.enviada?" em "+fds(e.enviada):""} · aguardando a Chefia do Corpo de Guarda</div></div></div>`).join("")}${dev.map(e=>`<div class="card row" style="box-shadow:inset 4px 0 0 #ff6b5e"><span class="ms" style="color:#ff6b5e">undo</span><div style="flex:1"><b style="color:#fff">${esc(e.nome)}</b><div class="muted">Devolvida pela Chefia: ${esc(e.devolucao)}</div></div></div>`).join("")}<div class="hr" style="margin:14px 0"></div>`:""})()}
 <button class="btn gold block" data-a="escCriar"><span class="ms">add</span>Criar escala</button>
 <div class="lbl">Escalas criadas (${es.length})</div>
 ${es.map(e=>{const nG=e.grupos.reduce((t,gr)=>t+gr.length,0);return `<div class="card" style="box-shadow:inset 4px 0 0 ${corEsc(e)}"><div class="row between"><div><div class="muted">${esc(e.posto)}</div><b style="color:#fff">${esc(e.nome)}</b></div>${tagSt(e)}</div>
 <div class="kv" style="margin-top:10px"><div><span>Horário</span><b>${e.hi} às ${e.hf}</b></div><div><span>Regime</span><b>${regime(e)}</b></div><div><span>Período</span><b>${fds(e.ini)} a ${fds(e.fim)}</b></div><div><span>Grupos</span><b>${e.grupos.length} · ${nG} guardas</b></div></div>
 ${e.devolucao&&e.st==="rascunho"?`<div class="err" style="margin:10px 0 0"><span class="ms">undo</span><span>Devolvida pela Chefia: ${esc(e.devolucao)}</span></div>`:""}<div class="row" style="margin-top:10px;gap:8px;flex-wrap:wrap">${e.st==="rascunho"?`<button class="btn sm gold" data-a="escEnviar" data-ids="${e.id}"><span class="ms">send</span>Enviar à Chefia</button>`:""}<button class="btn sm ghost" data-a="escEditar" data-id="${e.id}"><span class="ms">edit</span>Editar</button><button class="btn sm red" data-a="escExcluir" data-id="${e.id}" aria-label="Excluir"><span class="ms">delete</span></button></div></div>`}).join("")||`<div class="empty">Nenhuma escala criada ainda.</div>`}
 ${es.length?`<button class="btn gold block" style="margin-top:6px" data-a="go" data-t="escuni"><span class="ms">merge</span>Escala unificada</button>`:""}`)};
V.escnova=()=>{const e=S.escEd,nG=e.grupos.length,usados={};e.grupos.forEach((gr,i)=>gr.forEach(x=>usados[x]=i));
 const outra=new Set(S.escalas.filter(q=>q.id!==e.id&&q.ini<=e.fim&&q.fim>=e.ini).flatMap(q=>q.grupos.flat()));
 const prev=[...Array(14)].map((_,i)=>add(e.ini,i)).filter(s=>s<=e.fim),st=escStats(e);
 return shell(`<h2>${e.id?"Editar escala":"Nova escala"}</h2>
 <div class="field"><label for="es1">Nome da escala</label><input id="es1" data-e="nome" value="${esc(e.nome)}" placeholder="Ex.: Base Central · Diurno"></div>
 <div class="field"><label for="es2">Posto / setor</label><select id="es2" data-e="posto">${postoOpts(e.posto)}</select></div>
 <div class="grid2"><div class="field"><label for="es3">De</label><input id="es3" type="date" data-e="ini" value="${e.ini}"></div><div class="field"><label for="es4">Até</label><input id="es4" type="date" data-e="fim" value="${e.fim}"></div></div>
 <div class="lbl">Horário</div><div class="chips" style="margin:0 0 10px">${TURNOS.map(([a,b,l])=>`<button class="chip ${e.hi===a&&e.hf===b?"on":""}" data-a="escTurno" data-i="${a}" data-f="${b}">${l} · ${a}–${b}</button>`).join("")}</div>
 <div class="grid2"><div class="field"><label for="es5">Entrada</label><input id="es5" type="time" data-e="hi" value="${e.hi}"></div><div class="field"><label for="es6">Saída</label><input id="es6" type="time" data-e="hf" value="${e.hf}"></div></div>
 <p class="muted" style="margin-top:-6px">Duração: <b style="color:#fff">${e.horas}h</b> por serviço.</p>
 <label class="card low row" style="cursor:pointer"><input type="checkbox" data-e="uteis" ${e.uteis?"checked":""} style="width:22px;min-height:22px;box-shadow:none;accent-color:#e6c429;flex:none"><span class="small">Somente dias úteis (segunda a sexta)</span></label>
 <label class="card low row" style="cursor:pointer"><input type="checkbox" data-e="semFer" ${e.semFer?"checked":""} style="width:22px;min-height:22px;box-shadow:none;accent-color:#e6c429;flex:none"><span class="small">Não trabalha nos feriados cadastrados</span></label>
 <div class="field"><label for="es7">Dias sem serviço nesta escala</label><div class="row"><input id="es7" type="date" min="${e.ini}" max="${e.fim}" style="flex:1"><button class="btn sm ghost" data-a="escExcl">Adicionar</button></div><div class="chips">${(e.excluir||[]).sort().map(d=>`<button class="chip on" data-a="escExclRm" data-d="${d}">${fds(d)} ✕</button>`).join("")||`<span class="muted">Nenhum. Ex.: folga coletiva de 02/11.</span>`}</div></div>
 <div class="lbl between"><span>Grupos (${nG})</span><span class="row" style="gap:6px"><button class="btn sm ghost" data-a="escGrupo" data-d="-1" ${nG<=1?"disabled":""} aria-label="Remover grupo">−</button><button class="btn sm ghost" data-a="escGrupo" data-d="1" ${nG>=6?"disabled":""} aria-label="Adicionar grupo">+</button></span></div>
 <div class="note gold" style="margin-bottom:10px"><span class="ms">autorenew</span><span>Os grupos se revezam um por dia. Com ${nG} grupo(s) e ${e.horas}h, o regime fica <b style="color:#fff">${regime(e)}</b>.</span></div>
 ${e.grupos.map((gr,i)=>`<div class="card" style="box-shadow:inset 4px 0 0 ${CORES[i%CORES.length]}"><div class="row between"><b style="color:#fff">${GRUPO(i)}</b><span class="muted">${gr.length} guarda(s)</span></div><div class="chips">${gr.map(k=>{const x=pm(k),mt=e.meta[k]||{};return `<button class="chip on" data-a="escMem" data-g="${esc(k)}" data-i="${i}">${esc(x.nome)}${mt.funcao?" · "+esc(mt.funcao):""}${mt.desde?" · a partir de "+fds(mt.desde):""}${outra.has(k)?" ⚠":""} ✎</button>`}).join("")}<button class="chip" data-a="escAdd" data-i="${i}">+ Adicionar guarda</button></div></div>`).join("")}
 <p class="muted">A lista vem do efetivo oficial. Toque num guarda escolhido (✎) para definir função (Chefe, Guarnição, Condutor VTR) ou data de início. “⚠” = já está em outra escala do mesmo período.</p>
 <div class="lbl">Prévia</div>
 <div class="card scroll" style="padding:8px"><table class="egrid fit"><thead><tr><th></th>${prev.map(s=>`<th>${SEM[parse(s).getDay()].slice(0,1).toUpperCase()}<br>${parse(s).getDate()}</th>`).join("")}</tr></thead><tbody>${e.grupos.map((gr,i)=>`<tr><td class="nm">${GRUPO(i)}<small>${gr.length>3?gr.length+" guardas":gr.map(x=>esc(pm(x).nome)).join(", ")||"vazio"}</small></td>${prev.map(s=>`<td><span class="cell" style="cursor:default;${grupoDoDia(e,s)===i?"background:"+CORES[i%CORES.length]:"background:var(--low)"}"></span></td>`).join("")}</tr>`).join("")}</tbody></table></div>
 ${Object.keys(st).length?`<div class="card low">${Object.entries(st).map(([gid,v])=>`<div class="row between small" style="padding:3px 0"><span>${esc(pm(gid).nome)}</span><b>${v.n} serviços · ${v.h}h</b></div>`).join("")}</div>`:""}
 <div id="eserr"></div><button class="btn gold block" data-a="escSalvar" id="btnEsc"><span class="ms">save</span>Salvar escala</button>`)};
V.escuni=()=>{const mes=S.uniMes||((S.escalas[0]||{}).ini||proxMes()[0]).slice(0,7),es=S.escalas.filter(e=>e.ini.slice(0,7)<=mes&&e.fim.slice(0,7)>=mes),dias=[];for(let s=mes+"-01";mesDe(s)===mes;s=add(s,1))dias.push(s);
 const cf=conflitos(es),gs=[...new Set(es.flatMap(e=>e.grupos.flat()))].map(pm).sort((a,b)=>a.posto.localeCompare(b.posto)||a.nome.localeCompare(b.nome)),pub=es.length&&es.every(e=>e.st==="publicada"),b=parse(mes+"-01");
 const cel=(x,s)=>{const e=es.find(e=>{const gi=grupoDoDia(e,s);return gi>=0&&e.grupos[gi].includes(x.mat)&&ativoNaEsc(e,x.mat,s)});if(!e)return `<td><span class="cell" style="cursor:default;background:var(--low)"></span></td>`;const c=cf.some(q=>q.gid===x.mat&&q.s===s);return `<td><span class="cell ucell" style="background:${corEsc(e)};${c?"box-shadow:inset 0 0 0 2px #ff6b5e":""}" title="${esc(e.nome)}">${codTurno(e)}</span></td>`};
 return shell(`<div class="row between"><h2 style="margin:0">${MESF[b.getMonth()]} ${b.getFullYear()}</h2><span class="row" style="gap:2px"><button class="iconbtn" data-a="uniMes" data-d="-1" aria-label="Mês anterior"><span class="ms">chevron_left</span></button><button class="iconbtn" data-a="uniMes" data-d="1" aria-label="Próximo mês"><span class="ms">chevron_right</span></button></span></div>
 <p class="sub">${es.length} escala(s), ${gs.length} guardas.</p>
 <div class="card low">${es.map(e=>`<div class="row" style="padding:4px 0"><span class="cell ucell" style="background:${corEsc(e)};flex:none">${codTurno(e)}</span><span class="small" style="flex:1"><b>${esc(e.nome)}</b> · ${e.hi}–${e.hf} · ${regime(e)}</span>${tagSt(e,1)}</div>`).join("")||`<div class="muted">Nenhuma escala neste mês.</div>`}</div>
 ${cf.length?`<div class="err"><span class="ms">warning</span><span><b>${cf.length} conflito(s):</b> ${cf.slice(0,4).map(q=>esc(pm(q.gid).nome)+" em "+fds(q.s)).join(", ")}${cf.length>4?"…":""}. O mesmo guarda está em duas escalas no mesmo dia.</span></div>`:es.length?`<div class="note" style="margin-bottom:10px"><span class="ms" style="color:var(--green)">check_circle</span>Nenhum guarda escalado duas vezes no mesmo dia.</div>`:""}
 ${gs.length?`<div class="dica"><span class="ms" style="font-size:16px">swipe</span>Arraste a tabela para o lado para ver o mês inteiro.</div><div class="card scroll" style="padding:8px"><table class="egrid"><thead><tr><th></th>${dias.map(s=>`<th>${SEM[parse(s).getDay()].slice(0,1).toUpperCase()}<br>${parse(s).getDate()}</th>`).join("")}<th>Total</th></tr></thead><tbody>${gs.map(x=>{let h=0;dias.forEach(s=>{const e=es.find(e=>{const gi=grupoDoDia(e,s);return gi>=0&&e.grupos[gi].includes(x.mat)&&ativoNaEsc(e,x.mat,s)});if(e)h+=e.horas});return `<tr><td class="nm">${esc(x.nome.replace("GCM ",""))}<small>${esc(x.posto.replace(/ - .*/,""))}</small></td>${dias.map(s=>cel(x,s)).join("")}<td style="white-space:nowrap">${h}h</td></tr>`}).join("")}</tbody></table></div>`:""}
 <div class="grid2" style="margin-top:12px"><button class="btn ghost" data-a="comp" data-p="uni:${mes}" ${es.length?"":"disabled"}><span class="ms">picture_as_pdf</span>PDF</button><button class="btn gold" data-a="escEnviar" data-ids="${es.filter(e=>e.st==="rascunho").map(e=>e.id).join(",")}" ${es.some(e=>e.st==="rascunho")&&!cf.length?"":"disabled"}><span class="ms">send</span>${es.some(e=>e.st==="rascunho")?"Enviar à Chefia":pub?"Em vigor":"Aguardando Chefia"}</button></div>
 <p class="muted">${cf.length?"Resolva os conflitos para enviar. ":""}Nenhuma escala entra em vigor sem a aprovação da Chefia do Corpo de Guarda. Depois de aprovada, cada guarda recebe um aviso no app.</p>`)};

V.feriados=()=>shell(`<h2>Feriados</h2><p class="sub">Escalas marcadas com “não trabalha nos feriados” pulam estes dias automaticamente.</p>
 <form id="fferiado" class="card"><div class="grid2"><div class="field"><label for="fe1">Data</label><input id="fe1" type="date"></div><div class="field"><label for="fe2">Nome</label><input id="fe2" placeholder="Ex.: Finados"></div></div><button class="btn gold block">Adicionar feriado</button></form>
 ${(S.feriadosLista||[]).map(f=>`<div class="card row between"><div><b style="color:#fff">${esc(f.nome)}</b><div class="muted">${dbr(f.data)}</div></div><button class="btn sm red" data-a="ferRm" data-d="${f.data}" aria-label="Remover"><span class="ms">delete</span></button></div>`).join("")||`<div class="empty">Nenhum feriado cadastrado.</div>`}`);
/* ---------- comprovantes ---------- */
const etapaTxt=v=>v==="aceito"||v==="aprovado"?"Aprovado":v==="recusado"?"Recusado":"Pendente";
function docPermuta(r){const st=status(r),ok=st.k==="ok",a=g(r.sol),b=r.col?g(r.col):null;
 const s=[{t:"Dados da solicitação",kv:[["Protocolo",r.cod],["Situação",st.t],["Data do pedido",dbr(r.criado)],["Modalidade",r.tipo==="mural"?"Mural":"Troca direta"],["Posto",r.posto]]},
  {t:"Servidores",kv:[["Solicitante",a.nome+" · Mat. "+a.mat],["Cargo",a.pat],["Substituto",b?b.nome+" · Mat. "+b.mat:"Aguardando interessado"],["Cargo",b?b.pat:"—"]]},
  {t:"Datas",kv:[["Serviço original",dbr(r.saida.data)+", "+r.saida.ini+" às "+r.saida.fim],["Reposição",r.repos.data?dbr(r.repos.data)+", "+r.repos.ini+" às "+r.repos.fim:"A combinar"]]},
  {t:"Fluxo de aprovação",tabela:{cols:["Etapa","Responsável","Situação"],rows:[["Aceite do colega",b?b.nome:"—",etapaTxt(r.et.col)],["Coordenador de Posto","Coordenação",etapaTxt(r.et.cp)],["Chefia do Corpo de Guarda","Chefia",etapaTxt(r.et.ccg)]]}}];
 if(r.motivo&&st.k==="fim")s.push({t:"Motivo",texto:r.motivo});if(r.obs)s.push({t:"Observações",texto:r.obs});
 if(ok)s.push({t:"Declaração",texto:"Certifica-se que a permuta acima foi aceita pelos servidores, validada pela Coordenação de Posto e aprovada pela Chefia do Corpo de Guarda."});
 return{titulo:ok?"Comprovante de Permuta de Serviço":"Protocolo de Solicitação de Permuta",arquivo:(ok?"comprovante-permuta-":"protocolo-permuta-")+r.id,secoes:s,codigo:codigo({r:r.id,et:r.et,s:r.saida,p:r.repos}),assin:ok}}
function docEscala(gid,mes){const x=g(gid),[y,m]=mes.split("-").map(Number),rows=[];let n=0,h=0,cob=0;
 for(let s=mes+"-01";mesDe(s)===mes;s=add(s,1)){const d=dia(gid,s);if(!["regular","cobrindo","coberto"].includes(d.t))continue;if(d.t==="coberto")cob++;else{n++;h+=d.h}rows.push([dbr(s),d.t==="coberto"?"—":d.hor||"",d.t==="regular"?d.nota||"Serviço":d.nota])}
 return{titulo:"Comprovante de Escala de Serviço",arquivo:"escala-"+x.mat.replace(/\D/g,"")+"-"+mes,secoes:[{t:"Servidor",kv:[["Nome de guerra",x.nome],["Matrícula",x.mat],["Cargo",x.pat],["Lotação",x.posto],["Período",MESF[m-1]+" de "+y]]},{t:"Serviços do período",tabela:{cols:["Data","Horário","Escala / situação"],rows}},{t:"Totais",kv:[["Serviços",String(n)],["Horas",h+" h"],["Cedidos em permuta",String(cob)]]}],codigo:codigo({gid,mes,rows})}}
function docUni(mes){const es=S.escalas.filter(e=>e.ini.slice(0,7)<=mes&&e.fim.slice(0,7)>=mes),[y,m]=mes.split("-").map(Number),rows=[];
 for(const e of es)e.grupos.forEach((gr,i)=>gr.forEach(gid=>{const ds=[];for(let s=mes+"-01";mesDe(s)===mes;s=add(s,1))if(grupoDoDia(e,s)===i&&ativoNaEsc(e,gid,s))ds.push(parse(s).getDate());const fn=((e.meta||{})[gid]||{}).funcao;rows.push([pm(gid).nome+" · "+gid,e.nome+" ("+GRUPO(i)+(fn?", "+fn:"")+", "+e.hi+"–"+e.hf+")","Dias "+ds.join(", ")+" · "+ds.length*e.horas+"h"])}));
 return{titulo:"Escala Unificada de Serviço",arquivo:"escala-unificada-"+mes,secoes:[{t:"Período",kv:[["Mês",MESF[m-1]+" de "+y],["Escalas",String(es.length)],["Situação",es.every(e=>e.st==="publicada")?"Aprovada pela Chefia, em vigor":es.every(e=>e.st!=="rascunho")?"Aguardando aprovação da Chefia":"Em elaboração"]]},{t:"Escalas",tabela:{cols:["Escala","Horário","Regime"],rows:es.map(e=>[e.nome+" · "+e.posto,e.hi+" às "+e.hf,regime(e)])}},{t:"Servidores",tabela:{cols:["Servidor","Escala","Dias e horas"],rows}}],codigo:codigo({mes,es:es.map(e=>e.id)})}}
function docDe(param){const[t,id]=String(param).split(":");if(t==="permuta"){const r=S.reqs.find(x=>x.id===+id);return r&&docPermuta(r)}if(t==="escala")return docEscala(ME(),id);if(t==="uni")return docUni(id)}
const docHTML=d=>`<div class="paper"><div class="ph"><img src="${LOGO}" alt=""><div><b>GUARDA MUNICIPAL DE SÃO LUÍS</b><span>Secretaria Municipal de Segurança com Cidadania</span><span>Prefeitura Municipal de São Luís</span></div></div>
 <h3>${d.titulo}</h3>${d.secoes.map(s=>`<h4>${s.t}</h4>${s.kv?`<dl>${s.kv.map(([k,v])=>`<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}</dl>`:s.tabela?`<table><thead><tr>${s.tabela.cols.map(c=>`<th>${c}</th>`).join("")}</tr></thead><tbody>${s.tabela.rows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join("")}</tr>`).join("")||`<tr><td colspan="3">Nenhum registro.</td></tr>`}</tbody></table>`:`<p>${esc(s.texto)}</p>`}`).join("")}
 <div class="pf"><span>Emitido em ${agora()}</span><span>Código: <b>${d.codigo}</b></span><span class="warn">Versão piloto, sem validade oficial.</span></div></div>`;
let LOGOPNG=null;
const logoPng=()=>LOGOPNG||(LOGOPNG=new Promise(ok=>{const i=new Image();i.onload=()=>{const c=document.createElement("canvas");c.width=i.naturalWidth;c.height=i.naturalHeight;c.getContext("2d").drawImage(i,0,0);ok({src:c.toDataURL("image/png"),w:i.naturalWidth,h:i.naturalHeight})};i.onerror=()=>ok(null);i.src=LOGO}));
async function gerarPDF(d){const J=window.jspdf&&window.jspdf.jsPDF;if(!J)throw new Error("pdf");const pdf=new J({unit:"mm",format:"a4"}),W=210,M=18,logo=await logoPng();let y=0;
 const head=()=>{pdf.setFillColor(0,20,43);pdf.rect(0,0,W,30,"F");pdf.setFillColor(230,196,41);pdf.rect(0,30,W,1.6,"F");if(logo){const h=22;pdf.addImage(logo.src,"PNG",M,4,h*logo.w/logo.h,h)}pdf.setTextColor(255,255,255);pdf.setFont("helvetica","bold");pdf.setFontSize(13);pdf.text("GUARDA MUNICIPAL DE SÃO LUÍS",M+24,13);pdf.setFont("helvetica","normal");pdf.setFontSize(9);pdf.text("Secretaria Municipal de Segurança com Cidadania",M+24,19);pdf.text("Prefeitura Municipal de São Luís",M+24,24);y=44};
 const foot=()=>{const n=pdf.getNumberOfPages();for(let i=1;i<=n;i++){pdf.setPage(i);pdf.setDrawColor(200);pdf.line(M,280,W-M,280);pdf.setFontSize(8);pdf.setTextColor(90);pdf.setFont("helvetica","normal");pdf.text("Emitido em "+agora()+"  ·  Código: "+d.codigo,M,285);pdf.setTextColor(180,40,30);pdf.text("Versão piloto, sem validade oficial.",M,290);pdf.setTextColor(90);pdf.text("Página "+i+" de "+n,W-M,290,{align:"right"})}};
 const need=h=>{if(y+h>274){pdf.addPage();head()}};
 head();pdf.setTextColor(0,20,43);pdf.setFont("helvetica","bold");pdf.setFontSize(16);pdf.text(d.titulo.toUpperCase(),W/2,y,{align:"center"});y+=10;
 for(const s of d.secoes){need(16);pdf.setFillColor(238,242,247);pdf.rect(M,y-5,W-2*M,7.5,"F");pdf.setFont("helvetica","bold");pdf.setFontSize(10);pdf.setTextColor(0,20,43);pdf.text(s.t.toUpperCase(),M+2,y);y+=8;pdf.setTextColor(20);
  if(s.kv)for(const[k,v]of s.kv){const ls=pdf.splitTextToSize(String(v),W-2*M-52);need(ls.length*5+2);pdf.setFont("helvetica","normal");pdf.setFontSize(9);pdf.setTextColor(100);pdf.text(k,M+2,y);pdf.setTextColor(20);pdf.setFont("helvetica","bold");pdf.setFontSize(10);pdf.text(ls,M+52,y);y+=ls.length*5+1.5}
  else if(s.tabela){const cw=[48,36,W-2*M-84];const row=(r,b)=>{const ls=r.map((c,i)=>pdf.splitTextToSize(String(c),cw[i]-3));const h=Math.max(...ls.map(l=>l.length))*4.6+2;need(h);let x=M;pdf.setFont("helvetica",b?"bold":"normal");pdf.setFontSize(9);ls.forEach((l,i)=>{pdf.text(l,x+2,y);x+=cw[i]});y+=h;pdf.setDrawColor(225);pdf.line(M,y-3.5,W-M,y-3.5)};row(s.tabela.cols,1);(s.tabela.rows.length?s.tabela.rows:[["Nenhum registro.","",""]]).forEach(r=>row(r,0))}
  else{pdf.setFont("helvetica","normal");pdf.setFontSize(10);const ls=pdf.splitTextToSize(s.texto,W-2*M-4);need(ls.length*5);pdf.text(ls,M+2,y);y+=ls.length*5}
  y+=5}
 if(d.assin){need(30);y+=12;pdf.setDrawColor(60);[[M,"Solicitante"],[W/2+5,"Substituto"]].forEach(([x,l])=>{pdf.line(x,y,x+70,y);pdf.setFontSize(8);pdf.setFont("helvetica","normal");pdf.text(l,x,y+4)})}
 foot();return pdf.output("blob")}
V.comp=()=>{const d=docDe(S.param);if(!d)return shell(`<div class="empty">Documento não encontrado.</div>`);
 return shell(`${docHTML(d)}<button class="btn gold block" data-a="baixarPDF"><span class="ms">picture_as_pdf</span>Baixar PDF</button>`)};

/* ---------- ações ---------- */
const busy=async(btn,fn)=>{const b=typeof btn==="string"?document.getElementById(btn):btn;if(b){if(b.disabled)return;b.disabled=true}try{return await fn()}finally{if(b&&document.body.contains(b))b.disabled=false}};
const rpc=async(nome,args,ok)=>{const{error}=await sb.rpc(nome,args);if(error){toast(esc(msgErro(error)));return false}await carregar();render();if(ok)toast(ok);return true};
const A={
 notifs:()=>{const l=notifs(),temAv=l.some(n=>n.aviso);sheet(`<div class="row between"><h2 style="margin:0">Notificações</h2><button class="iconbtn" data-a="x" aria-label="Fechar"><span class="ms">close</span></button></div>
  ${l.length?l.map(n=>`<div class="list-item" style="align-items:flex-start;gap:10px"><span class="ms" style="color:var(--gold)">${n.ic}</span><div style="flex:1;min-width:0"><b style="color:#fff">${esc(n.t)}</b>${n.sub?`<div class="muted">${esc(n.sub)}</div>`:""}</div>${n.aviso?`<button class="link" style="font-size:12px" data-a="notifLida" data-id="${n.aviso}">Ok</button>`:`<button class="link" style="font-size:12px" data-a="notifIr" data-t="${n.go}" data-id="${n.id||""}">Abrir</button>`}</div>`).join(""):`<div class="empty" style="padding:30px 0"><span class="ms" style="font-size:36px">notifications_off</span><br>Nenhuma notificação.</div>`}
  ${temAv?`<button class="btn ghost block" style="margin-top:12px" data-a="notifTodas">Marcar avisos como lidos</button>`:""}`)},
 notifLida:async e=>{const id=+e.dataset.id;S.avisos=S.avisos.filter(a=>a.id!==id);render();A.notifs();await sb.from("avisos").update({lido:true}).eq("id",id)},
 notifTodas:async()=>{const ids=S.avisos.map(a=>a.id);S.avisos=[];render();A.notifs();if(ids.length)await sb.from("avisos").update({lido:true}).in("id",ids)},
 notifIr:e=>{closeSheet();go(e.dataset.t,e.dataset.id?(isNaN(+e.dataset.id)?e.dataset.id:+e.dataset.id):null)},
 go:e=>{if(e.dataset.f)S.filtro=e.dataset.f;go(e.dataset.t,e.dataset.id||null)},
 back:()=>{const v=S.voltar;if(S.tela==="escnova")return go("escalante");if(v&&v.t&&v.t!==S.tela)return go(v.t,v.p);go(HOME[perfilAtual()]||"inicio")},
 closeSheet:(e,ev)=>{if(ev.target===e){closeSheet();if(S.tela==="escnova")render()}},
 x:()=>{closeSheet();if(S.tela==="escnova")render()},
 atualizar:async()=>{await carregar().catch(()=>toast("Sem conexão."));route();render()},
 sair:async()=>{await sb.auth.signOut();location.reload()},
 irLogin:()=>{S.tela="login";render()},
 novoCad:()=>{S.cad=S.cad||cadNovo();S.tela="cadastro";render();scrollTo(0,0)},
 cadSair:()=>{S.tela="login";render()},
 cadIr:e=>{S.cad.etapa=+e.dataset.e;render();scrollTo(0,0)},
 cadVoltar:()=>{S.cad.etapa=Math.max(0,S.cad.etapa-1);render();scrollTo(0,0)},
 cadAvancar:()=>{if(!cadValida(S.cad.etapa))return;S.cad.etapa++;render();scrollTo(0,0)},
 recIniciar:()=>{S.rec={etapa:0};S.tela="recuperar";render();scrollTo(0,0)},
 recSair:()=>{S.rec=null;S.tela="login";render()},
 recReenviar:e=>busy(e,async()=>{const j=await recFn({acao:"pedir",ident:S.rec.ident});if(j.erro)return toast(esc(j.erro));if(j.destino)S.rec.destino=j.destino;toast("Se os dados estiverem certos, um novo código foi enviado.")}),
 cadEnviar:e=>busy(e,async()=>{for(let i=0;i<4;i++)if(!cadValida(i)){if(i<3){S.cad.etapa=i;render();cadValida(i)}return}
  const c=S.cad;try{const r=await fetch(CFG.url+"/functions/v1/cadastro",{method:"POST",headers:{"Content-Type":"application/json",apikey:CFG.key,Authorization:"Bearer "+CFG.key},body:JSON.stringify({matricula:c.mat.trim(),senha:c.senha,nome:c.nome.trim(),guerra:c.guerra.trim(),tel:c.tel,email:c.email.trim(),cpf:c.cpf,patente:c.pat,bm:!!c.bm,adm:c.adm,posto:c.posto,turno:c.turno,perfil:c.perfil,foto:c.foto,selfie:c.selfie})});
   const j=await r.json().catch(()=>({}));if(!r.ok||!j.ok){errBox("cerr",[j.erro||"Não foi possível enviar. Tente de novo."]);return}
   S.cad=null;S.tela="cadastrook";S.param=j.protocolo;render()}catch(x){errBox("cerr",["Sem conexão. Tente de novo."])}}),
 fotoInstr:e=>{const k=e.dataset.k,troca=k==="troca";
  sheet(`<div class="row between"><h2 style="margin:0">Como deve ser a foto</h2><button class="iconbtn" data-a="x" aria-label="Fechar"><span class="ms">close</span></button></div>
  <div class="row" style="gap:16px;margin:14px 0 6px;align-items:center">${GUIA_SVG}<div class="small" style="flex:1"><b style="color:#fff">Do pescoço para cima</b><div class="muted" style="margin-top:4px">Rosto centralizado, pouco espaço acima da cabeça e a gola da farda aparecendo.</div></div></div>
  <div class="regras">${FOTO_OK.map(t=>`<div><span class="ms ok">check_circle</span>${t}</div>`).join("")}${FOTO_NAO.map(t=>`<div><span class="ms no">cancel</span>${t}</div>`).join("")}</div>
  <div class="note ${troca?"gold":""}" style="margin:12px 0 14px"><span class="ms">${troca?"hourglass_top":"verified_user"}</span><span>${troca?"A nova foto vai para análise da Chefia do Corpo de Guarda e só substitui a atual depois de aprovada.":"A foto é conferida pela Coordenação junto com o cadastro."}</span></div>
  <div class="grid2"><label class="btn ghost" for="fsel"><span class="ms">photo_library</span>Galeria</label><label class="btn gold" for="fcam"><span class="ms">photo_camera</span>Tirar foto</label></div>
  <input id="fsel" type="file" accept="image/*" data-foto="${k}" hidden><input id="fcam" type="file" accept="image/*" capture="user" data-foto="${k}" hidden>`)},
 avisoOk:async e=>{const id=+e.dataset.id;S.avisos=S.avisos.filter(a=>a.id!==id);render();await sb.from("avisos").update({lido:true}).eq("id",id)},
 nova:e=>{S.draft=novoDraft({saida:e.dataset.s||null,tipo:e.dataset.mural?"mural":"direta"});go("nova")},
 setd:e=>{S.draft[e.dataset.k]=e.dataset.s;render()},
 tipo:e=>{S.draft.tipo=e.dataset.v;render()},
 filtro:e=>{S.filtro=e.dataset.f;render()},
 mes:e=>{S.mesOff+=+e.dataset.d;render()},
 dia:e=>{S.diaSel=e.dataset.s;render()},
 enviar:e=>busy(e,async()=>{const d=S.draft,er=[],eu=ME();
  if(!d.saida)er.push("Informe a data do serviço de saída.");else if(d.saida<=TODAY)er.push("Escolha uma data a partir de amanhã.");else if(!trabalha(eu,d.saida))er.push(`Você não está escalado em ${fd(d.saida)}.`);
  if(d.tipo==="direta"){if(!d.col)er.push("Selecione o colega.");else if(d.saida&&trabalha(d.col,d.saida))er.push(`${g(d.col).nome} já está de serviço em ${fds(d.saida)}.`)}
  if(!d.combinar){if(!d.repos)er.push("Informe a data da reposição ou marque “a combinar”.");else if(d.repos===d.saida)er.push("A reposição não pode ser no mesmo dia.");else if(trabalha(eu,d.repos))er.push(`Você já está de serviço em ${fds(d.repos)}.`);else if(d.tipo==="direta"&&d.col&&!trabalha(d.col,d.repos))er.push(`${g(d.col).nome} não está escalado em ${fds(d.repos)}. A reposição precisa ser num serviço dele.`)}
  if(d.saida&&contaMes(eu,d.saida)>=LIMITE_MES)er.push(`Limite de ${LIMITE_MES} permutas no mês atingido.`);
  errBox("nerr",er);if(er.length)return;
  const{data,error}=await sb.from("permutas").insert({sol:eu,col:d.tipo==="direta"?d.col:null,tipo:d.tipo,posto:d.posto,saida_data:d.saida,saida_ini:d.ini,saida_fim:d.fim,repos_data:d.combinar?null:d.repos,repos_ini:d.combinar?null:d.ini,repos_fim:d.combinar?null:d.fim,obs:d.obs.trim()||null}).select().single();
  if(error){errBox("nerr",[msgErro(error)]);return}
  S.draft=null;await carregar();go("enviado",data.id)}),
 responder:e=>{const id=+e.dataset.id,ok=e.dataset.v==="1";if(ok)return busy(e,()=>rpc("responder_permuta",{p_id:id,p_aceitar:true,p_msg:null},"Permuta aceita. Segue para o Coordenador."));
  sheet(`<h2>Recusar a permuta?</h2><div class="field"><label for="motr">Motivo (opcional)</label><textarea id="motr" placeholder="Ex.: tenho compromisso nesse dia."></textarea></div><div class="grid2"><button class="btn ghost" data-a="x">Voltar</button><button class="btn red" data-a="recusarOk" data-id="${id}">Recusar</button></div>`)},
 recusarOk:e=>busy(e,async()=>{const m=document.getElementById("motr").value;closeSheet();await rpc("responder_permuta",{p_id:+e.dataset.id,p_aceitar:false,p_msg:m},"Permuta recusada.")}),
 aceitarMural:e=>{const r=S.reqs.find(x=>x.id===+e.dataset.id);if(!r)return;if(trabalha(ME(),r.saida.data))return toast(`Você já está de serviço em ${fds(r.saida.data)}.`);
  sheet(`<h2>Assumir o serviço de ${esc(g(r.sol).nome)}?</h2><p class="sub">Você cobre ${fd(r.saida.data)}, ${r.saida.ini} às ${r.saida.fim}${r.repos.data?`, e ele repõe em ${fd(r.repos.data)}`:". A reposição será combinada depois"}.</p><div class="grid2"><button class="btn ghost" data-a="x">Voltar</button><button class="btn gold" data-a="aceitarOk" data-id="${r.id}">Confirmar</button></div>`)},
 aceitarOk:e=>busy(e,async()=>{closeSheet();if(await rpc("aceitar_mural",{p_id:+e.dataset.id},"Interesse registrado. Segue para o Coordenador."))go("det",e.dataset.id)}),
 cancelar:e=>sheet(`<h2>Cancelar a solicitação?</h2><p class="sub">O colega é avisado.</p><div class="grid2"><button class="btn ghost" data-a="x">Voltar</button><button class="btn red" data-a="cancelarOk" data-id="${e.dataset.id}">Cancelar</button></div>`),
 cancelarOk:e=>busy(e,async()=>{closeSheet();await rpc("cancelar_permuta",{p_id:+e.dataset.id},"Solicitação cancelada.")}),
 informarRepos:e=>busy(e,async()=>{const v=document.getElementById("rdata").value;if(!v)return toast("Escolha uma data.");await rpc("informar_reposicao",{p_id:+e.dataset.id,p_data:v},"Reposição registrada.")}),
 decidir:e=>{const id=+e.dataset.id,papel=e.dataset.papel;if(e.dataset.v==="1")return busy(e,()=>rpc("decidir_permuta",{p_id:id,p_etapa:papel,p_aprovar:true,p_motivo:null},papel==="cp"?"Validada. Segue para a Chefia.":"Permuta aprovada."));
  sheet(`<h2>Indeferir P-${id}</h2><div class="field"><label for="motd">Motivo</label><textarea id="motd" placeholder="Ex.: efetivo mínimo do posto comprometido."></textarea></div><div class="grid2"><button class="btn ghost" data-a="x">Voltar</button><button class="btn red" data-a="indeferirOk" data-papel="${papel}" data-id="${id}">Indeferir</button></div>`)},
 indeferirOk:e=>busy(e,async()=>{const m=document.getElementById("motd").value.trim();if(!m)return toast("Informe o motivo.");closeSheet();await rpc("decidir_permuta",{p_id:+e.dataset.id,p_etapa:e.dataset.papel,p_aprovar:false,p_motivo:m},"Indeferida.")}),
 cadDecidir:e=>{const id=e.dataset.id;if(e.dataset.v==="1"){const s=document.getElementById("pf-"+id);return busy(e,()=>rpc("decidir_cadastro",{p_id:id,p_aprovar:true,p_motivo:null,p_perfil:s?s.value:"gm"},"Acesso liberado."))}
  sheet(`<h2>Recusar cadastro</h2><div class="chips" style="margin-bottom:12px">${["Matrícula não confere","Selfie não confere com a foto","Foto fora do padrão","Não pertence ao efetivo"].map(m=>`<button class="chip" data-a="motivoRapido" data-alvo="motc" data-m="${m}">${m}</button>`).join("")}</div><div class="field"><label for="motc">Motivo</label><textarea id="motc"></textarea></div><div class="grid2"><button class="btn ghost" data-a="x">Voltar</button><button class="btn red" data-a="cadRecusarOk" data-id="${id}">Recusar</button></div>`)},
 cadRecusarOk:e=>busy(e,async()=>{const m=document.getElementById("motc").value.trim();if(!m)return toast("Informe o motivo.");closeSheet();await rpc("decidir_cadastro",{p_id:e.dataset.id,p_aprovar:false,p_motivo:m,p_perfil:"gm"},"Cadastro recusado.")}),
 motivoRapido:e=>{document.getElementById(e.dataset.alvo).value=e.dataset.m+"."},
 fotoDecidir:e=>{const id=e.dataset.id;if(e.dataset.v==="1")return busy(e,()=>rpc("decidir_foto",{p_id:id,p_aprovar:true,p_motivo:null},"Foto aprovada."));
  sheet(`<h2>Recusar foto</h2><div class="chips" style="margin-bottom:12px">${["Está de óculos","Boné ou chapéu","Rosto não está de frente","Enquadramento errado","Fundo inadequado","Não é foto do servidor"].map(m=>`<button class="chip" data-a="motivoRapido" data-alvo="motf" data-m="${m}">${m}</button>`).join("")}</div><div class="field"><label for="motf">Motivo</label><textarea id="motf"></textarea></div><div class="grid2"><button class="btn ghost" data-a="x">Voltar</button><button class="btn red" data-a="fotoRecusarOk" data-id="${id}">Recusar</button></div>`)},
 fotoRecusarOk:e=>busy(e,async()=>{const m=document.getElementById("motf").value.trim();if(!m)return toast("Informe o motivo.");closeSheet();await rpc("decidir_foto",{p_id:e.dataset.id,p_aprovar:false,p_motivo:m},"Foto recusada.")}),
 editContato:()=>sheet(`<div class="row between"><h2 style="margin:0">Editar contato</h2><button class="iconbtn" data-a="x" aria-label="Fechar"><span class="ms">close</span></button></div><form id="fcont" style="margin-top:14px"><div class="field"><label for="ct1">Celular</label><input id="ct1" inputmode="tel" value="${esc(S.me.tel||"")}"></div><div class="field"><label for="ct2">E-mail</label><input id="ct2" type="email" value="${esc(S.me.email||"")}"></div><button class="btn gold block">Salvar</button></form>`),
 trocarSenha:()=>sheet(`<div class="row between"><h2 style="margin:0">Trocar senha</h2><button class="iconbtn" data-a="x" aria-label="Fechar"><span class="ms">close</span></button></div><form id="fsenha" style="margin-top:14px"><div class="field"><label for="ns1">Nova senha</label><input id="ns1" type="password" minlength="6" required autocomplete="new-password"></div><div class="field"><label for="ns2">Repita a nova senha</label><input id="ns2" type="password" required autocomplete="new-password"></div><div id="serr"></div><button class="btn gold block">Salvar</button></form>`),
 remAbrir:e=>{const k=e.dataset.k,x=(S.efetivo||[]).find(q=>q.mat===k)||{nome:k,mat:k},rp=remPend().find(r=>r.matricula===k&&r.posto===S.me.posto);
  sheet(`<div class="row between"><h2 style="margin:0">${esc(x.nome)}</h2><button class="iconbtn" data-a="x" aria-label="Fechar"><span class="ms">close</span></button></div><p class="sub">${esc(x.mat)} · ${esc(x.pat||"")} · escalado em ${esc(S.me.posto)}</p>
  ${rp?`<div class="note gold"><span class="ms">hourglass_top</span><span>Pedido de remoção enviado em ${dbr(String(rp.created_at).slice(0,10))}, aguardando a Chefia do Corpo de Guarda.<br><b>Motivo:</b> ${esc(rp.motivo)}</span></div>`:
  `<form id="frem"><input type="hidden" id="rm-k" value="${esc(k)}"><div class="field"><label for="rm1">Motivo do pedido de remoção do posto</label><textarea id="rm1" required placeholder="Explique por que o guarda deve sair deste posto."></textarea></div><p class="muted" style="margin-top:-6px">O pedido vai para análise da Chefia do Corpo de Guarda. Enquanto não for aprovado, nada muda na escala.</p><button class="btn red block"><span class="ms">person_remove</span>Solicitar remoção do posto</button></form>`}
  `)},
 grEditar:e=>{const x=S.escalas.find(q=>q.id===+e.dataset.id);S.grEd={id:x.id,grupos:x.grupos.map(gr=>gr.slice()),obs:""};go("cpgrupos")},
 grGrupo:e=>{const x=S.grEd;if(+e.dataset.d>0)x.grupos.push([]);else if(x.grupos.length>1){const ult=x.grupos.pop();x.grupos[x.grupos.length-1].push(...ult)}render()},
 grMover:e=>{const x=S.grEd,k=e.dataset.k,i=+e.dataset.i;sheet(`<div class="row between"><h2 style="margin:0">${esc(pm(k).nome)}</h2><button class="iconbtn" data-a="x" aria-label="Fechar"><span class="ms">close</span></button></div><p class="sub">Está no ${GRUPO(i)}. Mover para:</p><div class="chips">${x.grupos.map((_,j)=>j===i?"":`<button class="chip" data-a="grMoverOk" data-k="${esc(k)}" data-i="${i}" data-j="${j}">${GRUPO(j)}</button>`).join("")}</div>`)},
 grMoverOk:e=>{const x=S.grEd,k=e.dataset.k,i=+e.dataset.i,j=+e.dataset.j;x.grupos[i]=x.grupos[i].filter(m=>m!==k);x.grupos[j].push(k);closeSheet();render()},
 grSalvar:e=>{const x=S.grEd,o=S.escalas.find(q=>q.id===x.id);x.obs=(document.getElementById("gr-obs")||{}).value||"";if(x.grupos.some(gr=>!gr.length))return errBox("grerr",["Todos os grupos precisam ter pelo menos um guarda."]);if(JSON.stringify(x.grupos)===JSON.stringify(o.grupos))return errBox("grerr",["Nenhuma mudança feita nos grupos."]);
  busy(e,async()=>{const ok=await rpc("propor_grupos",{p_escala:x.id,p_grupos:gruposParaBanco({grupos:x.grupos,meta:o.meta||{}}),p_obs:x.obs},"Alteração enviada para a Chefia e o Escalante.");if(ok){S.grEd=null;go("equipe")}})},
 altAprovar:e=>busy(e,()=>rpc("decidir_alteracao",{p_id:+e.dataset.id,p_aprovar:true,p_motivo:null},"Aprovação registrada.")),
 altRecusar:e=>sheet(`<h2>Recusar alteração dos grupos</h2><div class="field"><label for="alr">Motivo da recusa</label><textarea id="alr" placeholder="Explique ao Coordenador."></textarea></div><div class="grid2"><button class="btn ghost" data-a="x">Voltar</button><button class="btn red" data-a="altRecusarOk" data-id="${e.dataset.id}">Recusar</button></div>`),
 altRecusarOk:e=>busy(e,async()=>{const m=document.getElementById("alr").value.trim();if(!m)return toast("Informe o motivo.");closeSheet();await rpc("decidir_alteracao",{p_id:+e.dataset.id,p_aprovar:false,p_motivo:m},"Alteração recusada. O Coordenador será avisado.")}),
 remAprovar:e=>busy(e,()=>rpc("decidir_remocao",{p_id:+e.dataset.id,p_aprovar:true,p_resposta:null},"Remoção aprovada. Escalas do posto atualizadas.")),
 remRecusar:e=>sheet(`<h2>Recusar pedido de remoção</h2><div class="field"><label for="rmr">Motivo da recusa</label><textarea id="rmr" placeholder="Explique ao Coordenador."></textarea></div><div class="grid2"><button class="btn ghost" data-a="x">Voltar</button><button class="btn red" data-a="remRecusarOk" data-id="${e.dataset.id}">Recusar</button></div>`),
 remRecusarOk:e=>busy(e,async()=>{const m=document.getElementById("rmr").value.trim();if(!m)return toast("Informe o motivo.");closeSheet();await rpc("decidir_remocao",{p_id:+e.dataset.id,p_aprovar:false,p_resposta:m},"Pedido recusado. O Coordenador será avisado.")}),
 efAcoes:e=>{if(!["ccg","admin"].includes(perfilAtual()))return toast("Somente a Chefia do Corpo de Guarda redefine senhas.");const x=g(e.dataset.id),pode=["ccg","admin"].includes(perfilAtual());
  sheet(`<div class="row between"><h2 style="margin:0">${esc(x.nome)}</h2><button class="iconbtn" data-a="x" aria-label="Fechar"><span class="ms">close</span></button></div><p class="sub">${esc(x.mat)} · ${esc(x.posto)} · ${PERFIL_NOME[x.perfil]}</p>
  <form id="fredef"><input type="hidden" id="rd-id" value="${x.id}"><div class="field"><label for="rd1">Senha temporária para ${esc(x.nome)}</label><input id="rd1" minlength="6" required placeholder="Mínimo 6 caracteres"></div><button class="btn ghost block"><span class="ms">key</span>Redefinir senha</button></form>
  ${pode?`<div class="hr" style="margin:16px 0"></div><form id="fperfil"><input type="hidden" id="pp-id" value="${x.id}">
  <div class="grid2"><div class="field"><label for="pp1">Perfil no app</label><select id="pp1">${Object.entries(PERFIL_NOME).filter(([k])=>k!=="admin"||perfilAtual()==="admin").map(([k,l])=>`<option value="${k}" ${k===x.perfil?"selected":""}>${l}</option>`).join("")}</select></div><div class="field"><label for="pp2">Situação</label><select id="pp2"><option value="ativo" ${x.status==="ativo"?"selected":""}>Ativo</option><option value="inativo" ${x.status==="inativo"?"selected":""}>Inativo</option></select></div></div>
  <div class="grid2"><div class="field"><label for="pp3">Patente</label><select id="pp3">${PATENTES.map(k=>`<option ${k===x.pat?"selected":""}>${k}</option>`).join("")}</select></div><div class="field"><label for="pp4">Lotação</label><select id="pp4">${postoOpts(x.posto)}</select></div></div>
  <div class="card low">${[["pp5","bm","Banda de Música (BM)"],["pp6","hab380","Habilitação pistola .380 (**)"],["pp7","hab38","Habilitação revólver .38 (*)"],["pp8","taser","Habilitação Taser (T)"]].map(([id,k,l])=>`<label class="row small" style="padding:6px 0;cursor:pointer"><input type="checkbox" id="${id}" ${x[k]?"checked":""} style="width:22px;min-height:22px;box-shadow:none;accent-color:#e6c429;flex:none">${l}</label>`).join("")}</div>
  <button class="btn gold block">Salvar dados</button></form>`:""}`)},
 escExcl:()=>{const v=document.getElementById("es7").value,x=S.escEd;if(!v)return toast("Escolha a data.");if(!x.excluir.includes(v))x.excluir.push(v);render()},
 escExclRm:e=>{const x=S.escEd;x.excluir=x.excluir.filter(d=>d!==e.dataset.d);render()},
 escMem:e=>{const x=S.escEd,gid=e.dataset.g,m=x.meta[gid]||{};sheet(`<div class="row between"><h2 style="margin:0">${esc(pm(gid).nome)}</h2><button class="iconbtn" data-a="x" aria-label="Fechar"><span class="ms">close</span></button></div><p class="sub">${GRUPO(+e.dataset.i)} · ${esc(x.nome||"nova escala")}</p>
  <form id="fmem"><input type="hidden" id="mm-id" value="${gid}"><div class="field"><label for="mm1">Função na equipe</label><select id="mm1">${["","Chefe","Guarnição","Condutor VTR","Rondante","Atendente","Supervisor"].map(f=>`<option value="${f}" ${f===(m.funcao||"")?"selected":""}>${f||"Sem função específica"}</option>`).join("")}</select></div>
  <div class="grid2"><div class="field"><label for="mm2">A partir de</label><input id="mm2" type="date" min="${x.ini}" max="${x.fim}" value="${m.desde||""}"></div><div class="field"><label for="mm3">Até</label><input id="mm3" type="date" min="${x.ini}" max="${x.fim}" value="${m.ate||""}"></div></div>
  <div class="grid2"><button type="button" class="btn red" data-a="escG" data-g="${gid}" data-i="${e.dataset.i}">Tirar do grupo</button><button class="btn gold">Salvar</button></div></form>`)},
 ferRm:e=>busy(e,async()=>{const{error}=await sb.from("feriados").delete().eq("data",e.dataset.d);if(error)return toast(esc(msgErro(error)));await carregar();render();toast("Feriado removido.")}),
 escAdd:e=>{const x=S.escEd,i=+e.dataset.i,used=new Set(x.grupos.flat()),outra=new Set(S.escalas.filter(q=>q.id!==x.id&&q.ini<=x.fim&&q.fim>=x.ini).flatMap(q=>q.grupos.flat()));
  const l=pessoas().filter(p=>!used.has(p.mat)).sort((a,b)=>(a.posto===x.posto?0:1)-(b.posto===x.posto?0:1)||a.nome.localeCompare(b.nome));
  sheet(`<div class="row between"><h2 style="margin:0">Adicionar ao ${GRUPO(i)}</h2><button class="iconbtn" data-a="x" aria-label="Fechar"><span class="ms">close</span></button></div>
  <div class="field" style="margin-top:12px"><input id="pkb" data-pick="1" placeholder="Buscar nome, matrícula ou posto" autocomplete="off"></div>
  <div id="pkl">${l.map(p=>`<button class="list-item" data-pk="${esc((p.nome+" "+p.nomeC+" "+p.mat+" "+p.posto).toLowerCase())}" style="width:100%;background:none;border:0;border-bottom:1px solid var(--line);cursor:pointer;text-align:left;${p.posto===x.posto?"":"display:none"}" data-a="escPick" data-k="${esc(p.mat)}" data-i="${i}"><span style="flex:1"><b>${esc(p.nome)}</b> <span class="muted">${esc(p.pat)}</span><div class="muted">${esc(p.mat)} · ${esc(p.posto||"sem lotação")}${outra.has(p.mat)?" · ⚠ em outra escala":""}</div></span><span class="ms">add</span></button>`).join("")}</div>
  <p class="muted" style="margin-top:10px">Mostrando o efetivo de ${esc(x.posto)}. Digite para buscar em toda a Guarda.</p>`);setTimeout(()=>document.getElementById("pkb")?.focus(),50)},
 escPick:e=>{const x=S.escEd,k=e.dataset.k,i=+e.dataset.i;if(!x.grupos.some(q=>q.includes(k)))x.grupos[i].push(k);e.remove();toast(esc(pm(k).nome)+" adicionado ao "+GRUPO(i)+".");const keep=document.querySelector(".sheet");if(!keep)render()},
 efNovo:()=>efForm(null),
 efFiltro:e=>{S.efFiltro=e.dataset.v;render()},
 efInfo:e=>{const k=e.dataset.k,x=(S.efetivo||[]).find(q=>q.mat===k)||{nome:k,mat:k},c=S.perfis.find(p=>p.mat===k&&p.status!=="pendente"),h=sitDia(k,TODAY),esc0=S.escalas.filter(q=>q.fim>=TODAY&&q.grupos.flat().includes(k)),prox=[...Array(10)].map((_,i)=>add(TODAY,i)).map(d=>({d,s:sitDia(k,d)}));
  sheet(`<div class="row between"><h2 style="margin:0">${esc(x.nome)}</h2><button class="iconbtn" data-a="x" aria-label="Fechar"><span class="ms">close</span></button></div><p class="sub">${esc(x.nomeC||"")}</p>
  <span class="tag ${SIT_COR[h.k]}">Hoje: ${esc(h.t)}</span>
  <div class="kv" style="margin-top:12px"><div><span>Matrícula</span><b>${esc(x.mat)}</b></div><div><span>Patente</span><b>${esc(patTxt(x)||"—")}</b></div><div style="grid-column:1/-1"><span>Lotação</span><b>${esc(x.posto||"A confirmar")}</b></div><div><span>Habilitações</span><b>${habTxt(x)||"Nenhuma"}</b></div><div><span>Acesso ao app</span><b>${c?"Sim":"Não"}</b></div></div>
  <div class="lbl">Escalas</div>${esc0.map(q=>`<div class="small" style="padding:3px 0">${esc(q.nome)} · ${esc(q.posto)} · ${GRUPO(q.grupos.findIndex(gr=>gr.includes(k)))}${((q.meta||{})[k]||{}).funcao?" · "+esc(q.meta[k].funcao):""} ${tagSt(q,1)}</div>`).join("")||`<div class="muted">Não está em nenhuma escala.</div>`}
  <div class="lbl">Próximos dias</div><div class="row" style="gap:4px;flex-wrap:wrap">${prox.map(o=>`<div style="text-align:center;width:28px"><div class="muted" style="font-size:10px">${SEM[parse(o.d).getDay()].slice(0,1).toUpperCase()}${parse(o.d).getDate()}</div><span class="cell" style="width:28px;height:22px;cursor:default;background:${o.s.k==="serv"?"var(--gold)":o.s.k==="perm"?"#5aa9ff":"var(--low)"}"></span></div>`).join("")}</div>
  <div class="grid2" style="margin-top:14px"><button class="btn ghost" data-a="efEdit" data-k="${esc(k)}"><span class="ms">edit</span>Editar dados</button>${c?`<button class="btn ghost" data-a="efAcoes" data-id="${c.id}"><span class="ms">key</span>Acesso ao app</button>`:"<span></span>"}</div>`)},
 efEdit:e=>efForm((S.efetivo||[]).find(x=>x.mat===e.dataset.k)),
 efPula:(e,ev)=>{ev&&ev.preventDefault&&ev.preventDefault();document.getElementById("pat-"+e.dataset.p)?.scrollIntoView({behavior:"smooth",block:"start"})},
 efRemover:e=>sheet(`<h2>Remover do efetivo?</h2><p class="sub">${esc(e.dataset.k)} sai da lista oficial e não aparece mais para as escalas. O cadastro no app, se existir, continua.</p><div class="grid2"><button class="btn ghost" data-a="x">Voltar</button><button class="btn red" data-a="efRemoverOk" data-k="${esc(e.dataset.k)}">Remover</button></div>`),
 efRemoverOk:e=>busy(e,async()=>{closeSheet();await rpc("remover_efetivo",{p_matricula:e.dataset.k},"Removido do efetivo.")}),
 escCriar:()=>{S.escEd=escNova();go("escnova")},
 escEditar:e=>{S.escEd=JSON.parse(JSON.stringify(S.escalas.find(x=>x.id===+e.dataset.id)));S.escEd.meta=S.escEd.meta||{};S.escEd.excluir=S.escEd.excluir||[];go("escnova")},
 escExcluir:e=>sheet(`<h2>Excluir escala?</h2><p class="sub">${esc((S.escalas.find(x=>x.id===+e.dataset.id)||{}).nome)}. Se estiver publicada, sai da escala dos guardas.</p><div class="grid2"><button class="btn ghost" data-a="x">Voltar</button><button class="btn red" data-a="escExcluirOk" data-id="${e.dataset.id}">Excluir</button></div>`),
 escExcluirOk:e=>busy(e,async()=>{closeSheet();const{error}=await sb.from("escalas").delete().eq("id",+e.dataset.id);if(error)return toast(esc(msgErro(error)));await carregar();render();toast("Escala excluída.")}),
 escTurno:e=>{const x=S.escEd;x.hi=e.dataset.i;x.hf=e.dataset.f;x.horas=durH(x.hi,x.hf);render()},
 escGrupo:e=>{const x=S.escEd;if(+e.dataset.d>0)x.grupos.push([]);else if(x.grupos.length>1)x.grupos.pop();render()},
 escG:e=>{closeSheet();const x=S.escEd,gid=e.dataset.g,i=+e.dataset.i,gr=x.grupos[i];if(gr.includes(gid)){x.grupos[i]=gr.filter(q=>q!==gid);delete x.meta[gid]}else if(!x.grupos.some(q=>q.includes(gid)))gr.push(gid);render()},
 escSalvar:e=>busy(e,async()=>{const x=S.escEd,er=[];if(!x.nome.trim())er.push("Dê um nome à escala.");if(!x.ini||!x.fim||x.fim<x.ini)er.push("Confira o período.");if(x.grupos.some(gr=>!gr.length))er.push("Todos os grupos precisam ter pelo menos um guarda.");errBox("eserr",er);if(er.length)return;
  const row={nome:x.nome.trim(),posto:x.posto,ini:x.ini,fim:x.fim,hi:x.hi,hf:x.hf,horas:x.horas,uteis:x.uteis,grupos:gruposParaBanco(x),excluir:(x.excluir||[]).filter(d=>d>=x.ini&&d<=x.fim),sem_feriados:!!x.semFer,status:"rascunho",devolucao:null,updated_at:new Date().toISOString()};
  const q=x.id?sb.from("escalas").update(row).eq("id",x.id):sb.from("escalas").insert(row);const{error}=await q;if(error){errBox("eserr",[msgErro(error)]);return}
  const eraVig=x.id&&(S.escalas.find(q=>q.id===x.id)||{}).st!=="rascunho";S.uniMes=x.ini.slice(0,7);S.escEd=null;await carregar();go("escalante");toast(eraVig?"Escala alterada e salva como rascunho. Envie de novo à Chefia para entrar em vigor.":"Escala salva como rascunho.")}),
 uniMes:e=>{const b=parse(((S.uniMes||((S.escalas[0]||{}).ini||proxMes()[0]).slice(0,7)))+"-01");b.setMonth(b.getMonth()+ +e.dataset.d);S.uniMes=iso(b).slice(0,7);render()},
 escEnviar:e=>{const ids=(e.dataset.ids||"").split(",").filter(Boolean).map(Number),es=S.escalas.filter(x=>ids.includes(x.id)&&x.st==="rascunho");if(!es.length)return toast("Nenhuma escala em rascunho para enviar.");
  const cf=conflitos(S.escalas.filter(x=>x.st!=="rascunho"||ids.includes(x.id)));if(cf.some(q=>es.some(x=>x.grupos.flat().includes(q.gid))))return toast("Há conflitos com outras escalas. Resolva antes de enviar.");
  busy(e,()=>rpc("enviar_escalas",{p_ids:es.map(x=>x.id)},es.length+" escala(s) enviada(s) para a Chefia do Corpo de Guarda."))},
 escAprovar:e=>busy(e,async()=>{const x=S.escalas.find(q=>q.id===+e.dataset.id);if(!x)return;const st=escStats(x),avisos=Object.entries(st).map(([mat,v])=>({para:(perfilPorMat(mat)||{}).id,texto:"Escala “"+x.nome+"” aprovada pela Chefia e em vigor: "+v.n+" serviço(s) de "+fds(x.ini)+" a "+fds(x.fim)+". Confira em Minha Escala."})).filter(a=>a.para);
  const ok=await rpc("publicar_escalas",{p_ids:[x.id],p_avisos:avisos},"Escala aprovada e em vigor. "+avisos.length+" guarda(s) com acesso ao app avisado(s).");if(ok)go("ccgescalas")}),
 escDevolver:e=>sheet(`<h2>Devolver escala ao Escalante</h2><div class="field"><label for="dvm">O que precisa ser corrigido</label><textarea id="dvm" placeholder="Ex.: grupo B com poucos guardas no fim de semana."></textarea></div><div class="grid2"><button class="btn ghost" data-a="x">Voltar</button><button class="btn red" data-a="escDevolverOk" data-id="${e.dataset.id}">Devolver</button></div>`),
 escDevolverOk:e=>busy(e,async()=>{const m=document.getElementById("dvm").value.trim();if(!m)return toast("Informe o motivo.");closeSheet();const ok=await rpc("devolver_escalas",{p_ids:[+e.dataset.id],p_motivo:m},"Escala devolvida ao Escalante.");if(ok)go("ccgescalas")}),
 verMes:e=>{const b=parse((S.verMes||e.dataset.ini)+"-01");b.setMonth(b.getMonth()+ +e.dataset.d);const m=iso(b).slice(0,7);if(m<e.dataset.ini||m>e.dataset.fim)return;S.verMes=m;render()},
 uniPublicar:e=>busy(e,async()=>{const mes=e.dataset.m,es=S.escalas.filter(x=>x.ini.slice(0,7)<=mes&&x.fim.slice(0,7)>=mes),nomeM=MESF[parse(mes+"-01").getMonth()].toLowerCase(),av0={};
  for(const x of es){const st=escStats(x);for(const[gid,v]of Object.entries(st))av0[gid]=(av0[gid]?av0[gid]+"; ":"")+x.nome+" ("+x.hi+"–"+x.hf+"): "+v.n+" serviço(s)"}
  const avisos=Object.entries(av0).map(([mat,t])=>({para:(perfilPorMat(mat)||{}).id,texto:"Escala de "+nomeM+" publicada. "+t+". Confira em Minha Escala."})).filter(a=>a.para);
  await rpc("publicar_escalas",{p_ids:es.map(x=>x.id),p_avisos:avisos},"Escala publicada. "+avisos.length+" guarda(s) com acesso ao app avisado(s).")}),
 comp:e=>go("comp",e.dataset.p),
 baixarPDF:e=>busy(e,async()=>{const d=docDe(S.param);if(!d)return;try{const blob=await gerarPDF(d);const u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download=d.arquivo+".pdf";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),20000)}catch(x){toast("Não foi possível gerar o PDF. Verifique a conexão.")}})
};

/* ---------- render e eventos ---------- */
const app=document.getElementById("app");
function route(){
 if(!S.uid){if(!["login","cadastro","cadastrook"].includes(S.tela))S.tela="login";return}
 if(!S.me){S.tela="login";return}
 if(S.me.status!=="ativo"){S.tela="pendente";return}
 if(["carregando","login","pendente","cadastro","cadastrook"].includes(S.tela))S.tela=HOME[perfilAtual()]||"inicio";
}
function render(){const f=V[S.tela]||V.login;try{app.innerHTML=f()}catch(err){console.error(err);app.innerHTML=shell(`<div class="err"><span class="ms">error</span>Algo deu errado nesta tela. Toque em atualizar.</div>`)}}
document.addEventListener("click",ev=>{const el=ev.target.closest("[data-a]");if(!el||el.tagName==="SELECT")return;const f=A[el.dataset.a];if(!f)return;if(el.tagName==="A"||el.tagName==="BUTTON")ev.preventDefault();f(el,ev)});
document.addEventListener("change",async ev=>{const el=ev.target;
 if(el.dataset.foto&&el.files&&el.files[0]){const k=el.dataset.foto;let d;try{d=await lerFoto(el.files[0],k==="selfie"?480:300,k==="selfie"?640:400)}catch(e){return toast("Não consegui abrir essa imagem. Tente JPG ou PNG.")}
  closeSheet();if(k==="cad"){S.cad.foto=d;return render()}if(k==="selfie"){S.cad.selfie=d;return render()}
  if(k==="troca"){toast("Enviando foto…");const path=`fotos/${ME()}/${Date.now()}.jpg`;const{error}=await sb.storage.from("gmsl").upload(path,dataUrlBlob(d),{contentType:"image/jpeg"});if(error)return toast("Falha ao enviar a foto.");await rpc("enviar_foto",{p_path:path},"Foto enviada para análise da Coordenação.")}return}
 if(el.dataset.sel){S[el.dataset.sel]=el.value;render();return}
 if(S.tela==="cadastro"&&el.dataset.c){S.cad[el.dataset.c]=el.type==="checkbox"?el.checked:el.value;return}
 if(S.tela==="nova"&&el.dataset.k){const k=el.dataset.k;S.draft[k]=el.type==="checkbox"?el.checked:el.value;if(["saida","repos","col","combinar"].includes(k))render();return}
 if(S.tela==="escnova"&&el.dataset.e){const k=el.dataset.e,x=S.escEd;x[k]=el.type==="checkbox"?el.checked:el.value;if(k==="hi"||k==="hf")x.horas=durH(x.hi,x.hf);if(k==="ini"&&x.fim<x.ini)x.fim=x.ini;if(k!=="nome")render();return}
});
document.addEventListener("input",ev=>{const el=ev.target;
 if(el.dataset.pick){const q=el.value.trim().toLowerCase(),x=S.escEd;document.querySelectorAll("[data-pk]").forEach(b=>{b.style.display=(q?b.dataset.pk.includes(q):b.dataset.pk.includes((x.posto||"").toLowerCase()))?"":"none"});return}
 if(S.tela==="cadastro"&&el.dataset.c&&el.tagName==="INPUT"&&el.type!=="checkbox"){let v=el.value;if(el.dataset.c==="tel")v=el.value=fmtTel(v);if(el.dataset.c==="cpf")v=el.value=fmtCPF(v);S.cad[el.dataset.c]=v;return}
 if(S.tela==="nova"&&el.dataset.k==="obs"){S.draft.obs=el.value;return}
 if(S.tela==="escnova"&&el.dataset.e==="nome"){S.escEd.nome=el.value;return}
 if(el.dataset.busca){S[el.dataset.busca]=el.value;const q=el.value.toLowerCase();clearTimeout(window.__bt);window.__bt=setTimeout(()=>{render();const i=document.getElementById(el.id);if(i){i.focus();i.setSelectionRange(q.length,q.length)}},300)}
});
document.addEventListener("submit",async ev=>{ev.preventDefault();const f=ev.target,id=f.id,btn=f.querySelector("button");
 if(id==="flogin")return busy(btn,async()=>{const m=document.getElementById("mat").value.trim(),p=document.getElementById("pw").value;
  const{data,error}=await sb.auth.signInWithPassword({email:emailDe(m),password:p});if(error){errBox("lerr",[/invalid/i.test(error.message)?"Matrícula ou senha incorretas.":"Não foi possível entrar. Verifique a conexão."]);return}
  try{const k=document.getElementById("lg-manter"),manter=!k||k.checked;localStorage.setItem("gmsl_manter",manter?"1":"0");if(manter)localStorage.removeItem("gmsl_temp");else localStorage.setItem("gmsl_temp","1");sessionStorage.setItem("gmsl_viva","1")}catch(e){}
  S.uid=data.user.id;S.tela="carregando";render();try{await carregar()}catch(e){toast("Erro ao carregar os dados.")}route();render()});
 if(id==="fmem"){const x=S.escEd,gid=document.getElementById("mm-id").value,m={funcao:document.getElementById("mm1").value,desde:document.getElementById("mm2").value,ate:document.getElementById("mm3").value};if(m.funcao||m.desde||m.ate)x.meta[gid]=m;else delete x.meta[gid];closeSheet();render();return}
 if(id==="fferiado")return busy(btn,async()=>{const d=document.getElementById("fe1").value,n=document.getElementById("fe2").value.trim();if(!d||!n)return toast("Informe data e nome.");const{error}=await sb.from("feriados").upsert({data:d,nome:n});if(error)return toast(esc(msgErro(error)));await carregar();render();toast("Feriado salvo.")});
 if(id==="fcont")return busy(btn,async()=>{closeSheet();await rpc("atualizar_contato",{p_tel:fmtTel(document.getElementById("ct1").value),p_email:document.getElementById("ct2").value},"Contato atualizado.")});
 if(id==="fsenha")return busy(btn,async()=>{const a=document.getElementById("ns1").value,b=document.getElementById("ns2").value;if(a.length<6||a!==b)return errBox("serr",["As senhas precisam ser iguais e ter pelo menos 6 caracteres."]);const{error}=await sb.auth.updateUser({password:a});if(error)return errBox("serr",["Não foi possível trocar a senha."]);closeSheet();toast("Senha alterada.")});
 if(id==="frec1")return busy(btn,async()=>{const v=document.getElementById("rc1").value.trim();const j=await recFn({acao:"pedir",ident:v});if(j.erro)return errBox("rerr",[j.erro]);S.rec={etapa:1,ident:v,destino:j.destino||null};render()});
 if(id==="frec2")return busy(btn,async()=>{const j=await recFn({acao:"validar",ident:S.rec.ident,codigo:document.getElementById("rc2").value});if(j.erro)return errBox("rerr",[j.erro]);S.rec.token=j.token;S.rec.etapa=2;render()});
 if(id==="frec3")return busy(btn,async()=>{const a=document.getElementById("rc3").value,b2=document.getElementById("rc4").value;if(a.length<6)return errBox("rerr",["A senha precisa ter pelo menos 6 caracteres."]);if(a!==b2)return errBox("rerr",["As senhas não conferem."]);const j=await recFn({acao:"redefinir",token:S.rec.token,senha:a});if(j.erro)return errBox("rerr",[j.erro]);S.rec=null;S.tela="login";render();toast("Senha alterada. Entre com a matrícula e a nova senha.")});
 if(id==="frem")return busy(btn,async()=>{const m=document.getElementById("rm1").value.trim();if(!m)return toast("Informe o motivo.");const ok=await rpc("solicitar_remocao",{p_matricula:document.getElementById("rm-k").value,p_motivo:m},"Pedido enviado para a Chefia do Corpo de Guarda.");if(ok)closeSheet()});
 if(id==="fredef")return busy(btn,async()=>{const alvo=document.getElementById("rd-id").value,s=document.getElementById("rd1").value;const{data,error}=await sb.functions.invoke("redefinir-senha",{body:{id:alvo,senha:s}});if(error||!data||!data.ok)return toast("Não foi possível redefinir.");closeSheet();toast("Senha redefinida. Passe a senha temporária ao servidor.")});
 if(id==="fef")return busy(btn,async()=>{const v=k=>document.getElementById(k);const ok=await rpc("salvar_efetivo",{p_matricula:v("ef1").value.trim(),p_nome:v("ef2").value,p_guerra:v("ef3").value,p_patente:v("ef4").value,p_posto:v("ef5").value,p_bm:v("ef6").checked,p_hab_380:v("ef7").checked,p_hab_38:v("ef8").checked,p_hab_taser:v("ef9").checked,p_novo:!!v("ef-novo").value},v("ef-novo").value?"Guarda adicionado ao efetivo.":"Dados atualizados.");if(ok)closeSheet()});
 if(id==="fperfil")return busy(btn,async()=>{const v=k=>document.getElementById(k),args={p_id:v("pp-id").value,p_perfil:v("pp1").value,p_status:v("pp2").value,p_patente:v("pp3").value,p_posto:v("pp4").value,p_bm:v("pp5").checked,p_hab_380:v("pp6").checked,p_hab_38:v("pp7").checked,p_hab_taser:v("pp8").checked};closeSheet();await rpc("atualizar_servidor",args,"Dados atualizados.")});
});
document.addEventListener("keydown",ev=>{if(ev.key==="Escape")closeSheet()});
document.addEventListener("visibilitychange",async()=>{if(document.visibilityState==="visible"&&S.uid&&S.me){try{await carregar();if(!document.querySelector(".sheet-bg")&&!["nova","escnova","cadastro"].includes(S.tela))render()}catch(e){}}});

(async()=>{
 try{await carregarRef()}catch(e){}
 try{if(localStorage.getItem("gmsl_temp")==="1"&&!sessionStorage.getItem("gmsl_viva")){await sb.auth.signOut();localStorage.removeItem("gmsl_temp")}}catch(e){}
 const{data}=await sb.auth.getSession();
 if(data.session){S.uid=data.session.user.id;try{await carregar()}catch(e){app.innerHTML=`<div class="loading"><img src="${LOGO}" alt="" style="height:96px"><div>Sem conexão com o servidor.</div><button class="btn ghost" onclick="location.reload()">Tentar de novo</button></div>`;return}}
 S.tela="login";route();render();
})();
/* ===== módulo de funções operacionais ===== */
/* ===== adaptador do app real (Supabase) para o módulo de funções operacionais ===== */
window.X=(function(){
const st={arm:{itens:[],caut:[],movs:[]},leitDet:{},missoes:[],ocorr:[],pass:[],refo:[],faltas:[],com:[],lidos:new Set(),leit:{},afast:[],aud:[],cfg:{}},urls={};
const ok=r=>{if(r&&r.error)throw r.error;return r};
const dataBlob=d=>{const[h,b]=d.split(",");const bin=atob(b),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return new Blob([u],{type:(h.match(/data:([^;]+)/)||[])[1]||"image/jpeg"})};
async function carregarX(){const p=perfilAtual(),nada=Promise.resolve({data:[]});
 const r=await Promise.all([
  sb.from("missoes").select("*").order("data",{ascending:false}).limit(2000),
  sb.from("ocorrencias").select("*").order("created_at",{ascending:false}).limit(400),
  sb.from("passagens").select("*").gte("data",add(TODAY,-60)).order("created_at",{ascending:false}),
  sb.from("reforcos").select("*").order("created_at",{ascending:false}).limit(200),
  sb.from("faltas").select("*").gte("data",add(TODAY,-400)).order("data",{ascending:false}),
  sb.from("comunicados").select("*").order("created_at",{ascending:false}).limit(60),
  sb.from("comunicado_leituras").select("*"),
  sb.from("afastamentos").select("*").order("ini",{ascending:false}).limit(1500),
  p==="admin"?sb.from("auditoria").select("*").order("created_at",{ascending:false}).limit(300):nada,
  sb.from("postos").select("nome,min_efetivo,hab_exigida,exige_chefe"),
  ["arm","admin","ccg"].includes(p)?sb.from("arm_itens").select("*").order("id"):nada,
  sb.from("arm_cautelas").select("*").order("saida",{ascending:false}).limit(1500),
  ["arm","admin","ccg"].includes(p)?sb.from("arm_municao_mov").select("*").order("created_at",{ascending:false}).limit(5000):nada]);
 const D=i=>(r[i]&&!r[i].error&&r[i].data)||[];
 st.missoes=D(0).map(x=>({id:x.id,desc:x.descricao,data:x.data,horas:+x.horas,tipo:x.tipo,mats:x.guardas||[]}));
 st.ocorr=D(1).map(x=>({...x,hora:x.hora?String(x.hora).slice(0,5):"",fotos:x.fotos||[]}));
 st.pass=D(2).map(x=>({...x,autor_nome:(g(x.autor)||{}).nome,recebido_nome:x.recebido_por?(g(x.recebido_por)||{}).nome:null}));
 st.refo=D(3);st.faltas=D(4);st.com=D(5);
 const L=D(6);st.lidos=new Set(L.filter(x=>x.perfil_id===S.uid).map(x=>x.comunicado_id));st.leit={};L.forEach(x=>{(st.leit[x.comunicado_id]=st.leit[x.comunicado_id]||[]).push(x.perfil_id);(st.leitDet[x.comunicado_id]=st.leitDet[x.comunicado_id]||[]).push(x)});
 st.afast=D(7).map(x=>({id:x.id,mat:x.matricula||(g(x.servidor)||{}).mat,tipo:x.tipo,ini:x.ini,fim:x.fim,obs:x.obs,status:x.status||"aprovado",arquivo:x.arquivo,motivo:x.motivo}));
 st.arm={itens:D(10),caut:D(11).map(x=>({...x,saida:x.saida||x.created_at})),movs:D(12)};
 st.aud=D(8);st.cfg={};D(9).forEach(x=>{if(x.min_efetivo||x.hab_exigida||x.exige_chefe)st.cfg[x.nome]={min:x.min_efetivo||0,hab:x.hab_exigida||"",chefe:!!x.exige_chefe}})}
const _carregar=carregar;carregar=async function(){await _carregar();try{if(S.me&&S.me.status==="ativo")await carregarX()}catch(e){console.warn(e)}};
const _back=A.back;A.back=e=>{if(window.X_BACK&&X_BACK.has(S.tela))return X.voltar();return _back(e)};
const up=async(path,blob,type)=>{ok(await sb.storage.from("gmsl").upload(path,blob,{contentType:type,upsert:false}));return path};
const ACT={
 async ocorrencia(a){const fotos=[];for(let i=0;i<a.fotos.length;i++)fotos.push(await up(`ocorrencias/${S.uid}/${Date.now()}-${i}.jpg`,dataBlob(a.fotos[i]),"image/jpeg"));
  const r=ok(await sb.from("ocorrencias").insert({posto:a.posto,data:a.data,hora:a.hora||null,natureza:a.natureza,descricao:a.descricao,local:a.local||null,envolvidos:a.envolvidos||null,providencias:a.providencias||null,fotos,autor_nome:S.me.nome}).select("id").single());return r.data.id},
 async passagem(a){ok(await sb.from("passagens").insert({posto:a.posto,data:a.data,turno:a.turno,pendencias:a.pendencias}))},
 async passagemOk(a){ok(await sb.rpc("confirmar_passagem",{p_id:+a.id}))},
 async comunicado(a){ok(await sb.from("comunicados").insert({titulo:a.titulo,texto:a.texto,alvo:a.alvo,autor_nome:S.me.nome}))},
 async comLer(a){await sb.from("comunicado_leituras").insert({comunicado_id:+a.id,perfil_id:S.uid})},
 async reforco(a){ok(await sb.rpc("pedir_reforco",{p_data:a.data,p_turno:a.turno,p_qtd:a.qtd,p_motivo:a.motivo}))},
 async reforcoDecidir(a){ok(await sb.rpc("decidir_reforco",{p_id:+a.id,p_atendido:a.ok,p_resposta:a.resposta||null}))},
 async falta(a){ok(await sb.rpc("registrar_falta",{p_matricula:a.mat,p_data:a.data,p_tipo:a.tipo,p_minutos:a.minutos,p_obs:a.obs||null}))},
 async afastSalvar(a){ok(await sb.from("afastamentos").insert({matricula:a.mat,servidor:(perfilPorMat(a.mat)||{}).id||null,tipo:a.tipo,ini:a.ini,fim:a.fim,obs:a.obs||null,status:"aprovado",criado_por:S.uid}))},
 async afastRemover(a){ok(await sb.from("afastamentos").delete().eq("id",+a.id))},
 async atestadoEnviar(a){const p=await up(`atestados/${S.uid}/${Date.now()}.pdf`,a.file,"application/pdf");ok(await sb.rpc("enviar_atestado",{p_ini:a.ini,p_fim:a.fim,p_arquivo:p,p_obs:a.obs||null}))},
 async atestadoDecidir(a){ok(await sb.rpc("decidir_atestado",{p_id:+a.id,p_aprovar:a.ok,p_motivo:a.motivo||null}))},
 async postoCfg(a){ok(await sb.from("postos").update({min_efetivo:a.min,hab_exigida:a.hab,exige_chefe:!!a.chefe}).eq("nome",a.posto))},
 async escCopiar(a){ok(await sb.from("escalas").insert({nome:a.nome,posto:a.posto,ini:a.ini,fim:a.fim,hi:a.hi,hf:a.hf,horas:a.horas,uteis:a.uteis,grupos:gruposParaBanco({grupos:a.grupos,meta:a.meta}),excluir:[],sem_feriados:!!a.semFer,status:"rascunho",criado_por:S.uid}))},
 async missaoSalvar(a){const row={descricao:a.desc,data:a.data,horas:a.horas,tipo:a.tipo,guardas:a.mats};ok(a.id?await sb.from("missoes").update(row).eq("id",+a.id):await sb.from("missoes").insert(row))},
 async armItemSalvar(a){const row={categoria:a.categoria,descricao:a.descricao,calibre:a.calibre,serie:a.serie,patrimonio:a.patrimonio,validade:a.validade,obs:a.obs};if(a.status)row.status=a.status;ok(a.id?await sb.from("arm_itens").update(row).eq("id",+a.id):await sb.from("arm_itens").insert(row))},
 async armMunMov(a){ok(await sb.from("arm_municao_mov").insert({calibre:a.calibre,qtd:a.qtd,motivo:a.motivo,autor_nome:S.me.nome}))},
 async armCautelar(a){const r=ok(await sb.rpc("arm_cautelar",{p_matricula:a.mat,p_itens:a.itens.map(Number),p_municao:a.municao,p_posto:a.posto||null,p_prevista:a.prevista,p_obs:a.obs||null}));return r.data||true},
 async armConfirmar(a){ok(await sb.rpc("arm_confirmar",{p_id:+a.id}))},
 async armDescautelar(a){const r=ok(await sb.rpc("arm_descautelar",{p_id:+a.id,p_devolvidos:a.devolvidos,p_manutencao:a.manutencao,p_mun_dev:a.mun,p_obs:a.obs||null}));return r.data||true},
 async missaoRemover(a){ok(await sb.from("missoes").delete().eq("id",+a.id))}
};
return{temHE:false,temAtestado:false,panorama:"panorama",feriados:"feriados",
 p:()=>perfilAtual(),homeKey:()=>perfilAtual(),
 me:()=>{const m=S.me||{};return{id:S.uid,mat:m.mat,nome:m.nome,posto:m.posto}},
 ef:()=>S.efetivo&&S.efetivo.length?S.efetivo:ativos(),
 d:()=>st,
 leituras:id=>(st.leit[id]||[]).length,leitoresDet:id=>(st.leitDet[id]||[]).map(x=>[(g(x.perfil_id)||{}).nome||"—",new Date(x.lido_em).toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"})]),leitores:id=>(st.leit[id]||[]).map(pid=>(g(pid)||{}).nome||"—"),
 busy:(e,fn)=>busy(e,fn),
 baixar:async(blob,nome)=>{const u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download=nome;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),5000)},
 url:async p=>{if(!p)return null;if(p.startsWith("data:"))return p;if(urls[p])return urls[p];const{data}=await sb.storage.from("gmsl").createSignedUrl(p,3600);return urls[p]=data&&data.signedUrl},
 act:async(nome,a,silencioso)=>{try{const ret=await ACT[nome](a);await carregar();render();return ret||true}catch(e){console.warn(e);if(!silencioso)toast(esc(msgErro(e)||"Não foi possível concluir. Tente de novo."));return false}},
 ajustarMenus(){NAV.gm=NAV.gm.map(x=>x[0]==="solic"?["servico","assignment","Serviço"]:x);
  if(!NAV.cp.some(x=>x[0]==="posto"))NAV.cp.splice(2,0,["posto","shield","Posto"]);
  NAV.ccg=NAV.ccg.map(x=>x[0]==="panorama"?["gestao","dashboard","Gestão"]:x);
  NAV.esc=NAV.esc.map(x=>x[0]==="feriados"?["postoscfg","tune","Postos"]:x);
  NAV.he=[["he","assignment","Missões"],["herel","summarize","Relatório"],["perfil","person","Perfil"]];HOME.he="he";
  Object.assign(TITULO,{he:"Gestor de Horas Extras",herel:"Relatório de HE",atestado:"Atestado Médico"});
  X_BACK.add("panorama");X_BACK.add("feriados")}
}})();

/* ===== GMSL · módulo de funções operacionais (compartilhado entre o app e o protótipo) ===== */
(function(){
const P=()=>X.p(), ME_=()=>X.me(), D=()=>X.d();
const NATUREZAS=["Apoio a pessoa / orientação","Perturbação do sossego","Dano ao patrimônio público","Furto ou roubo","Acidente de trânsito","Violência contra a mulher","Apreensão de objeto","Conflito / desentendimento","Pessoa em situação de rua","Outros"];
const TIPO_AF={ferias:"Férias",licenca:"Licença",atestado:"Atestado médico",outro:"Outro afastamento"};
const TIPO_HE_={"50":"50%","100":"100%","100n":"100% noturno"};
const HAB_TXT={"":"Nenhuma exigência","380":"Pistola .380","38":"Revólver .38","qualquer":"Qualquer arma (.380 ou .38)"};
const nm=m=>(pm(m)||{}).nome||m;
const hojeISO=()=>TODAY;
const mesAtual=()=>TODAY.slice(0,7);
const nomeMes=m=>{const b=parse(m+"-01");return MESF[b.getMonth()]+" de "+b.getFullYear()};
const diasMes=m=>{const o=[];for(let d=m+"-01";mesDe(d)===m;d=add(d,1))o.push(d);return o};
const hrs=n=>{n=Math.round(n*10)/10;return (Number.isInteger(n)?n:n.toFixed(1).replace(".",","))+"h"};
const card=(inner,st="")=>`<div class="card" ${st?`style="${st}"`:""}>${inner}</div>`;
const tile=(ic,t,sub,tela,n,extra="")=>`<button class="card" style="border:0;text-align:left;cursor:pointer;color:inherit;margin:0;display:block;${n?"box-shadow:inset 3px 0 0 var(--gold)":""}" data-a="xIr" data-t="${tela}" ${extra}><div class="row between"><span class="ms" style="color:var(--gold)">${ic}</span>${n?`<span class="tag gold">${n}</span>`:""}</div><b style="color:#fff;display:block;margin-top:6px">${t}</b><div class="muted small">${sub}</div></button>`;
const grid=h=>`<div class="grid2">${h}</div>`;
const fld=(id,l,inner)=>`<div class="field"><label for="${id}">${l}</label>${inner}</div>`;
const inp=(id,l,o={})=>fld(id,l,`<input id="${id}" type="${o.type||"text"}" ${o.v!=null?`value="${esc(o.v)}"`:""} ${o.ph?`placeholder="${esc(o.ph)}"`:""} ${o.min?`min="${o.min}"`:""} ${o.max?`max="${o.max}"`:""} ${o.im?`inputmode="${o.im}"`:""}>`);
const sel=(id,l,ops,v)=>fld(id,l,`<select id="${id}">${ops.map(o=>{const[k,t]=Array.isArray(o)?o:[o,o];return `<option value="${esc(k)}" ${k===v?"selected":""}>${esc(t)}</option>`}).join("")}</select>`);
const txa=(id,l,ph="",v="")=>fld(id,l,`<textarea id="${id}" placeholder="${esc(ph)}">${esc(v)}</textarea>`);
const val=id=>{const e=document.getElementById(id);return e?(e.type==="checkbox"?e.checked:e.value.trim()):""};
const erro=(box,m)=>{const b=document.getElementById(box);if(b)b.innerHTML=`<div class="err"><span class="ms">error</span><span>${esc(m)}</span></div>`;else toast(esc(m))};
const vazio=t=>`<div class="empty">${t}</div>`;
const pdfBtn=(a,extra="",txt="Exportar PDF")=>`<button class="btn ghost block" data-a="${a}" ${extra}><span class="ms">picture_as_pdf</span>${txt}</button>`;
const meusPostos=()=>{const m=ME_(),s=new Set();if(m.posto)s.add(m.posto);S.escalas.filter(e=>e.st==="publicada"&&e.fim>=add(TODAY,-1)&&e.grupos.flat().includes(m.mat)).forEach(e=>s.add(e.posto));return [...s]};
const efetivo=()=>X.ef();
const escaladosHoje=(posto,d)=>{const o=[];S.escalas.forEach(e=>{if(e.st!=="publicada"||e.posto!==posto||d<e.ini||d>e.fim)return;const gi=grupoDoDia(e,d);if(gi<0)return;e.grupos[gi].forEach(m=>{if(ativoNaEsc(e,m,d))o.push({m,e,f:((e.meta||{})[m]||{}).funcao||""})})});return o};
const afastado=(m,d)=>D().afast.find(a=>a.mat===m&&a.status==="aprovado"&&a.ini<=d&&a.fim>=d);
const servDia=(m,d)=>sitDia(m,d).k==="serv"&&!afastado(m,d);
const servicosMes=(m,mes)=>diasMes(mes).filter(d=>servDia(m,d)).length;

/* ---------- PDF ---------- */
async function imgData(src){try{if(!src)return null;if(src.startsWith("data:"))return src;const r=await fetch(src);const b=await r.blob();return await new Promise(ok=>{const f=new FileReader();f.onload=()=>ok(f.result);f.onerror=()=>ok(null);f.readAsDataURL(b)})}catch(e){return null}}
async function pdfGerar(o){const J=window.jspdf&&window.jspdf.jsPDF;if(!J)throw new Error("O gerador de PDF ainda não carregou. Tente de novo.");
 const land=!!o.paisagem,pdf=new J({unit:"mm",format:"a4",orientation:land?"landscape":"portrait"}),W=land?297:210,H=land?210:297,M=14;let y=M;
 const novaPag=()=>{pdf.addPage();y=M};const cabe=h=>{if(y+h>H-M)novaPag()};
 pdf.setFont("helvetica","bold");pdf.setFontSize(9);pdf.setTextColor(90);pdf.text("PREFEITURA DE SÃO LUÍS · GUARDA MUNICIPAL DE SÃO LUÍS",M,y);y+=6;
 pdf.setTextColor(0);pdf.setFontSize(15);pdf.splitTextToSize(o.titulo,W-2*M).forEach(l=>{pdf.text(l,M,y);y+=7});
 if(o.sub){pdf.setFont("helvetica","normal");pdf.setFontSize(10);pdf.setTextColor(80);pdf.splitTextToSize(o.sub,W-2*M).forEach(l=>{pdf.text(l,M,y);y+=5});pdf.setTextColor(0)}
 y+=2;pdf.setDrawColor(200);pdf.line(M,y,W-M,y);y+=6;
 if(o.kv&&o.kv.length){pdf.setFontSize(10);o.kv.forEach(([k,v])=>{const ls=pdf.splitTextToSize(String(v??"—"),W-2*M-48);cabe(ls.length*5+1);pdf.setFont("helvetica","bold");pdf.text(String(k),M,y);pdf.setFont("helvetica","normal");ls.forEach((l,i)=>pdf.text(l,M+48,y+i*5));y+=ls.length*5+1.5});y+=3}
 const blocos=l=>(l||[]).forEach(b=>{cabe(14);pdf.setFont("helvetica","bold");pdf.setFontSize(11);pdf.text(b.titulo,M,y);y+=6;pdf.setFont("helvetica","normal");pdf.setFontSize(10);pdf.splitTextToSize(b.texto||"—",W-2*M).forEach(l=>{cabe(5);pdf.text(l,M,y);y+=5});y+=4});blocos(o.blocos);
 if(o.tabela){const t=o.tabela,n=t.cab.length,lw=t.larg||Array(n).fill((W-2*M)/n),fs=t.fonte||8.5;
  if(t.titulo){cabe(10);pdf.setFont("helvetica","bold");pdf.setFontSize(11);pdf.text(t.titulo,M,y);y+=6}
  const linha=(cells,bold,fill)=>{pdf.setFont("helvetica",bold?"bold":"normal");pdf.setFontSize(fs);const ws=cells.map((c,i)=>pdf.splitTextToSize(String(c??""),lw[i]-2));const h=Math.max(...ws.map(w=>w.length))*3.9+2.4;if(y+h>H-M){novaPag();if(!bold)linha(t.cab,true,true)}if(fill){pdf.setFillColor(232,236,242);pdf.rect(M,y-3.6,W-2*M,h,"F")}let x=M;ws.forEach((w,i)=>{w.forEach((l,j)=>pdf.text(l,x+1,y+j*3.9));x+=lw[i]});pdf.setDrawColor(225);pdf.line(M,y+h-3.6,W-M,y+h-3.6);y+=h};
  linha(t.cab,true,true);t.rows.forEach(r=>linha(r,false,false));y+=4}
 blocos(o.blocos2);
 for(const f of (o.fotos||[])){const d=await imgData(f);if(!d)continue;try{const p=pdf.getImageProperties(d),w=Math.min(W-2*M,90),h=w*p.height/p.width;cabe(h+4);pdf.addImage(d,"JPEG",M,y,w,h);y+=h+4}catch(e){}}
 if(o.assinatura){cabe(26);y+=14;pdf.line(M,y,M+80,y);pdf.setFontSize(9);pdf.text(o.assinatura,M,y+5)}
 if(o.assinaturas){cabe(30);y+=18;const lw=(W-2*M-16)/2;o.assinaturas.forEach((t,i)=>{const x=M+i*(lw+16);pdf.setDrawColor(120);pdf.line(x,y,x+lw,y);pdf.setFontSize(9);pdf.splitTextToSize(t,lw).forEach((l,j)=>pdf.text(l,x,y+5+j*4))});y+=14}
 const tot=pdf.getNumberOfPages();for(let i=1;i<=tot;i++){pdf.setPage(i);pdf.setFontSize(8);pdf.setTextColor(120);pdf.text((o.rodape?o.rodape+" · ":"")+"Gerado pelo SIGMSL · GMSL Digital em "+new Date().toLocaleString("pt-BR")+" · página "+i+" de "+tot,M,H-7)}
 return pdf.output("blob")}
async function baixarPDF(o,nome){try{const b=await pdfGerar(o);await X.baixar(b,nome);}catch(e){toast(esc(e.message||"Não foi possível gerar o PDF."))}}

/* ---------- agenda (.ics) com lembretes ---------- */
function icsPlantoes(dias){const mat=ME_().mat,gid=ME_().id,ev=[];
 for(let i=0;i<dias;i++){const d=add(TODAY,i),x=dia(gid,d);if(!["regular","cobrindo","he"].includes(x.t))continue;const m=String(x.hor||"").match(/(\d{2}):(\d{2}).*?(\d{2}):(\d{2})/);let hi="07:00",hf="19:00";if(m){hi=m[1]+":"+m[2];hf=m[3]+":"+m[4]}else{const e=(S.escalas.find(q=>q.st==="publicada"&&q.grupos.flat().includes(mat)&&d>=q.ini&&d<=q.fim))||{};hi=e.hi||hi;hf=e.hf||hf}
  let fimD=d;if(hf<=hi)fimD=add(d,1);ev.push({d,hi,fimD,hf,t:x.t==="he"?"Hora extra: "+(x.nota||""):x.t==="cobrindo"?"Plantão (permuta) · "+(x.nota||""):"Plantão GMSL · "+(x.nota||"")})}
 const f=(d,h)=>d.replace(/-/g,"")+"T"+h.replace(":","")+"00";
 const L=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//GMSL//SIGMSL//PT","CALSCALE:GREGORIAN","METHOD:PUBLISH","X-WR-CALNAME:Plantões GMSL","X-WR-TIMEZONE:America/Fortaleza"];
 ev.forEach((e,i)=>{L.push("BEGIN:VEVENT","UID:gmsl-"+mat+"-"+e.d+"-"+i+"@gmsl","DTSTAMP:"+new Date().toISOString().replace(/[-:]/g,"").slice(0,15)+"Z","DTSTART;TZID=America/Fortaleza:"+f(e.d,e.hi),"DTEND;TZID=America/Fortaleza:"+f(e.fimD,e.hf),"SUMMARY:"+e.t.replace(/[,;]/g," "),
  "BEGIN:VALARM","ACTION:DISPLAY","DESCRIPTION:Plantão amanhã","TRIGGER:-P1D","END:VALARM","BEGIN:VALARM","ACTION:DISPLAY","DESCRIPTION:Plantão em 2 horas","TRIGGER:-PT2H","END:VALARM","END:VEVENT")});
 L.push("END:VCALENDAR");return{txt:L.join("\r\n"),n:ev.length,ev}}

/* ---------- telas: Guarda ---------- */
V.servico=()=>{const lid=D().lidos,nc=D().com.filter(c=>!lid.has(c.id)).length,pp=passPend().length;
 return shell(`<h2>Serviço</h2><p class="sub">Ferramentas do dia a dia do guarda.</p>
 ${grid(tile("note_add","Registrar ocorrência","Com fotos e PDF","ocnova",0)+tile("menu_book","Minhas ocorrências",D().ocorr.filter(o=>o.autor===ME_().id).length+" registrada(s)","ocorrencias",0)+tile("sync_alt","Passagem de serviço","Registrar ou confirmar leitura","passagem",pp)+tile("campaign","Comunicados","Avisos oficiais da Chefia","comunicados",nc)+tile("more_time","Minhas horas extras","50%, 100% e 100% noturno",X.temHE?"hegm":"minhashe",0)+tile("event_available","Agenda e lembretes","Plantões no calendário do celular","agenda",0)+tile("history","Histórico de lotações","Postos em que já serviu","lotacoes",0)+tile("medical_information","Atestado médico","Enviar e acompanhar","atestado",0)+tile("swap_horiz","Minhas trocas","Permutas solicitadas","solic",0))}`)};
V.agenda=()=>{const r=icsPlantoes(60);return shell(`<h2>Agenda e lembretes</h2><p class="sub">Coloque seus plantões no calendário do celular. Cada plantão já vem com dois alarmes: <b>na véspera</b> e <b>2 horas antes</b>.</p>
 ${card(`<div class="kv"><div><span>Próximos 60 dias</span><b>${r.n} plantão(ões)</b></div><div><span>Lembretes</span><b>Véspera e 2h antes</b></div></div>`)}
 ${r.ev.slice(0,8).map(e=>`<div class="list-item"><span class="ms" style="color:var(--gold)">event</span><div style="flex:1"><b style="color:#fff">${fds(e.d)} · ${e.hi}–${e.hf}</b><div class="muted">${esc(e.t)}</div></div></div>`).join("")||vazio("Nenhum plantão nos próximos 60 dias.")}
 <button class="btn gold block" style="margin-top:12px" data-a="xAgenda" ${r.n?"":"disabled"}><span class="ms">calendar_add_on</span>Adicionar à agenda do celular</button>
 <p class="muted" style="margin-top:10px">No iPhone, abra o arquivo baixado e toque em “Adicionar tudo”. No Android, abra com o Google Agenda. Se a escala mudar (permuta, nova escala), baixe de novo para atualizar.</p>`)};
V.lotacoes=()=>{const m=ME_().mat,es=S.escalas.filter(e=>e.st==="publicada"&&e.grupos.flat().includes(m)).sort((a,b)=>a.ini<b.ini?1:-1),me=pm(m)||{};
 return shell(`<h2>Histórico de lotações</h2><p class="sub">Postos em que você foi escalado, do mais recente para o mais antigo.</p>
 ${card(`<div class="muted">Lotação atual</div><b style="color:#fff">${esc(me.posto||ME_().posto||"A confirmar")}</b>`,"box-shadow:inset 4px 0 0 var(--gold)")}
 ${es.map(e=>{const mt=(e.meta||{})[m]||{},de=mt.desde&&mt.desde>e.ini?mt.desde:e.ini,ate=mt.ate&&mt.ate<e.fim?mt.ate:e.fim;return card(`<div class="row between"><div><b style="color:#fff">${esc(e.posto)}</b><div class="muted">${esc(e.nome)} · ${GRUPO(e.grupos.findIndex(g0=>g0.includes(m)))}${mt.funcao?" · "+esc(mt.funcao):""}</div></div><span class="tag ${ate>=TODAY?"green":""}">${ate>=TODAY?"atual":"encerrada"}</span></div><div class="small" style="margin-top:6px">${fds(de)} a ${fds(ate)} · ${e.hi}–${e.hf}</div>`)}).join("")||vazio("Nenhuma escala aprovada com seu nome ainda.")}`)};
V.minhashe=()=>{const m=ME_().mat,mes=S.xMes||mesAtual(),l=D().missoes.filter(x=>x.mats.includes(m)&&mesDe(x.data)===mes).sort((a,b)=>a.data<b.data?-1:1),t={"50":0,"100":0,"100n":0};l.forEach(x=>t[x.tipo]+=+x.horas);
 return shell(`<h2>Minhas horas extras</h2>${navMes(mes)}
 <div class="grid2" style="grid-template-columns:repeat(3,1fr)">${["50","100","100n"].map(k=>`<div class="card low" style="margin:0"><div class="muted small">${TIPO_HE_[k]}</div><div class="big">${hrs(t[k])}</div></div>`).join("")}</div>
 ${card(`<div class="row between"><b>Total no mês</b><b style="color:var(--gold)">${hrs(t["50"]+t["100"]+t["100n"])}</b></div>`)}
 <div class="lbl">Missões</div>${l.map(x=>card(`<div class="row between"><b style="color:#fff">${esc(x.desc)}</b><span class="tag gold">${TIPO_HE_[x.tipo]}</span></div><div class="muted">${fds(x.data)} · ${hrs(+x.horas)}</div>`)).join("")||vazio("Nenhuma hora extra lançada neste mês.")}
 <p class="muted">As horas são lançadas pelo Gestor de HE. Se faltar alguma, procure o setor.</p>`)};
const numCom=c=>c.numero?"Nº "+String(c.numero).padStart(3,"0")+"/"+(c.ano||String(c.created_at).slice(0,4)):"Nº —";
const assin=c=>(c.autor_nome||"")+(c.autor_cargo&&c.autor_cargo!==c.autor_nome?" · "+c.autor_cargo:"");
const codCom=c=>{let h=0;const t=c.id+"|"+c.numero+"|"+c.ano+"|"+c.titulo+"|"+c.texto+"|"+c.created_at;for(let i=0;i<t.length;i++)h=(h*31+t.charCodeAt(i))>>>0;return h.toString(36).toUpperCase().padStart(7,"0")};
const navMes=mes=>`<div class="row between" style="margin:4px 0 10px"><button class="iconbtn" data-a="xMes" data-d="-1" aria-label="Mês anterior"><span class="ms">chevron_left</span></button><b style="color:#fff">${nomeMes(mes)}</b><button class="iconbtn" data-a="xMes" data-d="1" aria-label="Próximo mês"><span class="ms">chevron_right</span></button></div>`;

/* ---------- ocorrências ---------- */
V.ocnova=()=>{const ps=meusPostos(),o=S.xOc||{};const pts=P()==="gm"||P()==="cp"?(ps.length?ps:POSTOS):POSTOS;
 return shell(`<h2>Registrar ocorrência</h2><p class="sub">Descreva o fato com clareza. Depois de salvar, dá para exportar em PDF.</p>
 ${fld("oc1","Posto",`<select id="oc1">${pts.map(p=>`<option ${p===(o.posto||ps[0])?"selected":""}>${esc(p)}</option>`).join("")}</select>`)}
 <div class="grid2">${inp("oc2","Data",{type:"date",v:o.data||TODAY,max:TODAY})}${inp("oc3","Hora",{type:"time",v:o.hora||""})}</div>
 ${sel("oc4","Natureza",NATUREZAS,o.nat)}${inp("oc5","Local",{ph:"Rua, número, referência",v:o.local})}
 ${txa("oc6","O que aconteceu","Relato objetivo: quem, o quê, quando, onde e como.",o.desc)}
 ${txa("oc7","Envolvidos (opcional)","Nomes, documentos, contatos.",o.env)}${txa("oc8","Providências adotadas","Ex.: orientação, acionamento da PM/SAMU, condução à delegacia.",o.prov)}
 ${fld("oc9","Fotos (até 3)",`<input id="oc9" type="file" accept="image/*" multiple>`)}
 <div id="ocerr"></div><button class="btn gold block" data-a="xOcSalvar"><span class="ms">save</span>Salvar ocorrência</button>`)};
const ocCard=o=>`<button class="card" style="width:100%;border:0;text-align:left;cursor:pointer;color:inherit;display:block" data-a="xOcVer" data-id="${o.id}"><div class="row between"><div><div class="muted">${esc(o.posto)}</div><b style="color:#fff">${esc(o.natureza)}</b></div><span class="tag">${fds(o.data)}${o.hora?" "+o.hora.slice(0,5):""}</span></div><div class="small" style="margin-top:6px">${esc(o.descricao.slice(0,110))}${o.descricao.length>110?"…":""}</div><div class="muted small" style="margin-top:4px">Registrada por ${esc(o.autor_nome||"—")}${o.fotos.length?" · "+o.fotos.length+" foto(s)":""}</div></button>`;
V.ocorrencias=()=>{const p=P(),ehLivro=p!=="gm",fp=S.xPosto||"",l=D().ocorr.filter(o=>(p==="gm"?o.autor===ME_().id:true)&&(!fp||o.posto===fp)).sort((a,b)=>(a.data+(a.hora||""))<(b.data+(b.hora||""))?1:-1),postos=[...new Set(D().ocorr.map(o=>o.posto))];
 return shell(`<h2>${ehLivro?"Livro de ocorrências":"Minhas ocorrências"}</h2><p class="sub">${p==="cp"?"Ocorrências registradas no seu posto. A Chefia também tem acesso.":ehLivro?"Ocorrências de todos os postos.":"Ocorrências que você registrou."}</p>
 <button class="btn gold block" data-a="xIr" data-t="ocnova"><span class="ms">note_add</span>Registrar ocorrência</button>
 ${["ccg","admin"].includes(p)&&postos.length>1?`<div class="field" style="margin-top:12px"><select data-a="xFiltroPosto" id="xfp"><option value="">Todos os postos</option>${postos.map(x=>`<option ${x===fp?"selected":""}>${esc(x)}</option>`).join("")}</select></div>`:""}
 <div class="lbl between"><span>${l.length} registro(s)</span></div>${l.map(ocCard).join("")||vazio("Nenhuma ocorrência registrada.")}`)};

/* ---------- passagem de serviço ---------- */
const passPend=()=>{const ps=new Set(meusPostos()),me=ME_().id;return D().pass.filter(x=>!x.recebido_por&&x.autor!==me&&ps.has(x.posto)&&x.data>=add(TODAY,-2))};
V.passagem=()=>{const ps=P()==="cp"?[ME_().posto]:["ccg","admin"].includes(P())?[...new Set(D().pass.map(x=>x.posto))]:meusPostos(),pp=S.xPassPosto&&ps.includes(S.xPassPosto)?S.xPassPosto:ps[0],l=D().pass.filter(x=>!pp||x.posto===pp).sort((a,b)=>a.created_at<b.created_at?1:-1).slice(0,30),me=ME_().id,pode=P()!=="ccg";
 return shell(`<h2>Passagem de serviço</h2><p class="sub">Quem sai registra o que ficou pendente. Quem entra confirma que leu.</p>
 ${ps.length>1?`<div class="field"><select data-a="xPassPosto" id="xpp">${ps.map(x=>`<option ${x===pp?"selected":""}>${esc(x)}</option>`).join("")}</select></div>`:ps.length?`<div class="muted" style="margin-bottom:8px">Posto: <b style="color:#fff">${esc(pp)}</b></div>`:""}
 ${!ps.length?vazio("Você não está escalado em nenhum posto com escala em vigor."):""}
 ${pode&&ps.length?card(`<b style="color:#fff">Registrar minha passagem</b>${sel("ps1","Turno que está saindo",["Diurno (07–19)","Noturno (19–07)","24h","Expediente","Outro"])}${txa("ps2","Pendências e observações","Ex.: viatura com pneu baixo; chave do portão 2 com o vigia; aguardando retorno da Defesa Civil.")}<div id="pserr"></div><button class="btn gold block" data-a="xPassSalvar" data-p="${esc(pp)}"><span class="ms">send</span>Registrar passagem</button>`):""}
 <div class="lbl">Últimas passagens</div>
 ${l.map(x=>card(`<div class="row between"><div><b style="color:#fff">${fds(x.data)} · ${esc(x.turno||"")}</b><div class="muted">Passou: ${esc(x.autor_nome||"—")}</div></div>${x.recebido_por?`<span class="tag green">lida</span>`:`<span class="tag gold">aguardando</span>`}</div><div class="small" style="margin-top:8px;white-space:pre-wrap">${esc(x.pendencias)}</div>${x.recebido_por?`<div class="muted small" style="margin-top:6px">Confirmada por ${esc(x.recebido_nome||"—")}${x.recebido_em?" em "+new Date(x.recebido_em).toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"}):""}</div>`:pode&&x.autor!==me?`<button class="btn sm gold" style="margin-top:10px" data-a="xPassOk" data-id="${x.id}"><span class="ms">done_all</span>Li e recebi o serviço</button>`:""}`,x.recebido_por?"":"box-shadow:inset 4px 0 0 var(--gold)")).join("")||vazio("Nenhuma passagem registrada neste posto.")}`)};

/* ---------- comunicados ---------- */
V.comunicados=()=>{const p=P(),pode=["ccg","admin"].includes(p),l=D().com.slice().sort((a,b)=>a.created_at<b.created_at?1:-1),lid=D().lidos;
 return shell(`<h2>Comunicados oficiais</h2><p class="sub">Canal oficial da Guarda Municipal de São Luís. Cada comunicado recebe um número sequencial por ano, não pode ser alterado nem apagado e pode ser baixado em PDF.${pode?" Acompanhe quem já leu.":""}</p>
 ${pode?card(`<b style="color:#fff">Novo comunicado</b>${inp("cm1","Título",{ph:"Ex.: Uniforme para o desfile de 7 de setembro"})}${txa("cm2","Mensagem","Escreva o comunicado.")}${fld("cm3","Destinatários",`<select id="cm3"><option value="todos">Todo o efetivo</option>${POSTOS.map(x=>`<option>${esc(x)}</option>`).join("")}</select>`)}<div id="cmerr"></div><p class="muted small">Depois de enviado, o comunicado recebe o próximo número oficial e não pode ser editado. Para corrigir, publique um novo comunicado citando o número anterior.</p><button class="btn gold block" data-a="xComEnviar"><span class="ms">campaign</span>Enviar comunicado</button>`):""}
 <div class="lbl">Recebidos e enviados</div>
 ${l.map(c=>{const novo=!lid.has(c.id)&&!pode;return `<button class="card" style="width:100%;border:0;text-align:left;cursor:pointer;color:inherit;display:block;${novo?"box-shadow:inset 4px 0 0 var(--gold)":""}" data-a="xComVer" data-id="${c.id}"><div class="muted small" style="color:var(--gold);font-weight:700">Comunicado ${numCom(c)}</div><div class="row between"><b style="color:#fff">${esc(c.titulo)}</b>${novo?`<span class="tag gold">novo</span>`:pode?`<span class="tag">${X.leituras(c.id)} leitura(s)</span>`:`<span class="tag green">lido</span>`}</div><div class="muted small">${c.alvo==="todos"?"Todo o efetivo":esc(c.alvo)} · ${new Date(c.created_at).toLocaleDateString("pt-BR")} · ${esc(c.autor_nome||"Chefia")}</div></button>`}).join("")||vazio("Nenhum comunicado.")}`)};

/* ---------- Coordenador de Posto ---------- */
V.posto=()=>{const me=ME_(),fl=D().faltas.filter(f=>f.posto===me.posto&&mesDe(f.data)===mesAtual()).length,rf=D().refo.filter(r=>r.status==="pendente"&&r.solicitante===me.id).length,oc=D().ocorr.filter(o=>o.posto===me.posto&&o.data>=add(TODAY,-7)).length,pp=passPend().length;
 return shell(`<h2>${esc(me.posto||"Meu posto")}</h2><p class="sub">Ferramentas da Coordenação do posto.</p>
 ${grid(tile("menu_book","Livro de ocorrências",oc+" nos últimos 7 dias","ocorrencias",0)+tile("sync_alt","Passagem de serviço","Registros e confirmações","passagem",pp)+tile("group_add","Pedir reforço","Efetivo extra para um dia","reforco",rf)+tile("person_alert","Falta ou atraso",fl+" registro(s) no mês","falta",0)+tile("picture_as_pdf","Relatório mensal","PDF do posto","relposto",0)+tile("campaign","Comunicados","Avisos oficiais","comunicados",D().com.filter(c=>!D().lidos.has(c.id)).length))}`)};
V.reforco=()=>{const p=P(),me=ME_();if(["esc","ccg","admin"].includes(p)&&!S.xRefoNovo){const l=D().refo.slice().sort((a,b)=>(a.status==="pendente"?0:1)-(b.status==="pendente"?0:1)||(a.data<b.data?-1:1));
  return shell(`<h2>Pedidos de reforço</h2><p class="sub">Pedidos dos Coordenadores de Posto. Ajuste a escala e marque como atendido.</p>${l.map(r=>refoCard(r,true)).join("")||vazio("Nenhum pedido de reforço.")}`)}
 const l=D().refo.filter(r=>r.solicitante===me.id).sort((a,b)=>a.created_at<b.created_at?1:-1);
 return shell(`<h2>Pedir reforço</h2><p class="sub">O pedido vai para o Escalante, que avisa se conseguiu atender.</p>
 ${card(`<div class="muted">Posto</div><b style="color:#fff">${esc(me.posto)}</b>`)}
 <div class="grid2">${inp("rf1","Data",{type:"date",min:TODAY,v:add(TODAY,1)})}${inp("rf2","Quantos guardas",{type:"number",v:"2",min:"1",max:"50",im:"numeric"})}</div>
 ${sel("rf3","Turno",["Diurno (07–19)","Noturno (19–07)","24h","Expediente (09–15)","Outro"])}${txa("rf4","Motivo","Ex.: evento na praça com público estimado de 2 mil pessoas.")}
 <div id="rferr"></div><button class="btn gold block" data-a="xRefoPedir"><span class="ms">send</span>Enviar pedido ao Escalante</button>
 <div class="lbl">Meus pedidos</div>${l.map(r=>refoCard(r,false)).join("")||vazio("Nenhum pedido ainda.")}`)};
const refoCard=(r,dec)=>card(`<div class="row between"><div><div class="muted">${esc(r.posto)}</div><b style="color:#fff">${r.qtd} guarda(s) · ${fds(r.data)}</b></div><span class="tag ${r.status==="pendente"?"gold":r.status==="atendido"?"green":"red"}">${r.status}</span></div><div class="small" style="margin-top:6px">${esc(r.turno||"")} · ${esc(r.motivo)}</div>${r.resposta?`<div class="muted small" style="margin-top:4px">Resposta: ${esc(r.resposta)}</div>`:""}${dec&&r.status==="pendente"?`<div class="grid2" style="margin-top:10px"><button class="btn sm red" data-a="xRefoDec" data-id="${r.id}" data-v="0">Não atendido</button><button class="btn sm gold" data-a="xRefoDec" data-id="${r.id}" data-v="1">Atendido</button></div>`:""}`,r.status==="pendente"?"box-shadow:inset 4px 0 0 var(--gold)":"");
V.falta=()=>{const me=ME_(),cp=P()==="cp",ms=cp?[...matsDoPosto(me.posto)]:efetivo().map(x=>x.mat),opts=ms.map(m=>[m,nm(m)+" · "+m]).sort((a,b)=>a[1].localeCompare(b[1])),l=D().faltas.filter(f=>!cp||f.posto===me.posto).sort((a,b)=>a.data<b.data?1:-1).slice(0,40);
 return shell(`<h2>Falta ou atraso</h2><p class="sub">O registro avisa a Chefia do Corpo de Guarda e o próprio guarda.</p>
 ${opts.length?sel("fl1","Guarda",opts):vazio("Nenhum guarda escalado no posto.")}
 <div class="grid2">${inp("fl2","Data",{type:"date",v:TODAY,max:TODAY})}${sel("fl3","Tipo",[["falta","Falta"],["atraso","Atraso"]])}</div>
 ${inp("fl4","Minutos de atraso (se atraso)",{type:"number",im:"numeric",ph:"Ex.: 40"})}${txa("fl5","Observação","Ex.: não avisou; chegou às 07h40.")}
 <div id="flerr"></div><button class="btn red block" data-a="xFaltaSalvar" ${opts.length?"":"disabled"}><span class="ms">person_alert</span>Registrar</button>
 <div class="lbl">Registros recentes</div>${l.map(f=>card(`<div class="row between"><b style="color:#fff">${esc(nm(f.matricula))}</b><span class="tag ${f.tipo==="falta"?"red":"gold"}">${f.tipo}${f.minutos?" · "+f.minutos+" min":""}</span></div><div class="muted small">${fds(f.data)} · ${esc(f.posto)}${f.obs?" · "+esc(f.obs):""}</div>`)).join("")||vazio("Nenhum registro.")}`)};
V.relposto=()=>{const mes=S.xMes||mesAtual(),posto=["ccg","admin"].includes(P())&&S.xRelPosto?S.xRelPosto:ME_().posto,r=dadosPosto(posto,mes);
 return shell(`<h2>Relatório mensal do posto</h2>${["ccg","admin"].includes(P())?`<div class="field"><select data-a="xRelPostoSel" id="xrp">${POSTOS.map(x=>`<option ${x===posto?"selected":""}>${esc(x)}</option>`).join("")}</select></div>`:`<p class="sub">${esc(posto)}</p>`}${navMes(mes)}
 <div class="grid2">${[["Guardas escalados",r.guardas.length],["Serviços no mês",r.serv],["Permutas aprovadas",r.perm],["Faltas / atrasos",r.faltas.length],["Ocorrências",r.ocorr.length],["Passagens registradas",r.pass]].map(([k,v])=>`<div class="card low" style="margin:0"><div class="muted small">${k}</div><div class="big">${v}</div></div>`).join("")}</div>
 <div class="lbl">Serviços por guarda</div>${r.guardas.map(x=>`<div class="list-item"><div style="flex:1"><b style="color:#fff">${esc(nm(x.m))}</b><div class="muted small">${x.m}</div></div><b>${x.n}</b></div>`).join("")||vazio("Sem escala aprovada neste mês.")}
 <div style="margin-top:12px">${pdfBtn("xRelPostoPDF",`data-p="${esc(posto)}" data-m="${mes}"`)}</div>`)};
function dadosPosto(posto,mes){const ds=diasMes(mes),cont={};let serv=0;ds.forEach(d=>escaladosHoje(posto,d).forEach(o=>{if(servDia(o.m,d)){cont[o.m]=(cont[o.m]||0)+1;serv++}}));
 const guardas=Object.entries(cont).map(([m,n])=>({m,n})).sort((a,b)=>nm(a.m).localeCompare(nm(b.m)));
 const perm=(S.reqs||[]).filter(r=>r.posto===posto&&mesDe(r.saida.data)===mes&&status(r).k==="ok").length;
 return{guardas,serv,perm,faltas:D().faltas.filter(f=>f.posto===posto&&mesDe(f.data)===mes),ocorr:D().ocorr.filter(o=>o.posto===posto&&mesDe(o.data)===mes),pass:D().pass.filter(x=>x.posto===posto&&mesDe(x.data)===mes).length}}

/* ---------- Chefia ---------- */
V.gestao=()=>{const at=D().afast.filter(a=>a.status==="pendente").length,mapa=mapaDia(TODAY),desc=mapa.filter(x=>x.min&&x.n<x.min).length;
 return shell(`<h2>Gestão do efetivo</h2><p class="sub">Relatórios, comunicados e controle de afastamentos.</p>
 ${grid(tile("map","Mapa do dia","Guardas por posto agora","mapa",desc)+tile("query_stats","Relatório por guarda","Faltas, atestados e permutas","relguardas",0)+tile("campaign","Comunicados","Enviar e ver leituras","comunicados",0)+tile("beach_access","Férias e licenças","Afastamentos e atestados","afast",at)+tile("menu_book","Livro de ocorrências","Todos os postos","ocorrencias",0)+tile("sync_alt","Passagens de serviço","Todos os postos","passagem",0)+tile("person_alert","Faltas e atrasos","Registrar e consultar","falta",0)+tile("picture_as_pdf","Relatório de posto","PDF mensal","relposto",0)+tile("monitoring","Panorama","Números das permutas",X.panorama,0))}`)};
function mapaDia(d){const cfg=D().cfg,ps=new Set();S.escalas.filter(e=>e.st==="publicada"&&d>=e.ini&&d<=e.fim).forEach(e=>ps.add(e.posto));Object.keys(cfg).forEach(p=>{if(cfg[p].min)ps.add(p)});
 return [...ps].map(p=>{const l=escaladosHoje(p,d).filter(o=>servDia(o.m,d));return{p,n:l.length,l,min:(cfg[p]||{}).min||0}}).sort((a,b)=>((a.min&&a.n<a.min)?0:1)-((b.min&&b.n<b.min)?0:1)||a.p.localeCompare(b.p))}
V.mapa=()=>{const d=S.xDia||TODAY,m=mapaDia(d),tot=m.reduce((t,x)=>t+x.n,0),desc=m.filter(x=>x.min&&x.n<x.min);
 return shell(`<h2>Mapa do dia</h2><div class="row between" style="margin:4px 0 10px"><button class="iconbtn" data-a="xDia" data-d="-1" aria-label="Dia anterior"><span class="ms">chevron_left</span></button><b style="color:#fff">${SEM[parse(d).getDay()]}, ${fds(d)}</b><button class="iconbtn" data-a="xDia" data-d="1" aria-label="Próximo dia"><span class="ms">chevron_right</span></button></div>
 <div class="grid2"><div class="card low" style="margin:0"><div class="muted small">Guardas de serviço</div><div class="big">${tot}</div></div><div class="card low" style="margin:0"><div class="muted small">Postos abaixo do mínimo</div><div class="big" style="color:${desc.length?"#ff6b5e":"inherit"}">${desc.length}</div></div></div>
 ${m.map(x=>{const baixo=x.min&&x.n<x.min;return `<details class="card" style="${baixo?"box-shadow:inset 4px 0 0 #ff6b5e":""}"><summary class="row between" style="cursor:pointer;list-style:none"><div style="flex:1"><b style="color:#fff">${esc(x.p)}</b><div class="muted small">${x.min?"Mínimo "+x.min:"Mínimo não configurado"}</div></div><span class="tag ${baixo?"red":"green"}">${x.n}${x.min?" / "+x.min:""}</span></summary><div class="small" style="margin-top:8px">${x.l.map(o=>esc(nm(o.m))+(o.f?" ("+esc(o.f)+")":"")+" · "+o.e.hi+"–"+o.e.hf).join("<br>")||"Ninguém de serviço."}</div></details>`}).join("")||vazio("Nenhuma escala em vigor neste dia.")}
 <p class="muted">O mínimo de cada posto é configurado pelo Escalante, em Postos.</p>`)};
function dadosGuardas(mes){const ds=diasMes(mes),o={};const reg=m=>o[m]=o[m]||{m,falta:0,atraso:0,atest:0,afast:0,perm:0,cobriu:0,serv:0};
 D().faltas.filter(f=>mesDe(f.data)===mes).forEach(f=>reg(f.matricula)[f.tipo]++);
 D().afast.filter(a=>a.status==="aprovado"&&a.ini.slice(0,7)<=mes&&a.fim.slice(0,7)>=mes).forEach(a=>{const n=ds.filter(d=>d>=a.ini&&d<=a.fim).length;reg(a.mat)[a.tipo==="atestado"?"atest":"afast"]+=n});
 (S.reqs||[]).filter(r=>mesDe(r.saida.data)===mes&&status(r).k==="ok").forEach(r=>{const a=(g(r.sol)||{}).mat,b=r.col&&(g(r.col)||{}).mat;if(a&&a!=="—")reg(a).perm++;if(b&&b!=="—")reg(b).cobriu++});
 const l=Object.values(o);const ef=efetivo();ef.forEach(x=>{if(o[x.mat])o[x.mat].serv=servicosMes(x.mat,mes)});
 const media=l.length?l.reduce((t,x)=>t+x.serv,0)/l.length:0;
 l.forEach(x=>{x.alerta=[];if(x.falta>=2)x.alerta.push("faltas");if(x.atraso>=3)x.alerta.push("atrasos");if(x.perm>=3)x.alerta.push("muitas permutas");if(x.atest>=5)x.alerta.push("atestados");if(x.cobriu>=3||(media&&x.serv>media*1.3&&x.serv>=12))x.alerta.push("sobrecarga");x.score=x.falta*3+x.atraso+x.perm*2+x.atest*.5+x.cobriu});
 return l.sort((a,b)=>b.score-a.score)}
V.relguardas=()=>{const mes=S.xMes||mesAtual(),l=dadosGuardas(mes);
 return shell(`<h2>Relatório por guarda</h2><p class="sub">Faltas, atrasos, dias de atestado, permutas feitas e plantões cobertos no mês. Os sinais ajudam a ver quem abusa e quem está sobrecarregado.</p>${navMes(mes)}
 ${l.map(x=>card(`<div class="row between"><div><b style="color:#fff">${esc(nm(x.m))}</b><div class="muted small">${x.m}</div></div>${x.alerta.length?`<span class="tag red">${x.alerta.join(", ")}</span>`:`<span class="tag">ok</span>`}</div><div class="small" style="margin-top:6px">Faltas ${x.falta} · Atrasos ${x.atraso} · Atestado ${x.atest} dia(s) · Afastado ${x.afast} dia(s) · Permutas ${x.perm} · Cobriu ${x.cobriu} · Serviços ${x.serv}</div>`,x.alerta.length?"box-shadow:inset 4px 0 0 #ff6b5e":"")).join("")||vazio("Nenhum registro de falta, atestado ou permuta neste mês.")}
 <div style="margin-top:12px">${pdfBtn("xRelGuardasPDF",`data-m="${mes}"`)}</div>`)};
V.afast=()=>{const p=P(),pend=D().afast.filter(a=>a.status==="pendente"),l=D().afast.filter(a=>a.status==="aprovado"&&a.fim>=add(TODAY,-30)).sort((a,b)=>a.ini<b.ini?-1:1),pode=["ccg","admin","cp"].includes(p);
 return shell(`<h2>Férias e licenças</h2><p class="sub">Afastamentos registrados aqui aparecem para o Escalante na hora de montar a escala e entram nos relatórios.</p>
 ${pend.length?`<div class="lbl between"><span>Atestados para conferir</span><span class="tag gold">${pend.length}</span></div>${pend.map(a=>card(`<div class="row between"><b style="color:#fff">${esc(nm(a.mat))}</b><span class="tag gold">atestado</span></div><div class="muted small">${fds(a.ini)} a ${fds(a.fim)}${a.obs?" · "+esc(a.obs):""}</div>${a.arquivo?`<button class="btn sm ghost" style="margin-top:8px" data-a="xAbrirArq" data-p="${esc(a.arquivo)}"><span class="ms">picture_as_pdf</span>Ver PDF</button>`:""}<div class="grid2" style="margin-top:10px"><button class="btn sm red" data-a="xAtDec" data-id="${a.id}" data-v="0">Recusar</button><button class="btn sm gold" data-a="xAtDec" data-id="${a.id}" data-v="1">Aceitar</button></div>`,"box-shadow:inset 4px 0 0 var(--gold)")).join("")}`:""}
 ${pode&&p!=="cp"?card(`<b style="color:#fff">Registrar afastamento</b>${fld("af1","Servidor",`<input id="af1" list="afl" placeholder="Digite nome ou matrícula"><datalist id="afl">${efetivo().map(x=>`<option value="${esc(x.mat)}">${esc(x.nome)} · ${esc(x.posto||"")}</option>`).join("")}</datalist>`)}${sel("af2","Tipo",[["ferias","Férias"],["licenca","Licença"],["atestado","Atestado médico"],["outro","Outro afastamento"]])}<div class="grid2">${inp("af3","Início",{type:"date",v:TODAY})}${inp("af4","Fim",{type:"date",v:add(TODAY,29)})}</div>${inp("af5","Observação",{ph:"Ex.: licença-prêmio, portaria nº…"})}<div id="aferr"></div><button class="btn gold block" data-a="xAfSalvar"><span class="ms">save</span>Registrar</button>`):""}
 <div class="lbl">Em vigor e próximos</div>${l.map(a=>card(`<div class="row between"><div><b style="color:#fff">${esc(nm(a.mat))}</b><div class="muted small">${a.mat}</div></div><span class="tag ${a.ini<=TODAY&&a.fim>=TODAY?"green":""}">${TIPO_AF[a.tipo]||a.tipo}</span></div><div class="small" style="margin-top:6px">${fds(a.ini)} a ${fds(a.fim)}${a.obs?" · "+esc(a.obs):""}</div>${pode&&p!=="cp"?`<button class="link" style="font-size:12px;margin-top:6px" data-a="xAfRm" data-id="${a.id}">Remover</button>`:""}`)).join("")||vazio("Nenhum afastamento em vigor.")}`)};

/* ---------- Escalante ---------- */
V.postoscfg=()=>{const cfg=D().cfg,rf=D().refo.filter(r=>r.status==="pendente").length,q=(S.xBuscaP||"").toLowerCase();
 return shell(`<h2>Postos</h2><p class="sub">Configure uma vez o mínimo de guardas por plantão e a habilitação exigida. O app usa isso para avisar na montagem das escalas e no Mapa do dia.</p>
 ${grid(tile("group_add","Pedidos de reforço","Dos Coordenadores","reforco",rf)+tile("event_busy","Feriados","Cadastro de feriados",X.feriados,0))}
 <div class="lbl">Configuração dos postos</div>
 ${POSTOS.map(p=>{const c=cfg[p]||{};return `<button class="card row" style="width:100%;border:0;text-align:left;cursor:pointer;color:inherit" data-a="xCfg" data-p="${esc(p)}"><div style="flex:1"><b style="color:#fff">${esc(p)}</b><div class="muted small">${c.min?"Mínimo "+c.min+" por plantão":"Mínimo não configurado"} · ${esc(HAB_TXT[c.hab||""])}${c.chefe?" · exige Chefe":""}</div></div><span class="ms" style="color:var(--muted)">edit</span></button>`}).join("")}`)};
function avisosEscala(e){const out=[],cfg=D().cfg[e.posto]||{},habOk=m=>{const x=pm(m)||{};return cfg.hab==="380"?x.hab380:cfg.hab==="38"?x.hab38:cfg.hab==="qualquer"?(x.hab380||x.hab38):true};
 e.grupos.forEach((gr,i)=>{if(cfg.min&&gr.length<cfg.min)out.push({t:"red",m:GRUPO(i)+" tem "+gr.length+" guarda(s); o mínimo do posto é "+cfg.min+"."});
  if(cfg.chefe&&gr.length&&!gr.some(m=>(((e.meta||{})[m]||{}).funcao||"")==="Chefe"))out.push({t:"gold",m:GRUPO(i)+" está sem Chefe definido."});
  if(cfg.hab&&gr.length&&!gr.some(habOk))out.push({t:"gold",m:GRUPO(i)+" não tem ninguém com "+HAB_TXT[cfg.hab].toLowerCase()+"."})});
 e.grupos.flat().forEach(m=>{const a=D().afast.find(a=>a.mat===m&&a.status==="aprovado"&&a.ini<=e.fim&&a.fim>=e.ini);if(a)out.push({t:"red",m:nm(m)+" está de "+(TIPO_AF[a.tipo]||a.tipo).toLowerCase()+" de "+fds(a.ini)+" a "+fds(a.fim)+"."});
  if(cfg.hab&&!habOk(m))out.push({t:"gold",m:nm(m)+" não tem a habilitação exigida no posto ("+HAB_TXT[cfg.hab]+")."})});
 return out}
function autoDistribuir(e,mats,nG){const pr=x=>{const i=PATENTES.indexOf((pm(x)||{}).pat);return i<0?99:i},hab=x=>{const p=pm(x)||{};return p.hab380?2:p.hab38?1:0};
 const l=[...new Set(mats)].filter(m=>!D().afast.some(a=>a.mat===m&&a.status==="aprovado"&&a.ini<=e.fim&&a.fim>=e.ini)).sort((a,b)=>pr(a)-pr(b)||hab(b)-hab(a)||nm(a).localeCompare(nm(b)));
 const G=Array.from({length:nG},()=>[]),meta={};
 l.slice(0,nG).forEach((m,i)=>{G[i].push(m);meta[m]={funcao:"Chefe",desde:"",ate:""}});
 const resto=l.slice(nG),armados=resto.filter(m=>hab(m)>0),outros=resto.filter(m=>hab(m)===0);
 const poe=m=>{let k=0;for(let i=1;i<nG;i++)if(G[i].length<G[k].length)k=i;G[k].push(m)};
 armados.forEach(poe);outros.forEach(poe);return{grupos:G,meta,fora:new Set(mats).size-l.length}}

/* ---------- Comando ---------- */
function numerosMes(mes){const ds=diasMes(mes),emp=new Set();let serv=0,horasServ=0;const desc={};
 S.escalas.filter(e=>e.st==="publicada"&&e.ini.slice(0,7)<=mes&&e.fim.slice(0,7)>=mes).forEach(e=>ds.forEach(d=>{const gi=grupoDoDia(e,d);if(gi<0)return;const l=e.grupos[gi].filter(m=>ativoNaEsc(e,m,d)&&!afastado(m,d));l.forEach(m=>{emp.add(m);serv++;horasServ+=+e.horas||12})}));
 const cfg=D().cfg;Object.keys(cfg).forEach(p=>{if(!cfg[p].min)return;ds.forEach(d=>{if(d>TODAY&&mes===mesAtual())return;const n=escaladosHoje(p,d).filter(o=>servDia(o.m,d)).length;if(n<cfg[p].min)desc[p]=(desc[p]||0)+1})});
 const he={"50":0,"100":0,"100n":0};D().missoes.filter(x=>mesDe(x.data)===mes).forEach(x=>he[x.tipo]+=(+x.horas)*x.mats.length);
 const reqs=(S.reqs||[]).filter(r=>mesDe(r.saida.data)===mes),at=D().afast.filter(a=>a.tipo==="atestado"&&a.status!=="recusado"&&(a.ini.slice(0,7)===mes||a.fim.slice(0,7)===mes));
 return{emp:emp.size,ef:efetivo().length,serv,horasServ,he,perm:reqs.length,permOk:reqs.filter(r=>status(r).k==="ok").length,at:at.length,atDias:at.reduce((t,a)=>t+ds.filter(d=>d>=a.ini&&d<=a.fim).length,0),faltas:D().faltas.filter(f=>mesDe(f.data)===mes&&f.tipo==="falta").length,atrasos:D().faltas.filter(f=>mesDe(f.data)===mes&&f.tipo==="atraso").length,ocorr:D().ocorr.filter(o=>mesDe(o.data)===mes).length,desc}}
V.numeros=()=>{const mes=S.xMes||mesAtual(),n=numerosMes(mes),heT=n.he["50"]+n.he["100"]+n.he["100n"],box=(k,v,s="")=>`<div class="card low" style="margin:0"><div class="muted small">${k}</div><div class="big">${v}</div>${s?`<div class="muted small">${s}</div>`:""}</div>`;
 return shell(`<h2>Números do mês</h2>${navMes(mes)}
 <div class="grid2">${box("Efetivo empregado",n.emp,"de "+n.ef+" no efetivo")+box("Plantões cumpridos",n.serv,hrs(n.horasServ)+" de serviço")+box("Horas extras",hrs(heT),"50% "+hrs(n.he["50"])+" · 100% "+hrs(n.he["100"])+" · not. "+hrs(n.he["100n"]))+box("Permutas",n.perm,n.permOk+" aprovada(s)")+box("Atestados",n.at,n.atDias+" dia(s) no mês")+box("Faltas / atrasos",n.faltas+" / "+n.atrasos)+box("Ocorrências",n.ocorr)+box("Postos descobertos",Object.keys(n.desc).length,"dias abaixo do mínimo")}</div>
 ${Object.keys(n.desc).length?`<div class="lbl">Postos abaixo do mínimo</div>${Object.entries(n.desc).sort((a,b)=>b[1]-a[1]).map(([p,d])=>`<div class="list-item"><span style="flex:1">${esc(p)}</span><span class="tag red">${d} dia(s)</span></div>`).join("")}`:""}
 <div style="margin-top:12px">${pdfBtn("xNumPDF",`data-m="${mes}"`)}</div>`)};
const AUD_NOME={efetivo:"Efetivo",escalas:"Escala",perfis:"Servidor/acesso",permutas:"Permuta",feriados:"Feriado",remocoes:"Remoção do posto",escala_alteracoes:"Alteração de grupos",afastamentos:"Afastamento",missoes:"Hora extra",ocorrencias:"Ocorrência",passagens:"Passagem de serviço",reforcos:"Reforço",faltas:"Falta/atraso",comunicados:"Comunicado",postos:"Posto"};
V.auditoria=()=>{const f=S.xAudT||"",l=D().aud.filter(a=>!f||a.tabela===f).slice(0,150),tabs=[...new Set(D().aud.map(a=>a.tabela))];
 return shell(`<h2>Registro de alterações</h2><p class="sub">Tudo o que foi criado, alterado ou apagado no sistema, com data e autor.</p>
 <div class="field"><select data-a="xAudSel" id="xau"><option value="">Todos os tipos</option>${tabs.map(t=>`<option value="${t}" ${t===f?"selected":""}>${AUD_NOME[t]||t}</option>`).join("")}</select></div>
 ${l.map(a=>{const ch=a.acao==="update"&&a.antes&&a.depois?Object.keys(a.depois).filter(k=>!["updated_at","created_at"].includes(k)&&JSON.stringify(a.antes[k])!==JSON.stringify(a.depois[k])):[];return card(`<div class="row between"><b style="color:#fff">${AUD_NOME[a.tabela]||a.tabela} ${esc(a.chave||"")}</b><span class="tag ${a.acao==="delete"?"red":a.acao==="insert"?"green":"blue"}">${a.acao==="insert"?"criado":a.acao==="delete"?"apagado":"alterado"}</span></div><div class="muted small">${new Date(a.created_at).toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"})} · ${esc(a.autor_nome||"sistema")}</div>${ch.length?`<div class="small" style="margin-top:6px">${ch.slice(0,4).map(k=>`<b>${esc(k)}</b>: ${esc(String(JSON.stringify(a.antes[k])??"").slice(0,40))} → ${esc(String(JSON.stringify(a.depois[k])??"").slice(0,40))}`).join("<br>")}</div>`:a.resumo?`<div class="small" style="margin-top:6px">${esc(a.resumo)}</div>`:""}`)}).join("")||vazio("Nenhum registro.")}`)};

/* ---------- Gestor de HE (app real) ---------- */
if(!X.temHE){
V.he=()=>{const mes=S.xMes||mesAtual(),l=D().missoes.filter(x=>mesDe(x.data)===mes).sort((a,b)=>a.data<b.data?1:-1);
 return shell(`<h2>Missões de hora extra</h2><p class="sub">Catalogue cada missão com os guardas, as horas e o tipo.</p><button class="btn gold block" data-a="xHeNova"><span class="ms">add</span>Cadastrar missão</button>${navMes(mes)}
 ${l.map(x=>`<button class="card" style="width:100%;border:0;text-align:left;cursor:pointer;color:inherit;display:block" data-a="xHeNova" data-id="${x.id}"><div class="row between"><b style="color:#fff">${esc(x.desc)}</b><span class="tag gold">${TIPO_HE_[x.tipo]}</span></div><div class="muted small">${fds(x.data)} · ${hrs(+x.horas)} por guarda · ${x.mats.length} guarda(s) · total ${hrs(x.horas*x.mats.length)}</div></button>`).join("")||vazio("Nenhuma missão neste mês.")}`)};
V.herel=()=>{const mes=S.xMes||mesAtual(),o={};D().missoes.filter(x=>mesDe(x.data)===mes).forEach(x=>x.mats.forEach(m=>{const r=o[m]=o[m]||{m,"50":0,"100":0,"100n":0};r[x.tipo]+=+x.horas}));const l=Object.values(o).sort((a,b)=>nm(a.m).localeCompare(nm(b.m)));
 return shell(`<h2>Relatório de horas extras</h2>${navMes(mes)}${l.map(r=>card(`<div class="row between"><b style="color:#fff">${esc(nm(r.m))}</b><b style="color:var(--gold)">${hrs(r["50"]+r["100"]+r["100n"])}</b></div><div class="muted small">${r.m} · 50% ${hrs(r["50"])} · 100% ${hrs(r["100"])} · noturno ${hrs(r["100n"])}</div>`)).join("")||vazio("Nenhuma hora extra no mês.")}<div style="margin-top:12px">${pdfBtn("xHePDF",`data-m="${mes}"`)}</div>`)};
}
if(!X.temAtestado){
V.atestado=()=>{const m=ME_().mat,l=D().afast.filter(a=>a.mat===m&&a.tipo==="atestado").sort((a,b)=>a.ini<b.ini?1:-1);
 return shell(`<h2>Atestado médico</h2><div class="note gold" style="margin-bottom:12px"><span class="ms">verified</span><span>Só valem atestados que permitam verificação digital: assinatura digital (ICP-Brasil) ou código/QR de validação do emissor.</span></div>
 <div class="grid2">${inp("at1","Primeiro dia",{type:"date",v:TODAY})}${inp("at2","Último dia",{type:"date",v:TODAY})}</div>${inp("at3","Código de validação ou observação",{ph:"Ex.: código do documento no site do emissor"})}${fld("at4","PDF do atestado",`<input id="at4" type="file" accept="application/pdf">`)}
 <div id="aterr"></div><button class="btn gold block" data-a="xAtEnviar"><span class="ms">send</span>Enviar atestado</button>
 <div class="lbl">Meus atestados</div>${l.map(a=>card(`<div class="row between"><b style="color:#fff">${fds(a.ini)} a ${fds(a.fim)}</b><span class="tag ${a.status==="aprovado"?"green":a.status==="recusado"?"red":"gold"}">${a.status==="aprovado"?"aceito":a.status==="recusado"?"recusado":"em análise"}</span></div>${a.motivo?`<div class="muted small">Motivo: ${esc(a.motivo)}</div>`:""}`)).join("")||vazio("Nenhum atestado enviado.")}`)};
}

/* ---------- navegação, títulos e menus ---------- */
window.X_BACK=new Set(["ocnova","ocorrencias","passagem","comunicados","agenda","lotacoes","minhashe","reforco","falta","relposto","mapa","relguardas","afast","numeros","auditoria","atestado","hegm","solic"]);
Object.assign(TITULO,{servico:"Serviço",agenda:"Agenda e Lembretes",lotacoes:"Histórico de Lotações",minhashe:"Minhas Horas Extras",ocnova:"Nova Ocorrência",ocorrencias:"Ocorrências",passagem:"Passagem de Serviço",comunicados:"Comunicados",posto:"Meu Posto",reforco:"Reforço",falta:"Falta ou Atraso",relposto:"Relatório do Posto",gestao:"Gestão",mapa:"Mapa do Dia",relguardas:"Relatório por Guarda",afast:"Férias e Licenças",postoscfg:"Postos",numeros:"Números do Mês",auditoria:"Auditoria",he:TITULO.he||"Gestor de HE",herel:TITULO.herel||"Relatório de HE",atestado:TITULO.atestado||"Atestado Médico"});
X.ajustarMenus();

/* ---------- sininho ---------- */
const _notifs=notifs;notifs=function(){const o=_notifs(),p=P(),lid=D().lidos;
 D().com.filter(c=>!lid.has(c.id)&&!["ccg","admin"].includes(p)).forEach(c=>o.unshift({ic:"campaign",t:"Comunicado "+numCom(c)+": "+c.titulo,sub:c.alvo==="todos"?"Todo o efetivo":c.alvo,go:"comunicados"}));
 if(["gm","cp"].includes(p))passPend().forEach(x=>o.push({ic:"sync_alt",t:"Passagem de serviço para confirmar",sub:x.posto+" · "+fds(x.data),go:"passagem"}));
 if(["esc","admin"].includes(p))D().refo.filter(r=>r.status==="pendente").forEach(r=>o.push({ic:"group_add",t:"Pedido de reforço: "+r.qtd+" guarda(s) em "+fds(r.data),sub:r.posto,go:"reforco"}));
 if(!X.temAtestado&&["cp","ccg","admin"].includes(p))D().afast.filter(a=>a.status==="pendente").forEach(a=>o.push({ic:"medical_information",t:"Atestado de "+nm(a.mat)+" para conferir",sub:fds(a.ini)+" a "+fds(a.fim),go:"afast"}));
 return o};

/* ---------- ações ---------- */
const irPara=(t,param=null)=>{if(!window.X_BACK.has(S.tela))S.xPilha=[S.tela];else (S.xPilha=S.xPilha||[]).push(S.tela);go(t,param)};
X.voltar=()=>{const v=(S.xPilha||[]).pop();go(v||HOME[X.homeKey()]||"inicio")};
async function comprimir(file){const url=await new Promise(ok=>{const f=new FileReader();f.onload=()=>ok(f.result);f.readAsDataURL(file)});const img=await new Promise((ok,er)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=er;i.src=url});const k=Math.min(1,1280/Math.max(img.width,img.height)),c=document.createElement("canvas");c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);c.getContext("2d").drawImage(img,0,0,c.width,c.height);return c.toDataURL("image/jpeg",.75)}
const ocPDF=async o=>{const fotos=[];for(const f of o.fotos)fotos.push(await X.url(f));await baixarPDF({titulo:"Registro de Ocorrência nº "+o.id,sub:o.posto+" · "+fds(o.data)+(o.hora?" às "+o.hora.slice(0,5):""),kv:[["Natureza",o.natureza],["Posto",o.posto],["Data e hora",fds(o.data)+(o.hora?" "+o.hora.slice(0,5):"")],["Local",o.local||"—"],["Registrada por",o.autor_nome||"—"]],blocos:[{titulo:"Relato",texto:o.descricao},{titulo:"Envolvidos",texto:o.envolvidos||"—"},{titulo:"Providências adotadas",texto:o.providencias||"—"}],fotos,assinatura:(o.autor_nome||"")+" · Guarda Municipal de São Luís"},"ocorrencia-"+o.id+".pdf")};
Object.assign(A,{
 xIr:e=>irPara(e.dataset.t,e.dataset.id||null),
 xMes:e=>{const b=parse((S.xMes||mesAtual())+"-01");b.setMonth(b.getMonth()+ +e.dataset.d);S.xMes=iso(b).slice(0,7);render()},
 xDia:e=>{S.xDia=add(S.xDia||TODAY,+e.dataset.d);render()},
 xAgenda:async()=>{const r=icsPlantoes(60);await X.baixar(new Blob([r.txt],{type:"text/calendar"}),"plantoes-gmsl.ics");toast(r.n+" plantão(ões) com lembretes. Abra o arquivo para adicionar à agenda.")},
 xOcSalvar:e=>X.busy(e,async()=>{const o={posto:val("oc1"),data:val("oc2"),hora:val("oc3"),natureza:val("oc4"),local:val("oc5"),descricao:val("oc6"),envolvidos:val("oc7"),providencias:val("oc8")};
  if(!o.data||o.data>TODAY)return erro("ocerr","Informe uma data válida.");if(o.descricao.length<15)return erro("ocerr","Descreva o que aconteceu (pelo menos 15 caracteres).");
  const fs=[...(document.getElementById("oc9").files||[])].slice(0,3),fotos=[];for(const f of fs){try{fotos.push(await comprimir(f))}catch(x){}}
  const id=await X.act("ocorrencia",{...o,fotos});if(id){S.xOc=null;go("ocorrencias");toast("Ocorrência registrada.");const oc=D().ocorr.find(q=>q.id===id);if(oc)A.xOcVer({dataset:{id}})}}),
 xOcVer:e=>{const o=D().ocorr.find(q=>String(q.id)===String(e.dataset.id));if(!o)return;
  sheet(`<div class="row between"><h2 style="margin:0">Ocorrência nº ${o.id}</h2><button class="iconbtn" data-a="x" aria-label="Fechar"><span class="ms">close</span></button></div><p class="sub">${esc(o.posto)} · ${fds(o.data)}${o.hora?" às "+o.hora.slice(0,5):""}</p>
  <div class="kv"><div style="grid-column:1/-1"><span>Natureza</span><b>${esc(o.natureza)}</b></div><div style="grid-column:1/-1"><span>Local</span><b>${esc(o.local||"—")}</b></div><div style="grid-column:1/-1"><span>Relato</span><b style="white-space:pre-wrap">${esc(o.descricao)}</b></div>${o.envolvidos?`<div style="grid-column:1/-1"><span>Envolvidos</span><b>${esc(o.envolvidos)}</b></div>`:""}${o.providencias?`<div style="grid-column:1/-1"><span>Providências</span><b>${esc(o.providencias)}</b></div>`:""}<div><span>Registrada por</span><b>${esc(o.autor_nome||"—")}</b></div></div>
  <div id="ocfotos" class="row" style="gap:6px;flex-wrap:wrap;margin-top:10px"></div>
  <button class="btn gold block" style="margin-top:12px" data-a="xOcPDF" data-id="${o.id}"><span class="ms">picture_as_pdf</span>Exportar PDF</button>`);
  (async()=>{const box=document.getElementById("ocfotos");for(const f of o.fotos){const u=await X.url(f);if(u&&box)box.insertAdjacentHTML("beforeend",`<img src="${esc(u)}" alt="Foto da ocorrência" style="width:96px;height:96px;object-fit:cover;border-radius:10px">`)}})()},
 xOcPDF:e=>X.busy(e,()=>ocPDF(D().ocorr.find(q=>String(q.id)===String(e.dataset.id)))),
 xFiltroPosto:()=>{},
 xPassPosto:()=>{},
 xPassSalvar:e=>X.busy(e,async()=>{const t=val("ps2");if(t.length<5)return erro("pserr","Escreva as pendências (ou “sem alterações”).");if(await X.act("passagem",{posto:e.dataset.p,data:TODAY,turno:val("ps1"),pendencias:t}))toast("Passagem registrada. Quem entrar vai confirmar a leitura.")}),
 xPassOk:e=>X.busy(e,async()=>{if(await X.act("passagemOk",{id:e.dataset.id}))toast("Leitura confirmada.")}),
 xComEnviar:e=>X.busy(e,async()=>{const t=val("cm1"),m=val("cm2");if(!t||m.length<5)return erro("cmerr","Preencha título e mensagem.");if(await X.act("comunicado",{titulo:t,texto:m,alvo:val("cm3")}))toast("Comunicado enviado.")}),
 xComVer:e=>{const c=D().com.find(q=>String(q.id)===String(e.dataset.id));if(!c)return;const pode=["ccg","admin"].includes(P());
  sheet(`<div class="row between"><div><div class="muted small" style="color:var(--gold);font-weight:700">COMUNICADO ${numCom(c).toUpperCase()}</div><h2 style="margin:2px 0 0">${esc(c.titulo)}</h2></div><button class="iconbtn" data-a="x" aria-label="Fechar"><span class="ms">close</span></button></div><p class="sub">${c.alvo==="todos"?"Todo o efetivo":esc(c.alvo)} · ${new Date(c.created_at).toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"})} · ${esc(c.autor_nome||"Chefia")}</p><div style="white-space:pre-wrap;line-height:1.5">${esc(c.texto)}</div><div class="muted small" style="margin-top:10px">${esc(assin(c))}</div><button class="btn gold block" style="margin-top:12px" data-a="xComPDF" data-id="${c.id}"><span class="ms">picture_as_pdf</span>Baixar PDF</button>${pode?`<button class="btn ghost block" style="margin-top:8px" data-a="xComLeitPDF" data-id="${c.id}"><span class="ms">fact_check</span>PDF das confirmações de leitura</button>`:""}${pode?`<div class="lbl">Confirmações de leitura (${X.leituras(c.id)})</div><div class="small">${X.leitores(c.id).map(esc).join("<br>")||"Ninguém leu ainda."}</div>`:`<div class="note" style="margin-top:12px"><span class="ms">done_all</span><span>Leitura confirmada.</span></div>`}`);
  if(!pode&&!D().lidos.has(c.id))X.act("comLer",{id:c.id},true)},
 xComPDF:e=>X.busy(e,async()=>{const c=D().com.find(q=>String(q.id)===String(e.dataset.id));if(!c)return;const n=numCom(c),dt=new Date(c.created_at);
  await baixarPDF({titulo:"COMUNICADO "+n.toUpperCase(),sub:"Assunto: "+c.titulo,kv:[["Número",n],["Data",dt.toLocaleDateString("pt-BR")+" às "+dt.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})],["Destinatários",c.alvo==="todos"?"Todo o efetivo da Guarda Municipal":c.alvo],["Emitido por",(assin(c)||"—")]],blocos:[{titulo:"Texto",texto:c.texto}],assinatura:assin(c),rodape:"Comunicado oficial "+n+" · código "+codCom(c)},"comunicado-"+n.replace(/\D+/g,"-").replace(/^-|-$/g,"")+".pdf")}),
 xComLeitPDF:e=>X.busy(e,async()=>{const c=D().com.find(q=>String(q.id)===String(e.dataset.id));if(!c)return;const n=numCom(c),l=X.leitoresDet?X.leitoresDet(c.id):X.leitores(c.id).map(x=>[x,""]);
  await baixarPDF({titulo:"Confirmações de leitura · Comunicado "+n,sub:"Assunto: "+c.titulo,kv:[["Destinatários",c.alvo==="todos"?"Todo o efetivo":c.alvo],["Leituras confirmadas",l.length]],tabela:{cab:["Servidor","Lido em"],larg:[110,72],rows:l}},"leituras-comunicado-"+n.replace(/\D+/g,"-").replace(/^-|-$/g,"")+".pdf")}),
 xRefoPedir:e=>X.busy(e,async()=>{const q=+val("rf2"),m=val("rf4"),d=val("rf1");if(!d||d<TODAY)return erro("rferr","Escolha uma data a partir de hoje.");if(!(q>=1&&q<=50))return erro("rferr","Informe de 1 a 50 guardas.");if(m.length<5)return erro("rferr","Explique o motivo.");if(await X.act("reforco",{data:d,turno:val("rf3"),qtd:q,motivo:m}))toast("Pedido enviado ao Escalante.")}),
 xRefoDec:e=>{const ok=e.dataset.v==="1";sheet(`<h2>${ok?"Pedido atendido":"Pedido não atendido"}</h2>${txa("rfr",ok?"Observação para o Coordenador (opcional)":"Motivo","")}<div class="grid2"><button class="btn ghost" data-a="x">Voltar</button><button class="btn ${ok?"gold":"red"}" data-a="xRefoDecOk" data-id="${e.dataset.id}" data-v="${e.dataset.v}">Confirmar</button></div>`)},
 xRefoDecOk:e=>X.busy(e,async()=>{const r=val("rfr"),ok=e.dataset.v==="1";if(!ok&&!r)return toast("Informe o motivo.");closeSheet();if(await X.act("reforcoDecidir",{id:e.dataset.id,ok,resposta:r}))toast("Coordenador avisado.")}),
 xFaltaSalvar:e=>X.busy(e,async()=>{const d=val("fl2"),t=val("fl3"),mi=+val("fl4");if(!d||d>TODAY)return erro("flerr","Informe uma data válida.");if(t==="atraso"&&!(mi>0))return erro("flerr","Informe os minutos de atraso.");if(await X.act("falta",{mat:val("fl1"),data:d,tipo:t,minutos:t==="atraso"?mi:null,obs:val("fl5")}))toast("Registrado. A Chefia foi avisada.")}),
 xRelPostoSel:()=>{},
 xRelPostoPDF:e=>X.busy(e,async()=>{const p=e.dataset.p,m=e.dataset.m,r=dadosPosto(p,m);await baixarPDF({titulo:"Relatório mensal do posto",sub:p+" · "+nomeMes(m),kv:[["Guardas escalados",r.guardas.length],["Serviços cumpridos",r.serv],["Permutas aprovadas",r.perm],["Faltas e atrasos",r.faltas.length],["Ocorrências",r.ocorr.length],["Passagens de serviço",r.pass]],
  tabela:{titulo:"Serviços por guarda",cab:["Guarda","Matrícula","Serviços"],larg:[100,50,32],rows:r.guardas.map(x=>[nm(x.m),x.m,x.n])},blocos:[{titulo:"Faltas e atrasos",texto:r.faltas.map(f=>fds(f.data)+" · "+nm(f.matricula)+" · "+f.tipo+(f.minutos?" ("+f.minutos+" min)":"")).join("\n")||"Nenhum registro."},{titulo:"Ocorrências",texto:r.ocorr.map(o=>fds(o.data)+" · "+o.natureza+" · "+(o.local||"")).join("\n")||"Nenhuma ocorrência."}],assinatura:"Coordenador de Posto"},"relatorio-"+p.replace(/\W+/g,"-").toLowerCase()+"-"+m+".pdf")}),
 xRelGuardasPDF:e=>X.busy(e,async()=>{const m=e.dataset.m,l=dadosGuardas(m);await baixarPDF({titulo:"Relatório por guarda",sub:nomeMes(m),paisagem:true,tabela:{cab:["Guarda","Matrícula","Faltas","Atrasos","Atestado (dias)","Afast. (dias)","Permutas","Cobriu","Serviços","Sinais"],larg:[52,26,16,16,24,22,18,16,18,61],rows:l.map(x=>[nm(x.m),x.m,x.falta,x.atraso,x.atest,x.afast,x.perm,x.cobriu,x.serv,x.alerta.join(", ")])}},"relatorio-guardas-"+m+".pdf")}),
 xNumPDF:e=>X.busy(e,async()=>{const m=e.dataset.m,n=numerosMes(m);await baixarPDF({titulo:"Números do mês · Comando",sub:nomeMes(m),kv:[["Efetivo empregado",n.emp+" de "+n.ef],["Plantões cumpridos",n.serv+" ("+hrs(n.horasServ)+")"],["Horas extras 50%",hrs(n.he["50"])],["Horas extras 100%",hrs(n.he["100"])],["Horas extras 100% noturno",hrs(n.he["100n"])],["Permutas",n.perm+" ("+n.permOk+" aprovadas)"],["Atestados",n.at+" ("+n.atDias+" dias)"],["Faltas / atrasos",n.faltas+" / "+n.atrasos],["Ocorrências",n.ocorr]],tabela:Object.keys(n.desc).length?{titulo:"Postos abaixo do mínimo",cab:["Posto","Dias"],larg:[150,32],rows:Object.entries(n.desc)}:null},"numeros-"+m+".pdf")}),
 xAfSalvar:e=>X.busy(e,async()=>{const m=val("af1"),i=val("af3"),f=val("af4");if(!efetivo().some(x=>x.mat===m))return erro("aferr","Escolha um servidor da lista (pela matrícula).");if(!i||!f||f<i)return erro("aferr","Confira as datas.");if(await X.act("afastSalvar",{mat:m,tipo:val("af2"),ini:i,fim:f,obs:val("af5")}))toast("Afastamento registrado.")}),
 xAfRm:e=>X.busy(e,async()=>{if(await X.act("afastRemover",{id:e.dataset.id}))toast("Removido.")}),
 xAtDec:e=>{const ok=e.dataset.v==="1";if(ok)return X.busy(e,async()=>{if(await X.act("atestadoDecidir",{id:e.dataset.id,ok:true}))toast("Atestado aceito.")});sheet(`<h2>Recusar atestado</h2>${txa("atr","Motivo","Ex.: documento sem assinatura digital ou código de validação.")}<div class="grid2"><button class="btn ghost" data-a="x">Voltar</button><button class="btn red" data-a="xAtDecOk" data-id="${e.dataset.id}">Recusar</button></div>`)},
 xAtDecOk:e=>X.busy(e,async()=>{const m=val("atr");if(!m)return toast("Informe o motivo.");closeSheet();if(await X.act("atestadoDecidir",{id:e.dataset.id,ok:false,motivo:m}))toast("Atestado recusado.")}),
 xAtEnviar:e=>X.busy(e,async()=>{const i=val("at1"),f=val("at2"),file=(document.getElementById("at4").files||[])[0];if(!i||!f||f<i)return erro("aterr","Confira as datas.");if(!file||file.type!=="application/pdf")return erro("aterr","Anexe o atestado em PDF.");if(file.size>8e6)return erro("aterr","PDF muito grande (máximo 8 MB).");if(await X.act("atestadoEnviar",{ini:i,fim:f,obs:val("at3"),file}))toast("Atestado enviado para conferência.")}),
 xAbrirArq:async e=>{const u=await X.url(e.dataset.p);if(u)window.open(u,"_blank")},
 xCfg:e=>{const p=e.dataset.p,c=D().cfg[p]||{};sheet(`<div class="row between"><h2 style="margin:0">${esc(p)}</h2><button class="iconbtn" data-a="x" aria-label="Fechar"><span class="ms">close</span></button></div>${inp("pc1","Mínimo de guardas por plantão",{type:"number",im:"numeric",v:c.min||"",ph:"Ex.: 3"})}${sel("pc2","Habilitação exigida (ao menos um por grupo)",Object.entries(HAB_TXT),c.hab||"")}<label class="row small" style="padding:8px 0;cursor:pointer"><input type="checkbox" id="pc3" ${c.chefe?"checked":""} style="width:22px;min-height:22px;box-shadow:none;accent-color:#e6c429;flex:none">Exigir um Chefe em cada grupo</label><button class="btn gold block" data-a="xCfgOk" data-p="${esc(p)}">Salvar</button>`)},
 xCfgOk:e=>X.busy(e,async()=>{const n=val("pc1"),a={posto:e.dataset.p,min:n?+n:null,hab:val("pc2")||null,chefe:val("pc3")};closeSheet();if(await X.act("postoCfg",a))toast("Posto configurado.")}),
 xAuto:()=>{const x=S.escEd,mats=x.grupos.flat(),pool=efetivo().filter(q=>q.posto===x.posto).map(q=>q.mat);
  sheet(`<h2>Montagem automática</h2><p class="sub">O app distribui os guardas equilibrando patente e habilitação: o mais antigo de cada grupo vira Chefe, os armados são espalhados entre os grupos e quem está de férias ou afastado fica de fora.</p>
  ${fld("au1","Quem distribuir",`<select id="au1"><option value="sel">Os ${mats.length} guarda(s) já escolhidos</option><option value="posto">Todo o efetivo lotado em ${esc(x.posto)} (${pool.length})</option><option value="ambos">Os dois juntos</option></select>`)}
  ${inp("au2","Número de grupos",{type:"number",v:String(x.grupos.length||2),min:"1",max:"6",im:"numeric"})}
  <div class="grid2"><button class="btn ghost" data-a="x">Cancelar</button><button class="btn gold" data-a="xAutoOk"><span class="ms">auto_fix_high</span>Distribuir</button></div>`)},
 xAutoOk:()=>{const x=S.escEd,o=val("au1"),n=Math.max(1,Math.min(6,+val("au2")||2)),pool=efetivo().filter(q=>q.posto===x.posto).map(q=>q.mat),mats=o==="sel"?x.grupos.flat():o==="posto"?pool:[...x.grupos.flat(),...pool];if(!mats.length)return toast("Nenhum guarda para distribuir.");
  const r=autoDistribuir(x,mats,n);x.grupos=r.grupos;x.meta={...(x.meta||{}),...r.meta};closeSheet();render();toast("Grupos montados"+(r.fora?" · "+r.fora+" afastado(s) ficaram de fora":"")+". Revise antes de salvar.")},
 xCopiar:e=>X.busy(e,async()=>{const x=S.escalas.find(q=>String(q.id)===String(e.dataset.id));if(!x)return;const b=parse(x.fim);b.setDate(b.getDate()+1);const ini=iso(b),m2=new Date(b);m2.setMonth(m2.getMonth()+1);m2.setDate(0);const fim=iso(m2);
  const n=x.grupos.length,gi=grupoDoDia({...x,fim:ini,excluir:[],semFer:false},ini),gr=x.grupos.map((_,i)=>x.grupos[((gi<0?0:gi)+i)%n].slice());
  const meta={};Object.entries(x.meta||{}).forEach(([k,v])=>{if(v.funcao)meta[k]={funcao:v.funcao,desde:"",ate:""}});
  if(await X.act("escCopiar",{nome:x.nome,posto:x.posto,ini,fim,hi:x.hi,hf:x.hf,horas:x.horas,uteis:x.uteis,semFer:x.semFer,grupos:gr,meta}))toast("Escala copiada para "+nomeMes(ini.slice(0,7))+" como rascunho. O rodízio continua de onde parou.")}),
 xUniPDF:e=>X.busy(e,async()=>{const mes=e.dataset.m,ds=diasMes(mes),es=S.escalas.filter(q=>q.st!=="rascunho"&&q.ini.slice(0,7)<=mes&&q.fim.slice(0,7)>=mes);if(!es.length)return toast("Nenhuma escala enviada ou em vigor neste mês.");
  const rows=[];es.forEach(q=>q.grupos.forEach((gr,i)=>gr.forEach(m=>rows.push([nm(m)+(((q.meta||{})[m]||{}).funcao?" ("+q.meta[m].funcao.slice(0,5)+")":""),q.posto.slice(0,22)+" "+q.hi.slice(0,2)+"-"+q.hf.slice(0,2),...ds.map(d=>grupoDoDia(q,d)===i&&ativoNaEsc(q,m,d)?"X":"")]))));
  const lw=[38,34,...ds.map(()=>(297-28-72)/ds.length)];await baixarPDF({titulo:"Escala de serviço unificada",sub:nomeMes(mes)+" · "+es.length+" escala(s) · X = plantão",paisagem:true,tabela:{cab:["Guarda","Posto/turno",...ds.map(d=>String(parse(d).getDate()))],larg:lw,fonte:6.2,rows}},"escala-unificada-"+mes+".pdf")}),
 xHeNova:e=>{const x=e.dataset.id?D().missoes.find(q=>String(q.id)===String(e.dataset.id)):null;S.xHeSel=new Set(x?x.mats:[]);
  sheet(`<div class="row between"><h2 style="margin:0">${x?"Editar missão":"Nova missão"}</h2><button class="iconbtn" data-a="x" aria-label="Fechar"><span class="ms">close</span></button></div>${inp("he1","Descrição",{v:x?x.desc:"",ph:"Ex.: Reforço no evento da Praça Maria Aragão"})}<div class="grid2">${inp("he2","Data",{type:"date",v:x?x.data:TODAY})}${inp("he3","Horas por guarda",{type:"number",v:x?String(x.horas):"6",im:"decimal"})}</div>${sel("he4","Tipo",[["50","50%"],["100","100%"],["100n","100% noturno"]],x?x.tipo:"50")}
  <div class="field"><label for="heb">Guardas</label><input id="heb" placeholder="Buscar nome ou matrícula" data-xhe="1"></div><div id="hel" style="max-height:260px;overflow:auto">${efetivo().map(q=>`<label class="row small" data-hk="${esc((q.nome+" "+q.mat).toLowerCase())}" style="padding:6px 0;cursor:pointer;border-bottom:1px solid var(--line)"><input type="checkbox" data-a="xHeMark" data-m="${esc(q.mat)}" ${S.xHeSel.has(q.mat)?"checked":""} style="width:22px;min-height:22px;box-shadow:none;accent-color:#e6c429;flex:none">${esc(q.nome)} <span class="muted">${esc(q.mat)}</span></label>`).join("")}</div>
  <div id="heerr"></div><div class="grid2" style="margin-top:10px">${x?`<button class="btn red" data-a="xHeRm" data-id="${x.id}">Apagar</button>`:`<button class="btn ghost" data-a="x">Cancelar</button>`}<button class="btn gold" data-a="xHeOk" data-id="${x?x.id:""}">Salvar</button></div>`)},
 xHeMark:e=>{const m=e.dataset.m;if(e.checked)S.xHeSel.add(m);else S.xHeSel.delete(m)},
 xHeOk:e=>X.busy(e,async()=>{const d=val("he1"),h=+String(val("he3")).replace(",",".");if(d.length<4)return erro("heerr","Descreva a missão.");if(!(h>0&&h<=24))return erro("heerr","Informe as horas (até 24).");if(!S.xHeSel.size)return erro("heerr","Marque ao menos um guarda.");const a={id:e.dataset.id||null,desc:d,data:val("he2")||TODAY,horas:h,tipo:val("he4")||"50",mats:[...S.xHeSel]};closeSheet();if(await X.act("missaoSalvar",a))toast("Missão salva.")}),
 xHeRm:e=>X.busy(e,async()=>{closeSheet();if(await X.act("missaoRemover",{id:e.dataset.id}))toast("Missão apagada.")}),
 xHePDF:e=>X.busy(e,async()=>{const m=e.dataset.m,o={};D().missoes.filter(x=>mesDe(x.data)===m).forEach(x=>x.mats.forEach(k=>{const r=o[k]=o[k]||{k,"50":0,"100":0,"100n":0};r[x.tipo]+=+x.horas}));await baixarPDF({titulo:"Relatório de horas extras",sub:nomeMes(m),tabela:{cab:["Guarda","Matrícula","50%","100%","100% not.","Total"],larg:[60,32,22,22,24,22],rows:Object.values(o).sort((a,b)=>nm(a.k).localeCompare(nm(b.k))).map(r=>[nm(r.k),r.k,hrs(r["50"]),hrs(r["100"]),hrs(r["100n"]),hrs(r["50"]+r["100"]+r["100n"])])},assinatura:"Gestor de Horas Extras"},"horas-extras-"+m+".pdf")}),
 xAudSel:()=>{}
});
/* selects que mudam o filtro (eventos change) */
document.addEventListener("change",ev=>{const el=ev.target;if(!el||!el.id)return;
 if(el.id==="xfp"){S.xPosto=el.value;render()}else if(el.id==="xpp"){S.xPassPosto=el.value;render()}else if(el.id==="xrp"){S.xRelPosto=el.value;render()}else if(el.id==="xau"){S.xAudT=el.value;render()}
 else if(el.dataset&&el.dataset.a==="xHeMark"){const m=el.dataset.m;if(el.checked)S.xHeSel.add(m);else S.xHeSel.delete(m)}});
document.addEventListener("input",ev=>{const el=ev.target;if(el&&el.dataset&&el.dataset.xhe){const q=el.value.toLowerCase();document.querySelectorAll("[data-hk]").forEach(r=>r.style.display=r.dataset.hk.includes(q)?"":"none")}});

/* ---------- injeções em telas existentes ---------- */
const _escnova=V.escnova;V.escnova=()=>{let h=_escnova();const e=S.escEd;if(!e)return h;const av=avisosEscala(e);
 const bloco=`<div class="card" style="box-shadow:inset 4px 0 0 var(--gold)"><div class="row between"><b style="color:#fff">Montagem automática</b><button class="btn sm gold" data-a="xAuto"><span class="ms">auto_fix_high</span>Distribuir</button></div><div class="muted small">Equilibra os grupos por patente e habilitação e deixa de fora quem está afastado.</div></div>${av.length?`<div class="card" style="box-shadow:inset 4px 0 0 #ff6b5e"><b style="color:#fff">Avisos (${av.length})</b>${av.slice(0,12).map(a=>`<div class="small" style="margin-top:6px;color:${a.t==="red"?"#ff9b92":"var(--gold)"}">• ${esc(a.m)}</div>`).join("")}</div>`:""}`;
 return h.replace(/(<div class="lbl between"><span>Grupos)/,bloco+"$1")};
const _escalante=V.escalante;V.escalante=()=>{let h=_escalante();return h.replace(/<button class="btn sm ghost" data-a="escEditar" data-id="([^"]+)">/g,(m,id)=>`<button class="btn sm ghost" data-a="xCopiar" data-id="${id}"><span class="ms">content_copy</span>Copiar p/ mês seguinte</button>`+m)};
const _escuni=V.escuni;V.escuni=()=>{let h=_escuni();const mes=S.uniMes||mesAtual();return h.replace(/(<div class="dica">)/,`<button class="btn ghost block" style="margin-bottom:10px" data-a="xUniPDF" data-m="${mes}"><span class="ms">picture_as_pdf</span>Exportar escala unificada em PDF</button>$1`)};
const _comando=V.comando;if(_comando)V.comando=()=>{let h=_comando();const pa=D().afast.filter(a=>a.status==="pendente").length,rf=D().refo.filter(r=>r.status==="pendente").length;
 const novos=`<div class="lbl">Operação</div>${grid(tile("query_stats","Números do mês","Efetivo, HE, permutas, atestados","numeros",0)+tile("history_edu","Auditoria","Quem alterou o quê","auditoria",0)+tile("map","Mapa do dia","Guardas por posto agora","mapa",0)+tile("query_stats","Relatório por guarda","Faltas, atestados, permutas","relguardas",0)+tile("campaign","Comunicados","Enviar e ver leituras","comunicados",0)+tile("beach_access","Férias e licenças","Afastamentos e atestados","afast",pa)+tile("menu_book","Livro de ocorrências","Todos os postos","ocorrencias",0)+tile("sync_alt","Passagens de serviço","Todos os postos","passagem",0)+tile("group_add","Pedidos de reforço","Dos Coordenadores","reforco",rf)+tile("tune","Configurar postos","Mínimo e habilitação","postoscfg",0)+tile("person_alert","Faltas e atrasos","Registrar e consultar","falta",0)+tile("more_time","Horas extras","Missões e relatório","he",0))}`;
 return h.replace(/(<div class="lbl">Gestão<\/div>)/,novos+"$1")};
const _inicio=V.inicio;V.inicio=()=>{let h=_inicio();const nc=D().com.filter(c=>!D().lidos.has(c.id)),pp=passPend();if(!nc.length&&!pp.length)return h;
 const b=nc.slice(0,3).map(c=>`<button class="banner" style="width:100%;border:0;text-align:left;cursor:pointer" data-a="xComVer" data-id="${c.id}"><span class="ms">campaign</span><span style="flex:1"><b>Comunicado ${numCom(c)}:</b> ${esc(c.titulo)}</span><span class="ms">chevron_right</span></button>`).join("")+(pp.length?`<button class="banner" style="width:100%;border:0;text-align:left;cursor:pointer" data-a="xIr" data-t="passagem"><span class="ms">sync_alt</span><span style="flex:1">${pp.length} passagem(ns) de serviço para confirmar</span><span class="ms">chevron_right</span></button>`:"");
 return h.replace(/(<div class="card low row" style="margin-top:10px">)/,b+"$1")};
/* ---------- Armaria (perfil Armeiro) ---------- */
const CAT_ARM={arma:"Arma de fogo",taser:"Taser (choque)",colete:"Colete balístico",algema:"Algema",radio:"Rádio HT",tonfa:"Tonfa / bastão",espargidor:"Espargidor (spray)",lanterna:"Lanterna",outro:"Outro material"};
const CAT_IC={arma:"my_location",taser:"bolt",colete:"shield",algema:"link",radio:"settings_input_antenna",tonfa:"straighten",espargidor:"sanitizer",lanterna:"flashlight_on",outro:"inventory_2"};
const CALIBRES=[".380",".38",".40","9mm","12"];
const ST_ITEM={reserva:["Na reserva","green"],cautelada:["Cautelado","gold"],manutencao:["Em manutenção","red"],baixada:["Baixado",""]};
const ST_CAUT={aguardando:["Aguardando confirmação","gold"],aberta:["Em uso","gold"],devolvida:["Devolvida","green"],divergente:["Divergência","red"]};
const ordItem=(a,b)=>Object.keys(CAT_ARM).indexOf(a.categoria)-Object.keys(CAT_ARM).indexOf(b.categoria)||(a.descricao+(a.calibre||"")+(a.serie||"")).localeCompare(b.descricao+(b.calibre||"")+(b.serie||""));
const armD=()=>D().arm||{itens:[],caut:[],movs:[]};
const armPode=()=>["arm","admin"].includes(P());
const fdt=s=>s?new Date(s).toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"}):"—";
const itemTxt=i=>(i.descricao||"")+(i.calibre?" "+i.calibre:"")+(i.serie?" · nº "+i.serie:"");
const munTxt=m=>Object.entries(m||{}).filter(([,q])=>+q>0).map(([k,q])=>q+" × "+k).join(", ");
const estoque=()=>{const o={};CALIBRES.forEach(c=>o[c]=0);armD().movs.forEach(m=>o[m.calibre]=(o[m.calibre]||0)+(+m.qtd));return o};
const cautAbertas=()=>armD().caut.filter(c=>c.status==="aguardando"||c.status==="aberta");
const cautVencida=c=>(c.status==="aguardando"||c.status==="aberta")&&c.prevista&&new Date(c.prevista)<new Date();
const efm=m=>efetivo().find(x=>x.mat===m)||pm(m)||{};
const habArm=(m,i)=>{const p=efm(m);if(i.categoria==="arma"&&i.calibre===".380")return !!p.hab380;if(i.categoria==="arma"&&i.calibre===".38")return !!p.hab38;if(i.categoria==="taser")return !!p.taser;return true};
const vencendo=i=>i.validade&&i.status!=="baixada"&&i.validade<=add(TODAY,60);
const minhasCaut=()=>{const m=ME_().mat;return armD().caut.filter(c=>c.matricula===m)};
function armAlertas(){const o=[],ab=cautAbertas();
 ab.filter(cautVencida).forEach(c=>o.push({ic:"alarm",t:"Devolução atrasada: "+nm(c.matricula),sub:"Cautela nº "+c.id+" · previsto "+fdt(c.prevista),red:1}));
 ab.filter(c=>c.status==="aguardando").forEach(c=>o.push({ic:"hourglass_top",t:nm(c.matricula)+" ainda não confirmou o recebimento",sub:"Cautela nº "+c.id+" · "+fdt(c.saida)}));
 armD().caut.filter(c=>c.status==="divergente"&&c.devolvida_em&&c.devolvida_em.slice(0,10)>=add(TODAY,-30)).forEach(c=>o.push({ic:"report",t:"Divergência na cautela nº "+c.id,sub:nm(c.matricula)+" · "+(c.obs_dev||""),red:1}));
 armD().itens.filter(vencendo).forEach(i=>o.push({ic:"event",t:(i.validade<TODAY?"Validade vencida: ":"Validade perto do fim: ")+itemTxt(i),sub:"Vence em "+fds(i.validade),red:i.validade<TODAY?1:0}));
 return o}
const cautCard=(c,acoes=true)=>{const st=ST_CAUT[c.status]||[c.status,""],venc=cautVencida(c);
 return card(`<div class="row between" style="align-items:flex-start;gap:8px"><div style="flex:1;min-width:0"><div class="muted small">Cautela nº ${c.id} · ${fdt(c.saida)}</div><b style="color:#fff">${esc(nm(c.matricula))}</b> <span class="muted">${esc(c.matricula)}</span>${c.posto?`<div class="muted small">${esc(c.posto)}</div>`:""}</div><span class="tag ${venc?"red":st[1]}">${venc?"Atrasada":st[0]}</span></div>
 <div style="margin-top:8px">${(c.itens||[]).map(i=>`<div class="row small" style="gap:6px"><span class="ms" style="font-size:18px;color:var(--gold)">${CAT_IC[i.categoria]||"inventory_2"}</span><span>${esc(itemTxt(i))}</span></div>`).join("")}${munTxt(c.municao)?`<div class="row small" style="gap:6px"><span class="ms" style="font-size:18px;color:var(--gold)">grain</span><span>Munição: ${esc(munTxt(c.municao))}</span></div>`:""}</div>
 <div class="muted small" style="margin-top:6px">${c.prevista?"Devolução prevista: "+fdt(c.prevista):""}${c.armeiro_nome?" · Armeiro: "+esc(c.armeiro_nome):""}${c.confirmada_em?" · Recebimento confirmado "+fdt(c.confirmada_em):""}${c.devolvida_em?"<br>Devolvida "+fdt(c.devolvida_em)+(c.recebido_por_nome?" a "+esc(c.recebido_por_nome):""):""}${c.obs_dev?"<br>Obs. da devolução: "+esc(c.obs_dev):""}</div>
 ${acoes?`<div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap">${armPode()&&(c.status==="aguardando"||c.status==="aberta")?`<button class="btn sm gold" data-a="xDescaut" data-id="${c.id}"><span class="ms">assignment_return</span>Receber devolução</button>`:""}<button class="btn sm ghost" data-a="xTermoPDF" data-id="${c.id}"><span class="ms">picture_as_pdf</span>Termo</button></div>`:""}`,venc||c.status==="divergente"?"box-shadow:inset 4px 0 0 var(--red,#e5484d)":"")};
const boxN=(n,t,ic)=>`<div class="card low" style="margin:0;text-align:center;padding:12px 6px"><span class="ms" style="color:var(--gold)">${ic}</span><div style="font-size:22px;font-weight:800;color:#fff">${n}</div><div class="muted small">${t}</div></div>`;

V.armaria=()=>{const it=armD().itens,ab=cautAbertas(),al=armAlertas(),est=estoque(),cnt=s=>it.filter(i=>i.status===s).length;
 return shell(`<h2>Armaria</h2><p class="sub">${armPode()?"Cautela e controle do armamento e dos equipamentos da Guarda.":"Consulta da situação da Armaria."}</p>
 <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:12px">${boxN(cnt("reserva"),"Reserva","inventory")+boxN(cnt("cautelada"),"Cautelados","badge")+boxN(cnt("manutencao"),"Manutenção","build")+boxN(ab.length,"Cautelas abertas","assignment")}</div>
 ${armPode()?`<button class="btn gold block" data-a="xIr" data-t="cautnova"><span class="ms">add_task</span>Nova cautela</button>`:""}
 ${al.length?`<div class="lbl between"><span>Alertas</span><span class="tag red">${al.length}</span></div>${al.slice(0,8).map(a=>`<div class="card" style="${a.red?"box-shadow:inset 4px 0 0 var(--red,#e5484d)":"box-shadow:inset 4px 0 0 var(--gold)"}"><div class="row" style="gap:10px;align-items:flex-start"><span class="ms" style="color:var(--gold)">${a.ic}</span><div><b style="color:#fff">${esc(a.t)}</b><div class="muted small">${esc(a.sub)}</div></div></div></div>`).join("")}`:""}
 <div class="lbl">Munição em estoque</div><div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-bottom:12px">${CALIBRES.map(c=>`<div class="card low" style="margin:0;text-align:center;padding:10px 4px"><div style="font-weight:800;color:#fff">${est[c]||0}</div><div class="muted small">${c}</div></div>`).join("")}</div>
 ${grid(tile("assignment","Cautelas","Em uso e histórico","cautelas",ab.filter(cautVencida).length)+tile("inventory_2","Acervo","Armas e equipamentos","acervo",it.filter(vencendo).length)+tile("grain","Munição","Estoque e movimentação","municao",0)+tile("verified_user","Habilitações","Quem pode receber cada arma","armhab",0))}
 ${pdfBtn("xCargaPDF","","Mapa de carga (PDF)")}`)};

V.cautnova=()=>{if(!armPode())return shell(vazio("Somente o Armeiro registra cautelas."));const c=S.xCaut=S.xCaut||{mat:"",itens:[],mun:{},prev:"",posto:"",obs:""},p=c.mat?efm(c.mat):null,est=estoque(),afs=c.mat&&afastado(c.mat,TODAY),ja=c.mat&&cautAbertas().find(q=>q.matricula===c.mat);
 const d=new Date(Date.now()+12*36e5),pad=n=>String(n).padStart(2,"0"),prevDef=d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())+"T"+pad(d.getHours())+":"+pad(d.getMinutes());
 const res=armD().itens.filter(i=>i.status==="reserva").sort(ordItem);
 const porCat={};res.forEach(i=>(porCat[i.categoria]=porCat[i.categoria]||[]).push(i));
 return shell(`<h2>Nova cautela</h2><p class="sub">Entrega de armamento e equipamento ao guarda. Ele confirma o recebimento no próprio app.</p>
 <div class="field"><label for="cn1">Guarda</label><input id="cn1" list="cnl" placeholder="Digite o nome ou a matrícula" value="${p?esc(p.nome+" · "+c.mat):""}" autocomplete="off"><datalist id="cnl">${efetivo().map(q=>`<option value="${esc(q.nome+" · "+q.mat)}"></option>`).join("")}</datalist></div>
 ${p?card(`<b style="color:#fff">${esc(p.nome)}</b> <span class="muted">${esc(c.mat)}</span><div class="muted small">${esc(patTxtX(p))}${p.posto?" · "+esc(p.posto):""}</div><div class="row" style="gap:6px;flex-wrap:wrap;margin-top:6px">${[["hab380","Pistola .380"],["hab38","Revólver .38"],["taser","Taser"]].map(([k,t])=>`<span class="tag ${p[k]?"green":""}">${p[k]?"✓":"✗"} ${t}</span>`).join("")}</div>${afs?`<div class="err" style="margin-top:8px"><span class="ms">warning</span><span>Afastado hoje (${esc(TIPO_AF[afs.tipo]||afs.tipo)}).</span></div>`:""}${ja?`<div class="err" style="margin-top:8px"><span class="ms">warning</span><span>Já tem a cautela nº ${ja.id} aberta. Receba a devolução antes de entregar outra.</span></div>`:""}`):""}
 <div class="lbl">Material da reserva</div>${res.length?Object.entries(porCat).map(([k,l])=>`<div class="muted small" style="margin:8px 0 4px;font-weight:700">${CAT_ARM[k]||k}</div>${l.map(i=>{const okH=!c.mat||habArm(c.mat,i),okV=!i.validade||i.validade>=TODAY,dis=!okH||!okV;return `<label class="card row" style="gap:10px;margin:0 0 6px;padding:10px 12px;cursor:${dis?"not-allowed":"pointer"};opacity:${dis?.55:1}"><input type="checkbox" data-a="xCautMark" data-id="${i.id}" ${c.itens.includes(String(i.id))&&!dis?"checked":""} ${dis?"disabled":""} style="width:22px;min-height:22px;box-shadow:none;accent-color:#e6c429;flex:none"><span style="flex:1"><b style="color:#fff">${esc(i.descricao)}${i.calibre?" "+esc(i.calibre):""}</b><div class="muted small">${i.serie?"Série "+esc(i.serie):""}${i.patrimonio?" · Patr. "+esc(i.patrimonio):""}${i.validade?" · validade "+fds(i.validade):""}${!okH?" · sem habilitação":""}${!okV?" · vencido":""}</div></span></label>`}).join("")}`).join(""):vazio("Nenhum item na reserva. Cadastre o acervo primeiro.")}
 <div class="lbl">Munição</div><div class="grid2">${CALIBRES.filter(k=>est[k]>0||+c.mun[k]>0).map(k=>inp("cnm"+k.replace(/\W/g,""),k+" (estoque "+est[k]+")",{type:"number",im:"numeric",v:c.mun[k]||"",ph:"0"})).join("")||`<div class="muted small" style="grid-column:1/-1">Sem munição em estoque.</div>`}</div>
 <div class="field"><label for="cn3">Posto / serviço</label><select id="cn3"><option value="">—</option>${POSTOS.map(x=>`<option ${x===(c.posto||(p&&p.posto)||"")?"selected":""}>${esc(x)}</option>`).join("")}</select></div>
 ${inp("cn4","Devolução prevista",{type:"datetime-local",v:c.prev||prevDef})}${txa("cn5","Observação (opcional)","Ex.: carregadores, coldre, estado de conservação",c.obs)}
 <div id="cnerr"></div><button class="btn gold block" data-a="xCautSalvar"><span class="ms">task_alt</span>Registrar cautela</button>`)};
const patTxtX=p=>(p.pat||"")+(p.bm?" · BM":"");
const cautCapt=()=>{const c=S.xCaut;if(!c)return;const m={};CALIBRES.forEach(k=>{const v=val("cnm"+k.replace(/\W/g,""));if(v)m[k]=v});if(document.getElementById("cn3"))Object.assign(c,{mun:{...c.mun,...m},posto:val("cn3"),prev:val("cn4"),obs:val("cn5")})};

const navArm=t=>{if(P()==="arm")X_BACK.delete(t);else X_BACK.add(t)};
V.cautelas=()=>{navArm("cautelas");const ab=cautAbertas().sort((a,b)=>a.saida<b.saida?-1:1),mes=S.xMes||mesAtual(),hist=armD().caut.filter(c=>!(c.status==="aguardando"||c.status==="aberta")&&mesDe(c.saida.slice(0,10))===mes).sort((a,b)=>a.saida<b.saida?1:-1),q=(S.xCautBusca||"").toLowerCase(),f=c=>!q||(nm(c.matricula)+" "+c.matricula+" "+c.id+" "+(c.itens||[]).map(itemTxt).join(" ")).toLowerCase().includes(q);
 return shell(`<h2>Cautelas</h2><div class="field"><input id="xcb" placeholder="Buscar guarda, matrícula, nº ou série" value="${esc(S.xCautBusca||"")}" autocomplete="off"></div>
 <div class="lbl between"><span>Em uso</span><span class="tag gold">${ab.length}</span></div>${ab.filter(f).map(c=>cautCard(c)).join("")||vazio("Nenhuma cautela aberta.")}
 <div class="lbl">Histórico</div>${navMes(mes)}${hist.filter(f).map(c=>cautCard(c)).join("")||vazio("Nenhuma cautela encerrada neste mês.")}
 ${pdfBtn("xLivroPDF",`data-m="${mes}"`,"Livro de cautelas do mês (PDF)")}`)};

V.acervo=()=>{navArm("acervo");const fc=S.xAcCat||"",fs=S.xAcSt||"",q=(S.xAcBusca||"").toLowerCase(),l=armD().itens.filter(i=>(!fc||i.categoria===fc)&&(!fs||i.status===fs)&&(!q||(itemTxt(i)+" "+(i.patrimonio||"")).toLowerCase().includes(q))).sort(ordItem);
 return shell(`<h2>Acervo</h2><p class="sub">${armD().itens.length} item(ns) cadastrados.</p>
 ${armPode()?`<button class="btn gold block" data-a="xItem"><span class="ms">add</span>Cadastrar item</button>`:""}
 <div class="grid2" style="margin-top:10px"><div class="field"><select id="xac" aria-label="Categoria"><option value="">Todas as categorias</option>${Object.entries(CAT_ARM).map(([k,t])=>`<option value="${k}" ${k===fc?"selected":""}>${t}</option>`).join("")}</select></div><div class="field"><select id="xas" aria-label="Situação"><option value="">Todas as situações</option>${Object.entries(ST_ITEM).map(([k,[t]])=>`<option value="${k}" ${k===fs?"selected":""}>${t}</option>`).join("")}</select></div></div>
 <div class="field"><input id="xab" placeholder="Buscar descrição, série ou patrimônio" value="${esc(S.xAcBusca||"")}" autocomplete="off"></div>
 ${l.map(i=>{const st=ST_ITEM[i.status]||[i.status,""];return `<button class="card" style="width:100%;border:0;text-align:left;cursor:${armPode()?"pointer":"default"};color:inherit;display:block" ${armPode()?`data-a="xItem" data-id="${i.id}"`:""}><div class="row between" style="gap:8px"><div class="row" style="gap:10px;min-width:0"><span class="ms" style="color:var(--gold)">${CAT_IC[i.categoria]||"inventory_2"}</span><div style="min-width:0"><b style="color:#fff">${esc(i.descricao)}${i.calibre?" "+esc(i.calibre):""}</b><div class="muted small">${CAT_ARM[i.categoria]||""}${i.serie?" · nº "+esc(i.serie):""}${i.patrimonio?" · Patr. "+esc(i.patrimonio):""}${i.validade?" · validade "+fds(i.validade):""}</div></div></div><span class="tag ${vencendo(i)&&i.validade<TODAY?"red":st[1]}">${st[0]}</span></div></button>`}).join("")||vazio("Nenhum item encontrado.")}
 ${pdfBtn("xCargaPDF","","Mapa de carga (PDF)")}`)};

V.municao=()=>{const est=estoque(),l=armD().movs.slice().sort((a,b)=>a.created_at<b.created_at?1:-1).slice(0,60);
 return shell(`<h2>Munição</h2><p class="sub">O estoque baixa sozinho nas cautelas e volta nas devoluções.</p>
 <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-bottom:12px">${CALIBRES.map(c=>`<div class="card low" style="margin:0;text-align:center;padding:10px 4px"><div style="font-weight:800;color:#fff">${est[c]||0}</div><div class="muted small">${c}</div></div>`).join("")}</div>
 ${armPode()?`<button class="btn gold block" data-a="xMun"><span class="ms">add</span>Entrada, consumo ou ajuste</button>`:""}
 <div class="lbl">Movimentação</div>${l.map(m=>`<div class="list-item" style="display:flex;justify-content:space-between;gap:8px;padding:9px 2px;border-bottom:1px solid var(--line)"><div><b style="color:#fff">${m.qtd>0?"+":""}${m.qtd} × ${esc(m.calibre)}</b><div class="muted small">${esc(m.motivo)}</div></div><div class="muted small" style="text-align:right">${fdt(m.created_at)}${m.autor_nome?"<br>"+esc(m.autor_nome):""}</div></div>`).join("")||vazio("Nenhuma movimentação.")}`)};

V.armhab=()=>{const q=(S.xHabBusca||"").toLowerCase(),l=efetivo().filter(p=>!q||(p.nome+" "+p.mat+" "+(p.posto||"")).toLowerCase().includes(q)).sort((a,b)=>a.nome.localeCompare(b.nome)),tot=k=>efetivo().filter(p=>p[k]).length;
 return shell(`<h2>Habilitações</h2><p class="sub">A cautela só libera arma ou Taser para quem é habilitado. A habilitação é alterada no Efetivo (Escalante ou Comando).</p>
 <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:12px">${boxN(tot("hab380"),"Pistola .380","my_location")+boxN(tot("hab38"),"Revólver .38","my_location")+boxN(tot("taser"),"Taser","bolt")}</div>
 <div class="field"><input id="xhb" placeholder="Buscar nome, matrícula ou posto" value="${esc(S.xHabBusca||"")}" autocomplete="off"></div>
 ${l.slice(0,150).map(p=>`<div class="list-item" style="display:flex;justify-content:space-between;gap:8px;padding:9px 2px;border-bottom:1px solid var(--line)"><div style="min-width:0"><b style="color:#fff">${esc(p.nome)}</b><div class="muted small">${esc(p.mat)}${p.posto?" · "+esc(p.posto):""}</div></div><div class="row" style="gap:4px;flex:none">${p.hab380?`<span class="tag green">.380</span>`:""}${p.hab38?`<span class="tag green">.38</span>`:""}${p.taser?`<span class="tag green">Taser</span>`:""}${!p.hab380&&!p.hab38&&!p.taser?`<span class="tag">—</span>`:""}</div></div>`).join("")}${l.length>150?`<p class="muted small">Mostrando 150 de ${l.length}. Use a busca.</p>`:""}`)};

V.minhacautela=()=>{const l=minhasCaut().sort((a,b)=>a.saida<b.saida?1:-1),ab=l.filter(c=>c.status==="aguardando"||c.status==="aberta");
 return shell(`<h2>Minha cautela</h2><p class="sub">Armamento e equipamento que estão sob sua responsabilidade.</p>
 ${ab.map(c=>cautCard(c,false)+(c.status==="aguardando"?`<div class="note gold" style="margin:-4px 0 8px"><span class="ms">info</span><span>Confira cada item e a munição. Ao confirmar, você declara que recebeu o material acima em condições de uso.</span></div><button class="btn gold block" data-a="xCautOk" data-id="${c.id}"><span class="ms">task_alt</span>Confirmar recebimento</button>`:"")+`<button class="btn ghost block" style="margin-top:8px" data-a="xTermoPDF" data-id="${c.id}"><span class="ms">picture_as_pdf</span>Termo de cautela</button>`).join("")||vazio("Nenhum material cautelado com você agora.")}
 ${l.length>ab.length?`<div class="lbl">Cautelas anteriores</div>${l.filter(c=>!ab.includes(c)).slice(0,20).map(c=>cautCard(c,false)).join("")}`:""}`)};

/* termo, livro e mapa de carga em PDF */
const termoPDF=async c=>{const p=pm(c.matricula)||{};await baixarPDF({titulo:"TERMO DE CAUTELA DE MATERIAL Nº "+c.id,sub:"Armaria da Guarda Municipal de São Luís",kv:[["Guarda",(p.nomeC||p.nome||c.matricula)],["Matrícula",c.matricula],["Patente",p.pat||"—"],["Posto / serviço",c.posto||"—"],["Saída",fdt(c.saida)],["Devolução prevista",fdt(c.prevista)],["Armeiro",c.armeiro_nome||"—"],["Recebimento confirmado",c.confirmada_em?fdt(c.confirmada_em)+" (no app)":"Pendente"],["Situação",(ST_CAUT[c.status]||[c.status])[0]]],
 tabela:{titulo:"Material entregue",cab:["Material","Calibre","Série","Patrimônio"],larg:[84,24,40,34],rows:(c.itens||[]).map(i=>[(CAT_ARM[i.categoria]||"")+" · "+i.descricao,i.calibre||"—",i.serie||"—",i.patrimonio||"—"])},
 blocos2:[{titulo:"Munição",texto:munTxt(c.municao)||"Nenhuma."},...(c.obs?[{titulo:"Observação",texto:c.obs}]:[]),...(c.devolvida_em?[{titulo:"Devolução",texto:"Recebida em "+fdt(c.devolvida_em)+(c.recebido_por_nome?" por "+c.recebido_por_nome:"")+". Munição devolvida: "+(munTxt(c.mun_dev)||"nenhuma")+"."+(c.obs_dev?" Observação: "+c.obs_dev:"")}]:[]),{titulo:"Declaração",texto:"Declaro que recebi o material acima relacionado em condições de uso, comprometendo-me a zelar por sua guarda e conservação e a devolvê-lo à Armaria no prazo estabelecido, comunicando de imediato qualquer extravio, dano ou disparo."}],
 assinaturas:["Guarda: "+(p.nome||c.matricula),"Armeiro: "+(c.armeiro_nome||"")],rodape:"Cautela nº "+c.id},"termo-cautela-"+c.id+".pdf")};
Object.assign(A,{
 xCautMark:e=>{const c=S.xCaut,id=String(e.dataset.id);if(!c)return;const i=c.itens.indexOf(id);if(e.checked){if(i<0)c.itens.push(id)}else if(i>=0)c.itens.splice(i,1)},
 xCautSalvar:e=>X.busy(e,async()=>{cautCapt();const c=S.xCaut;if(!c.mat||!efetivo().some(q=>q.mat===c.mat))return erro("cnerr","Escolha o guarda na lista.");
  if(cautAbertas().some(q=>q.matricula===c.mat))return erro("cnerr","Esse guarda já tem uma cautela aberta.");
  const its=armD().itens.filter(i=>c.itens.includes(String(i.id))&&i.status==="reserva"),est=estoque(),mun={};
  for(const k of CALIBRES){const v=+c.mun[k]||0;if(v<0||!Number.isInteger(v))return erro("cnerr","Quantidade de munição inválida.");if(v>est[k])return erro("cnerr","Estoque insuficiente de munição "+k+".");if(v>0)mun[k]=v}
  if(!its.length&&!Object.keys(mun).length)return erro("cnerr","Marque ao menos um item ou informe munição.");
  const sem=its.find(i=>!habArm(c.mat,i));if(sem)return erro("cnerr",nm(c.mat)+" não é habilitado para "+itemTxt(sem)+".");
  if(!c.prev)return erro("cnerr","Informe a devolução prevista.");const prev=new Date(c.prev);if(isNaN(prev)||prev<new Date())return erro("cnerr","A devolução prevista precisa ser depois de agora.");
  const id=await X.act("armCautelar",{mat:c.mat,itens:its.map(i=>i.id),municao:mun,posto:c.posto,prevista:prev.toISOString(),obs:c.obs});
  if(id){S.xCaut=null;go("cautelas");toast("Cautela registrada. O guarda foi avisado para confirmar o recebimento.")}}),
 xCautOk:e=>X.busy(e,async()=>{if(await X.act("armConfirmar",{id:e.dataset.id}))toast("Recebimento confirmado.")}),
 xDescaut:e=>{const c=armD().caut.find(q=>String(q.id)===String(e.dataset.id));if(!c)return;
  sheet(`<div class="row between"><h2 style="margin:0">Devolução · cautela nº ${c.id}</h2><button class="iconbtn" data-a="x" aria-label="Fechar"><span class="ms">close</span></button></div><p class="sub">${esc(nm(c.matricula))} · ${esc(c.matricula)}</p>
  ${(c.itens||[]).map(i=>`<div class="card low" style="margin:0 0 6px;padding:10px 12px"><b style="color:#fff">${esc(itemTxt(i))}</b><div class="row" style="gap:14px;margin-top:6px;flex-wrap:wrap"><label class="row small" style="gap:6px;cursor:pointer"><input type="checkbox" class="dvok" data-id="${i.id}" checked style="width:20px;min-height:20px;box-shadow:none;accent-color:#e6c429">Devolvido</label><label class="row small" style="gap:6px;cursor:pointer"><input type="checkbox" class="dvman" data-id="${i.id}" style="width:20px;min-height:20px;box-shadow:none;accent-color:#e6c429">Mandar para manutenção</label></div></div>`).join("")}
  ${Object.entries(c.municao||{}).filter(([,q])=>+q>0).map(([k,q])=>inp("dvm"+k.replace(/\W/g,""),"Munição "+k+" devolvida (entregues "+q+")",{type:"number",im:"numeric",v:String(q)})).join("")}
  ${txa("dvo","Observação","Obrigatória se faltar item ou munição (ex.: disparo em ocorrência nº…, extravio, dano).")}
  <div id="dverr"></div><div class="grid2"><button class="btn ghost" data-a="x">Cancelar</button><button class="btn gold" data-a="xDescautOk" data-id="${c.id}"><span class="ms">assignment_return</span>Confirmar</button></div>`)},
 xDescautOk:e=>X.busy(e,async()=>{const c=armD().caut.find(q=>String(q.id)===String(e.dataset.id));if(!c)return;
  const dev=[...document.querySelectorAll(".dvok")].filter(x=>x.checked).map(x=>+x.dataset.id),man=[...document.querySelectorAll(".dvman")].filter(x=>x.checked).map(x=>+x.dataset.id).filter(x=>dev.includes(x)),mun={};let div=dev.length<(c.itens||[]).length;
  for(const[k,q]of Object.entries(c.municao||{})){if(!(+q>0))continue;const v=+val("dvm"+k.replace(/\W/g,""));if(!Number.isInteger(v)||v<0)return erro("dverr","Quantidade de munição inválida.");if(v>+q)return erro("dverr","Devolução de "+k+" maior que a entregue.");mun[k]=v;if(v<+q)div=true}
  const obs=val("dvo");if(div&&obs.length<5)return erro("dverr","Falta item ou munição: explique na observação.");
  const r=await X.act("armDescautelar",{id:c.id,devolvidos:dev,manutencao:man,mun,obs});if(r){closeSheet();toast(div?"Devolução registrada com divergência. A Chefia foi avisada.":"Devolução registrada. Material de volta à reserva.")}}),
 xTermoPDF:e=>X.busy(e,()=>termoPDF(armD().caut.find(q=>String(q.id)===String(e.dataset.id)))),
 xLivroPDF:e=>X.busy(e,async()=>{const m=e.dataset.m,l=armD().caut.filter(c=>mesDe(c.saida.slice(0,10))===m).sort((a,b)=>a.saida<b.saida?-1:1);if(!l.length)return toast("Nenhuma cautela neste mês.");
  await baixarPDF({titulo:"Livro de cautelas",sub:"Armaria · "+nomeMes(m)+" · "+l.length+" cautela(s)",paisagem:true,tabela:{cab:["Nº","Guarda","Matrícula","Material","Munição","Saída","Devolução","Situação"],larg:[12,40,22,82,30,26,26,31],fonte:7.5,rows:l.map(c=>[c.id,nm(c.matricula),c.matricula,(c.itens||[]).map(itemTxt).join("; ")||"—",munTxt(c.municao)||"—",fdt(c.saida),c.devolvida_em?fdt(c.devolvida_em):"—",(ST_CAUT[c.status]||[c.status])[0]+(c.obs_dev?" · "+c.obs_dev:"")])}},"livro-cautelas-"+m+".pdf")}),
 xCargaPDF:e=>X.busy(e,async()=>{const it=armD().itens.slice().sort(ordItem),est=estoque(),ab=cautAbertas(),com={};ab.forEach(c=>(c.itens||[]).forEach(i=>com[i.id]=nm(c.matricula)+" ("+c.matricula+")"));
  await baixarPDF({titulo:"Mapa de carga da Armaria",sub:"Situação em "+new Date().toLocaleString("pt-BR"),kv:[["Itens cadastrados",it.length],["Na reserva",it.filter(i=>i.status==="reserva").length],["Cautelados",it.filter(i=>i.status==="cautelada").length],["Em manutenção",it.filter(i=>i.status==="manutencao").length],["Baixados",it.filter(i=>i.status==="baixada").length],["Munição em estoque",CALIBRES.map(c=>c+": "+(est[c]||0)).join(" · ")]],
  tabela:{titulo:"Itens",cab:["Material","Calibre","Série","Patrimônio","Situação"],larg:[62,18,32,26,44],rows:it.map(i=>[(CAT_ARM[i.categoria]||"")+" · "+i.descricao,i.calibre||"—",i.serie||"—",i.patrimonio||"—",(ST_ITEM[i.status]||[i.status])[0]+(com[i.id]?" com "+com[i.id]:"")+(i.validade?" · val. "+fds(i.validade):"")])}},"mapa-de-carga-"+TODAY+".pdf")}),
 xItem:e=>{const i=e.dataset&&e.dataset.id?armD().itens.find(q=>String(q.id)===String(e.dataset.id)):null,caut=i&&i.status==="cautelada";
  sheet(`<div class="row between"><h2 style="margin:0">${i?"Editar item":"Cadastrar item"}</h2><button class="iconbtn" data-a="x" aria-label="Fechar"><span class="ms">close</span></button></div>
  ${sel("it1","Categoria",Object.entries(CAT_ARM),i?i.categoria:"arma")}${inp("it2","Descrição (marca e modelo)",{v:i?i.descricao:"",ph:"Ex.: Pistola Taurus PT 58 HC Plus"})}
  <div class="grid2">${sel("it3","Calibre",[["","—"],...CALIBRES.map(c=>[c,c])],i?i.calibre||"":"")}${inp("it4","Nº de série",{v:i?i.serie||"":""})}</div>
  <div class="grid2">${inp("it5","Patrimônio",{v:i?i.patrimonio||"":""})}${inp("it6","Validade (colete, spray…)",{type:"date",v:i?i.validade||"":""})}</div>
  ${caut?`<div class="note gold"><span class="ms">info</span><span>Item cautelado: a situação muda na devolução.</span></div>`:sel("it7","Situação",[["reserva","Na reserva"],["manutencao","Em manutenção"],["baixada","Baixado (fora de uso)"]],i?i.status:"reserva")}
  ${txa("it8","Observação","",i?i.obs||"":"")}<div id="iterr"></div><div class="grid2"><button class="btn ghost" data-a="x">Cancelar</button><button class="btn gold" data-a="xItemOk" data-id="${i?i.id:""}">Salvar</button></div>`)},
 xItemOk:e=>X.busy(e,async()=>{const i=e.dataset.id?armD().itens.find(q=>String(q.id)===String(e.dataset.id)):null,a={id:i?i.id:null,categoria:val("it1"),descricao:val("it2"),calibre:val("it3")||null,serie:val("it4")||null,patrimonio:val("it5")||null,validade:val("it6")||null,obs:val("it8")||null};
  if(!i||i.status!=="cautelada")a.status=val("it7")||"reserva";
  if(a.descricao.length<3)return erro("iterr","Descreva o item.");if(a.categoria==="arma"&&!a.calibre)return erro("iterr","Informe o calibre da arma.");if(a.categoria==="arma"&&!a.serie)return erro("iterr","Informe o número de série da arma.");
  if(a.serie&&armD().itens.some(q=>q.id!==a.id&&q.categoria===a.categoria&&String(q.serie||"").toUpperCase()===a.serie.toUpperCase()))return erro("iterr","Já existe item dessa categoria com esse número de série.");
  closeSheet();if(await X.act("armItemSalvar",a))toast(i?"Item atualizado.":"Item cadastrado.")}),
 xMun:()=>{const est=estoque();sheet(`<div class="row between"><h2 style="margin:0">Movimentar munição</h2><button class="iconbtn" data-a="x" aria-label="Fechar"><span class="ms">close</span></button></div>
  <div class="grid2">${sel("mu1","Calibre",CALIBRES.map(c=>[c,c+" (estoque "+(est[c]||0)+")"]),".380")}${sel("mu2","Tipo",[["entrada","Entrada (recebimento)"],["saida","Saída (consumo, instrução)"],["ajuste","Ajuste de inventário (+/−)"]],"entrada")}</div>
  ${inp("mu3","Quantidade",{type:"number",im:"numeric",ph:"Ex.: 500 (no ajuste use − para diminuir)"})}${inp("mu4","Motivo / documento",{ph:"Ex.: Guia de remessa nº 12/2026"})}
  <div id="muerr"></div><div class="grid2"><button class="btn ghost" data-a="x">Cancelar</button><button class="btn gold" data-a="xMunOk">Registrar</button></div>`)},
 xMunOk:e=>X.busy(e,async()=>{const c=val("mu1"),t=val("mu2"),n=+val("mu3"),m=val("mu4");if(!Number.isInteger(n)||n===0)return erro("muerr","Informe a quantidade.");if(m.length<4)return erro("muerr","Informe o motivo ou documento.");
  const q=t==="entrada"?Math.abs(n):t==="saida"?-Math.abs(n):n;if((estoque()[c]||0)+q<0)return erro("muerr","O estoque não pode ficar negativo.");
  closeSheet();if(await X.act("armMunMov",{calibre:c,qtd:q,motivo:(t==="entrada"?"Entrada: ":t==="saida"?"Saída: ":"Ajuste: ")+m}))toast("Munição registrada.")})
});
document.addEventListener("change",ev=>{const el=ev.target;if(el&&el.dataset&&el.dataset.a==="xCautMark")return A.xCautMark(el);if(!el||!el.id)return;
 if(el.id==="cn1"){cautCapt();const v=el.value.trim(),mm=/·\s*([^·]+)$/.exec(v),k=(mm?mm[1]:v).trim(),ok=efetivo().find(q=>q.mat===k)||efetivo().find(q=>q.nome.toLowerCase()===v.toLowerCase());S.xCaut.mat=ok?ok.mat:"";S.xCaut.posto="";S.xCaut.itens=[];render()}
 else if(el.id==="xac"){S.xAcCat=el.value;render()}else if(el.id==="xas"){S.xAcSt=el.value;render()}});
document.addEventListener("input",ev=>{const el=ev.target;if(!el||!el.id)return;const map={xcb:"xCautBusca",xab:"xAcBusca",xhb:"xHabBusca"};if(map[el.id]){S[map[el.id]]=el.value;clearTimeout(window.__xbt);window.__xbt=setTimeout(()=>{const pos=el.selectionStart;render();const n=document.getElementById(el.id);if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(x){}}},250)}});
["cautnova","cautelas","acervo","municao","armhab","minhacautela"].forEach(t=>X_BACK.add(t));
X_BACK.add("armariav");V.armariav=()=>V.armaria();
Object.assign(TITULO,{armaria:"Armaria",armariav:"Armaria",cautnova:"Nova Cautela",cautelas:"Cautelas",acervo:"Acervo",municao:"Munição",armhab:"Habilitações",minhacautela:"Minha Cautela"});
NAV.arm=[["armaria","shield","Armaria"],["cautelas","assignment","Cautelas"],["acervo","inventory_2","Acervo"],["perfil","person","Perfil"]];HOME.arm="armaria";
/* tiles nas telas existentes */
const _servico=V.servico;V.servico=()=>{const n=minhasCaut().filter(c=>c.status==="aguardando").length,ab=minhasCaut().some(c=>c.status==="aberta"||c.status==="aguardando");return _servico().replace(/(<div class="grid2">)/,"$1"+tile("shield","Minha cautela",ab?"Material com você":"Armamento e equipamento","minhacautela",n))};
const _gestao=V.gestao;V.gestao=()=>_gestao().replace(/(<div class="grid2">)/,"$1"+tile("shield","Armaria","Cautelas e acervo","armariav",armAlertas().filter(a=>a.red).length));
const _comando2=V.comando;if(_comando2)V.comando=()=>{const h=_comando2();return h.replace(/(<div class="lbl">Operação<\/div><div class="grid2">)/,"$1"+tile("shield","Armaria","Cautelas, acervo e munição","armariav",armAlertas().filter(a=>a.red).length))};
const _notifs2=notifs;notifs=function(){const o=_notifs2(),p=P();
 if(p==="gm")minhasCaut().filter(c=>c.status==="aguardando").forEach(c=>o.unshift({ic:"shield",t:"Confirme o recebimento da cautela nº "+c.id,sub:munTxt(c.municao)||(c.itens||[]).map(itemTxt).join(", "),go:"minhacautela"}));
 if(["arm","admin"].includes(p))armAlertas().filter(a=>a.red).forEach(a=>o.push({ic:a.ic,t:a.t,sub:a.sub,go:p==="arm"?"armaria":"armariav"}));
 if(p==="ccg")armD().caut.filter(c=>c.status==="divergente"&&c.devolvida_em&&c.devolvida_em.slice(0,10)>=add(TODAY,-7)).forEach(c=>o.push({ic:"report",t:"Armaria: divergência na cautela nº "+c.id,sub:nm(c.matricula)+(c.obs_dev?" · "+c.obs_dev:""),go:"armariav"}));
 return o};
render();
})();


}
