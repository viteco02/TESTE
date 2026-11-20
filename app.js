/* GMSL Permutas e Escalas · piloto (primeira versão) */
{
const CFG=window.GMSL_CFG;
const sb=window.supabase.createClient(CFG.url,CFG.key,{auth:{persistSession:true,autoRefreshToken:true}});
const LOGO="icons/brasao.webp";
const LIMITE_MES=4; // regra provisória
let POSTOS=[],POSTOS_ADM=new Set(),PATENTES=[],PAT_NOME={};
const PERFIL_NOME={gm:"Guarda",cp:"Coordenador de Posto",ccg:"Chefia do Corpo de Guarda",esc:"Escalante",he:"Gestor de HE",ron:"Rondante",admin:"Administrador"};
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
const S={tela:"carregando",param:null,feriados:new Set(),uid:null,me:null,perfis:[],escalas:[],reqs:[],avisos:[],urls:{},filtro:"todas",mesOff:0,draft:null,cad:null,escEd:null,carregando:false};
const g=id=>S.perfis.find(p=>p.id===id)||{id,nome:"(servidor)",nomeC:"",mat:"—",pat:"",posto:"",perfil:"gm"};
const ativos=()=>S.perfis.filter(p=>p.status==="ativo");
const ME=()=>S.uid;
const ini=x=>{const w=(x.nome||"").replace(/^GCM\s*/i,"").trim();return (w.slice(0,2)||"GM").toUpperCase()};
const foto34=(src,txt,cls="")=>src?`<img class="f34 ${cls}" src="${esc(src)}" alt="Foto 3x4">`:`<div class="f34 ${cls} vazio">${txt||'<span class="ms">person</span>'}</div>`;
const av=gid=>{const x=g(gid);return x.foto?`<img class="avatar sm" style="object-fit:cover;object-position:top" src="${esc(x.foto)}" alt="">`:`<div class="avatar sm">${ini(x)}</div>`};

function mapPerfil(p){return{id:p.id,nome:p.guerra,nomeC:p.nome,mat:p.matricula,pat:p.patente,posto:p.posto,turno:p.turno,adm:p.adm,tel:p.tel,email:p.email,perfil:p.perfil,perfilSol:p.perfil_solicitado,bm:p.bm,hab380:p.hab_380,hab38:p.hab_38,taser:p.hab_taser,status:p.status,motivo:p.motivo,fotoPath:p.foto_path,fotoPendPath:p.foto_pend_path,fotoPendData:p.foto_pend_data,fotoMotivo:p.foto_motivo,selfiePath:p.selfie_path,criado:p.created_at?iso(new Date(p.created_at)):TODAY}}
function mapReq(r){return{id:r.id,cod:"P-"+r.id,tipo:r.tipo,sol:r.sol,col:r.col,posto:r.posto,saida:{data:r.saida_data,ini:hm(r.saida_ini),fim:hm(r.saida_fim)},repos:{data:r.repos_data,ini:hm(r.repos_ini)||hm(r.saida_ini),fim:hm(r.repos_fim)||hm(r.saida_fim)},obs:r.obs||"",criado:iso(new Date(r.created_at)),et:{col:r.et_col,cp:r.et_cp,ccg:r.et_ccg},motivo:r.motivo,msgCol:r.msg_col,cancel:r.cancelada}}
function mapEsc(e){const meta={},gr=(Array.isArray(e.grupos)?e.grupos:[]).map(g0=>(g0||[]).map(m=>{if(typeof m==="string")return m;meta[m.id]={funcao:m.funcao||"",desde:m.desde||"",ate:m.ate||""};return m.id}));return{id:e.id,nome:e.nome,posto:e.posto,ini:e.ini,fim:e.fim,hi:hm(e.hi),hf:hm(e.hf),horas:+e.horas,uteis:e.uteis,grupos:gr,meta,excluir:e.excluir||[],semFer:!!e.sem_feriados,st:e.status}}
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
 }finally{S.carregando=false}
}
const perfilAtual=()=>S.me&&S.me.status==="ativo"?S.me.perfil:null;
const eGestor=()=>["cp","ccg","admin"].includes(perfilAtual());

/* ---------- escala ---------- */
const DIAS_UTEIS=s=>{const d=parse(s).getDay();return d!==0&&d!==6};
function grupoDoDia(e,s){if(s<e.ini||s>e.fim)return -1;if((e.excluir||[]).includes(s)||(e.semFer&&S.feriados.has(s)))return -1;const n=e.grupos.length;if(!n)return -1;if(e.uteis&&!DIAS_UTEIS(s))return -1;let k=0;if(e.uteis){for(let d=e.ini;d<s;d=add(d,1))if(DIAS_UTEIS(d))k++}else k=dnum(s)-dnum(e.ini);return k%n}
function escalaDia(gid,s){let em=false;for(const e of S.escalas){if(e.st!=="publicada"||s<e.ini||s>e.fim)continue;const gi=e.grupos.findIndex(gr=>gr.includes(gid));if(gi<0)continue;const mt=(e.meta||{})[gid]||{};if((mt.desde&&s<mt.desde)||(mt.ate&&s>mt.ate))continue;em=true;if(grupoDoDia(e,s)===gi)return{t:"regular",e,f:mt.funcao}}return em?{t:"folga"}:null}
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
const HOME={gm:"inicio",cp:"cp",ccg:"ccg",esc:"escalante",he:"breve",ron:"breve",admin:"cp"};
const NAV={
 gm:[["inicio","home","Início"],["escala","calendar_month","Escala"],["mural","campaign","Mural"],["solic","swap_horiz","Trocas"],["perfil","person","Perfil"]],
 cp:[["cp","shield_person","Gestão"],["equipe","groups","Equipe"],["efetivo","badge","Efetivo"],["perfil","person","Perfil"]],
 ccg:[["ccg","verified","Aprovações"],["panorama","monitoring","Panorama"],["efetivo","badge","Efetivo"],["perfil","person","Perfil"]],
 esc:[["escalante","calendar_month","Escalas"],["escuni","merge","Unificada"],["feriados","event_busy","Feriados"],["perfil","person","Perfil"]],
 admin:[["cp","shield_person","Gestão"],["ccg","verified","Chefia"],["escalante","calendar_month","Escalas"],["efetivo","badge","Efetivo"],["perfil","person","Perfil"]],
 he:[["breve","more_time","Início"],["perfil","person","Perfil"]],ron:[["breve","directions_car","Início"],["perfil","person","Perfil"]]
};
const TITULO={inicio:"Permutas e Escalas",escala:"Minha Escala",mural:"Mural de Permutas",solic:"Minhas Trocas",perfil:"Perfil",nova:"Solicitar Permuta",enviado:"Solicitação Enviada",det:"Detalhes",cp:"Coordenação de Posto",equipe:"Equipe do Posto",ccg:"Chefia do Corpo de Guarda",panorama:"Panorama",efetivo:"Efetivo",escalante:"Escalante",escnova:"Escala",escuni:"Escala Unificada",feriados:"Feriados",comp:"Comprovante",breve:"Em desenvolvimento"};
const VOLTA={nova:null,det:null,enviado:null,comp:null,escnova:"escalante"};
const go=(tela,param=null)=>{if(tela!==S.tela&&!["comp"].includes(tela))S.voltar={t:S.tela,p:S.param};S.tela=tela;S.param=param;render();window.scrollTo(0,0)};
let toastT;
const toast=m=>{const l=document.getElementById("layer");clearTimeout(toastT);l.querySelector(".toast")?.remove();l.insertAdjacentHTML("beforeend",`<div class="toast" role="status">${m}</div>`);toastT=setTimeout(()=>l.querySelector(".toast")?.remove(),3600)};
const sheet=html=>{document.getElementById("layer").innerHTML=`<div class="sheet-bg" data-a="closeSheet"><div class="sheet" role="dialog" aria-modal="true">${html}</div></div>`};
const closeSheet=()=>{document.getElementById("layer").querySelector(".sheet-bg")?.remove()};
const errBox=(id,er)=>{const b=document.getElementById(id);if(!b)return;b.innerHTML=er.map(t=>`<div class="err"><span class="ms">error</span>${esc(t)}</div>`).join("");if(er.length)b.scrollIntoView({block:"center"})};
const msgErro=e=>{const m=(e&&(e.message||e.erro))||"";return /permitid|não encontrad|indisponível|pendente|Chefia/i.test(m)?m:"Não foi possível concluir. Verifique a conexão e tente de novo."};

function shell(body){
 const p=perfilAtual(),nav=NAV[p]||[],back=["nova","det","enviado","comp","escnova"].includes(S.tela);
 const bell=p==="gm"?paraMim().length+S.avisos.length:p==="cp"?filaCP().length+cadsPend().length+fotosPend().length:p==="ccg"?filaCCG().length+cadsPend().length:p==="admin"?filaCP().length+filaCCG().length+cadsPend().length+fotosPend().length:S.avisos.length;
 return `<header class="top">${back?`<button class="iconbtn" data-a="back" aria-label="Voltar"><span class="ms">arrow_back</span></button>`:""}<img src="${LOGO}" alt="Brasão da Guarda Municipal de São Luís"><h1>${TITULO[S.tela]||""}</h1><button class="iconbtn" data-a="atualizar" aria-label="Atualizar"><span class="ms ${S.carregando?"sync":""}">refresh</span></button><button class="iconbtn" data-a="go" data-t="${HOME[p]||"inicio"}" aria-label="Pendências"><span class="ms">notifications</span>${bell?`<span class="badge">${bell}</span>`:""}</button></header>
 <main>${body}</main>
 ${nav.length>1?`<nav class="bottom">${nav.map(([t,ic,l])=>`<button class="${S.tela===t||(t==="solic"&&S.tela==="det")?"on":""}" data-a="go" data-t="${t}"><span class="ms">${ic}</span>${l}</button>`).join("")}</nav>`:""}`;
}
const V={};

/* ---------- acesso ---------- */
V.carregando=()=>`<div class="loading"><img src="${LOGO}" alt="" style="height:96px"><div>Carregando…</div></div>`;
V.login=()=>`<main style="padding-bottom:30px">
 <div class="login-hero"><img src="${LOGO}" alt="Brasão da Guarda Municipal de São Luís"><h2 style="margin-top:14px">Portal de Acesso</h2><p class="sub">Sistema de Permutas e Escalas · piloto</p></div>
 <form id="flogin"><div class="field"><label for="mat">Matrícula</label><input id="mat" inputmode="numeric" autocomplete="username" required placeholder="00000-0"></div>
 <div class="field"><label for="pw">Senha</label><input id="pw" type="password" autocomplete="current-password" required></div>
 <div id="lerr"></div><button class="btn gold block">Entrar <span class="ms">login</span></button></form>
 <p class="muted" style="text-align:center;margin-top:12px">Esqueceu a senha? Peça ao Coordenador de Posto para redefinir.</p>
 <button class="cadcta" data-a="novoCad"><span class="ic"><span class="ms">person_add</span></span><span style="flex:1"><b style="color:#fff">Primeiro acesso? Solicite seu cadastro</b><div class="muted">Dados, foto 3x4 e selfie. A Coordenação valida e libera o acesso.</div></span><span class="ms">chevron_right</span></button>
 <div class="foot">SECRETARIA MUNICIPAL DE SEGURANÇA COM CIDADANIA<br>Prefeitura Municipal de São Luís · versão piloto</div></main>`;
V.pendente=()=>{const m=S.me;return `<main style="text-align:center;padding-top:50px">${foto34(m.fotoPend||m.foto,ini(m),"xl")}
 <h2 style="margin-top:16px">${m.status==="recusado"?"Cadastro recusado":m.status==="inativo"?"Acesso desativado":"Cadastro em análise"}</h2>
 <p class="sub">${m.status==="recusado"?esc(m.motivo||"Procure a Coordenação."):m.status==="inativo"?"Procure a Coordenação.":"A Coordenação vai conferir seus dados e sua selfie. Quando o acesso for liberado, você entra direto por aqui."}</p>
 <div class="card low" style="text-align:left"><div class="kv"><div><span>Nome de guerra</span><b>${esc(m.nome)}</b></div><div><span>Matrícula</span><b>${esc(m.mat)}</b></div><div style="grid-column:1/-1"><span>Lotação</span><b>${esc(m.posto)}</b></div></div></div>
 <button class="btn ghost block" data-a="atualizar"><span class="ms">refresh</span>Verificar de novo</button><button class="btn ghost block" style="margin-top:8px" data-a="sair">Sair</button></main>`};

/* ---------- cadastro ---------- */
const CAD_ETAPAS=["Dados pessoais","Dados funcionais","Fotos","Acesso e envio"];
const cadNovo=()=>({etapa:0,nome:"",guerra:"",tel:"",email:"",mat:"",pat:PATENTES[PATENTES.length-1]||"2ª CL",bm:false,adm:"",posto:POSTOS[0],turno:"07:00 - 19:00 (12x36)",perfil:"gm",foto:null,selfie:null,senha:"",senha2:"",termo:false});
const cin=(k,label,o={})=>`<div class="field"><label for="cf-${k}">${label}${o.req===false?" <span class='muted'>(opcional)</span>":""}</label>${o.sel?`<select id="cf-${k}" data-c="${k}">${o.sel.map(x=>{const[v,l]=Array.isArray(x)?x:[x,x];return `<option value="${esc(v)}" ${S.cad[k]===v?"selected":""}>${esc(l)}</option>`}).join("")}</select>`:`<input id="cf-${k}" data-c="${k}" type="${o.type||"text"}" value="${esc(S.cad[k])}" ${o.ph?`placeholder="${o.ph}"`:""} ${o.im?`inputmode="${o.im}"`:""} ${o.ac?`autocomplete="${o.ac}"`:""} ${o.max?`max="${o.max}"`:""}>`}</div>`;
V.cadastro=()=>{const c=S.cad,e=c.etapa;let body="";
 if(e===0)body=`${cin("nome","Nome completo",{ph:"Como está no documento",ac:"name"})}${cin("guerra","Nome de guerra",{ph:"Como aparece na escala. Ex.: MARY"})}${cin("tel","Celular (WhatsApp)",{ph:"(98) 90000-0000",im:"tel",ac:"tel"})}${cin("email","E-mail",{type:"email",ph:"nome@exemplo.com",ac:"email",req:false})}`;
 if(e===1)body=`${cin("mat","Matrícula funcional",{ph:"00000-0",im:"numeric"})}${cin("pat","Patente",{sel:PATENTES.map(x=>[x,x+" · "+(PAT_NOME[x]||"")])})}${cin("adm","Data de admissão",{type:"date",max:TODAY})}<div class="field"><label for="cf-posto">Lotação (posto ou setor)</label><select id="cf-posto" data-c="posto">${postoOpts(S.cad.posto)}</select></div><label class="card low row" style="cursor:pointer"><input type="checkbox" data-c="bm" ${S.cad.bm?"checked":""} style="width:22px;min-height:22px;box-shadow:none;accent-color:#e6c429;flex:none"><span class="small">Sou integrante da Banda de Música (BM)</span></label>${cin("turno","Horário atual",{sel:["07:00 - 19:00","19:00 - 07:00","10:00 - 22:00","07:00 - 07:00 (24h)","09:00 - 15:00 (expediente)","Outro"]})}${cin("perfil","Perfil de acesso solicitado",{sel:Object.entries(PERFIL_NOME).filter(([k])=>k!=="admin")})}<div class="note"><span class="ms">info</span><span>Perfis de gestão são liberados pela Chefia depois da aprovação.</span></div>`;
 if(e===2)body=`<div class="row" style="align-items:flex-start;gap:16px"><button class="fotobtn" data-a="fotoInstr" data-k="cad" aria-label="Foto 3x4">${foto34(c.foto,"","lg")}</button><div style="flex:1"><b style="color:#fff">Foto 3x4 do perfil</b><p class="small muted" style="margin:6px 0 10px">Vai aparecer no seu perfil depois que o cadastro for aprovado.</p><button class="btn sm gold" data-a="fotoInstr" data-k="cad"><span class="ms">add_a_photo</span>${c.foto?"Trocar foto":"Adicionar foto"}</button></div></div>
 <div class="hr" style="margin:18px 0"></div>
 <div class="row" style="align-items:flex-start;gap:16px"><label for="upself" style="cursor:pointer">${c.selfie?`<img class="f34" src="${c.selfie}" alt="Selfie">`:`<div class="f34 vazio"><span class="ms">face</span></div>`}</label><div style="flex:1"><b style="color:#fff">Selfie de validação</b><p class="small muted" style="margin:6px 0 10px">Tire agora, segurando a carteira funcional ao lado do rosto. Serve só para a Coordenação confirmar sua identidade.</p><label class="btn sm ghost" for="upself"><span class="ms">photo_camera</span>${c.selfie?"Refazer selfie":"Enviar selfie"}</label><input id="upself" type="file" accept="image/*" capture="user" data-foto="selfie" hidden></div></div>`;
 if(e===3)body=`<div class="grid2">${cin("senha","Senha",{type:"password",ac:"new-password"})}${cin("senha2","Confirmar senha",{type:"password",ac:"new-password"})}</div><p class="muted" style="margin-top:-6px">Mínimo de 6 caracteres. Você vai entrar com a matrícula e essa senha.</p>
 <div class="lbl">Confira seus dados</div><div class="card"><div class="row" style="align-items:flex-start;gap:14px">${foto34(c.foto)}<div class="kv" style="flex:1"><div style="grid-column:1/-1"><span>Nome</span><b>${esc(c.nome)}</b></div><div><span>Nome de guerra</span><b>${esc(c.guerra.replace(/^gcm\s*/i,"").toUpperCase())}</b></div><div><span>Matrícula</span><b>${esc(c.mat)}</b></div></div></div><div class="hr"></div><div class="kv"><div><span>Celular</span><b>${esc(c.tel)}</b></div><div><span>Patente</span><b>${esc(c.pat)}${c.bm?" · BM":""}</b></div><div><span>Lotação</span><b>${esc(c.posto)}</b></div><div><span>Perfil</span><b>${PERFIL_NOME[c.perfil]}</b></div></div><button class="btn sm ghost" style="margin-top:12px" data-a="cadIr" data-e="0"><span class="ms">edit</span>Corrigir dados</button></div>
 <label class="card low row" style="cursor:pointer;align-items:flex-start"><input type="checkbox" data-c="termo" ${c.termo?"checked":""} style="width:22px;min-height:22px;box-shadow:none;accent-color:#e6c429;flex:none;margin-top:2px"><span class="small">Declaro que as informações são verdadeiras e autorizo a Coordenação a conferi-las com os registros funcionais da Guarda Municipal.</span></label>`;
 return `<header class="top"><button class="iconbtn" data-a="${e?"cadVoltar":"cadSair"}" aria-label="Voltar"><span class="ms">arrow_back</span></button><img src="${LOGO}" alt=""><h1>Solicitar cadastro</h1></header><main style="padding-bottom:30px">
 <div class="steps" style="grid-template-columns:repeat(4,minmax(0,1fr))">${CAD_ETAPAS.map((t,i)=>`<i class="${i<=e?"on":""}"></i>`).join("")}</div>
 <div class="muted" style="margin-top:10px">Etapa ${e+1} de ${CAD_ETAPAS.length}</div><h2 style="margin-bottom:16px">${CAD_ETAPAS[e]}</h2>
 ${body}<div id="cerr"></div>
 <div class="grid2" style="margin-top:8px">${e?`<button class="btn ghost" data-a="cadVoltar">Voltar</button>`:`<button class="btn ghost" data-a="cadSair">Cancelar</button>`}${e<3?`<button class="btn gold" data-a="cadAvancar">Continuar <span class="ms">arrow_forward</span></button>`:`<button class="btn gold" data-a="cadEnviar" id="btnCad">Solicitar <span class="ms">send</span></button>`}</div></main>`};
const cadValida=e=>{const c=S.cad,er=[];
 if(e===0){if(c.nome.trim().split(/\s+/).length<2)er.push("Informe o nome completo.");if(!c.guerra.trim())er.push("Informe o nome de guerra.");if(c.tel.replace(/\D/g,"").length<10)er.push("Informe um celular com DDD.");if(c.email&&!/^\S+@\S+\.\S+$/.test(c.email))er.push("E-mail inválido.")}
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
 ${me.fotoPendPath?`<div class="card low row" style="text-align:left;margin:14px 0 0">${me.fotoPend?`<img class="f34" src="${esc(me.fotoPend)}" alt="Nova foto">`:""}<div style="flex:1"><b style="color:#fff">Nova foto enviada para análise</b><div class="muted">Ela só aparece no perfil depois que a Coordenação aprovar.</div><button class="link" style="margin-top:8px;font-size:13px" data-a="fotoInstr" data-k="troca">Substituir</button></div></div>`
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
V.cp=()=>{const f=filaCP(),c=cadsPend(),fo=fotosPend(),me=S.me,hj=ativos().filter(x=>x.posto===me.posto&&trabalha(x.id,TODAY));
 return shell(`<div class="idcard">${foto34(me.foto,ini(me),"lg")}<div style="position:relative"><span class="tag gold">${PERFIL_NOME[perfilAtual()]}</span><div style="font-size:20px;font-weight:800;color:#fff;margin-top:6px">${esc(me.nome)}</div><div class="muted">${esc(me.posto)}</div></div></div>
 <div class="grid2" style="margin-top:10px"><div class="card low"><div class="muted">Efetivo do posto</div><div class="big">${ativos().filter(x=>x.posto===me.posto).length}</div></div><div class="card low"><div class="muted">De serviço hoje</div><div class="big">${hj.length}</div></div></div>
 <div class="lbl between"><span>Permutas para validar</span>${f.length?`<span class="tag gold">${f.length}</span>`:""}</div>
 ${f.map(r=>filaCard(r,"cp")).join("")||`<div class="empty">Nenhuma permuta aguardando.</div>`}
 ${c.length?`<div class="lbl between"><span>Cadastros aguardando</span><span class="tag gold">${c.length}</span></div>${c.map(cadCard).join("")}`:""}
 ${fo.length?`<div class="lbl between"><span>Trocas de foto</span><span class="tag gold">${fo.length}</span></div>${fo.map(fotoCard).join("")}`:""}
 <div class="lbl">De serviço hoje · ${fds(TODAY)}</div><div class="card">${hj.map(x=>`<div class="list-item">${av(x.id)}<div style="flex:1"><b>${esc(x.nome)}</b><div class="muted">${esc(dia(x.id,TODAY).hor||"")} · ${esc(dia(x.id,TODAY).nota||"")}</div></div></div>`).join("")||`<div class="muted">Ninguém escalado hoje neste posto.</div>`}</div>`)};
V.equipe=()=>{const me=S.me,posto=S.eqPosto||me.posto,ps=ativos().filter(x=>x.posto===posto),dias=[0,1,2,3,4,5,6].map(i=>add(TODAY,i));
 return shell(`<h2>Equipe do posto</h2><div class="field"><select data-sel="eqPosto">${postoOpts(posto)}</select></div>
 <div class="card scroll"><table class="egrid"><thead><tr><th></th>${dias.map(s=>`<th>${SEM[parse(s).getDay()].slice(0,1).toUpperCase()}<br>${parse(s).getDate()}</th>`).join("")}</tr></thead><tbody>${ps.map(x=>`<tr><td class="nm">${esc(x.nome.replace("GCM ",""))}</td>${dias.map(s=>{const t=dia(x.id,s).t;return `<td><span class="cell k-${["regular","coberto","cobrindo"].includes(t)?t:"folga"}" style="cursor:default"></span></td>`}).join("")}</tr>`).join("")||`<tr><td class="muted">Ninguém neste posto.</td></tr>`}</tbody></table>
 <div class="legend"><span><i class="k-regular"></i>Serviço</span><span><i class="k-cobrindo"></i>Cobrindo</span><span><i class="k-coberto"></i>Permutado</span></div></div>`)};
V.ccg=()=>{const f=filaCCG(),c=perfilAtual()==="ccg"?cadsPend():[];return shell(`<h2>Aprovação final</h2><p class="sub">Permutas já validadas pelos Coordenadores de Posto.</p>
 ${f.map(r=>filaCard(r,"ccg")).join("")||`<div class="empty">Nada aguardando a Chefia.</div>`}
 ${c.length?`<div class="lbl between"><span>Cadastros aguardando</span><span class="tag gold">${c.length}</span></div>${c.map(cadCard).join("")}`:""}`)};
V.panorama=()=>{const c={pend:0,ok:0,fim:0};S.reqs.forEach(r=>c[status(r).k]++);const tot=c.pend+c.ok+c.fim||1;
 const por=POSTOS.map(p=>[p,S.reqs.filter(r=>r.posto===p).length]).filter(x=>x[1]).sort((a,b)=>b[1]-a[1]),mx=Math.max(...por.map(x=>x[1]),1);
 return shell(`<h2>Panorama de permutas</h2><p class="sub">${ativos().length} servidores ativos no app.</p>
 <div class="grid2" style="grid-template-columns:repeat(3,minmax(0,1fr))"><div class="card low"><div class="muted">Em andamento</div><div class="big">${c.pend}</div></div><div class="card low"><div class="muted">Aprovadas</div><div class="big" style="color:var(--green)">${c.ok}</div></div><div class="card low"><div class="muted">Encerradas</div><div class="big" style="color:var(--red)">${c.fim}</div></div></div>
 <div class="bar" style="height:10px;display:flex;margin:6px 0 18px"><i style="width:${c.ok/tot*100}%;background:var(--green)"></i><i style="width:${c.pend/tot*100}%;background:var(--blue)"></i><i style="width:${c.fim/tot*100}%;background:var(--red)"></i></div>
 <div class="lbl">Por posto</div><div class="card">${por.map(([p,n])=>`<div style="margin-bottom:10px"><div class="row between small"><span>${esc(p)}</span><b>${n}</b></div><div class="bar"><i style="width:${n/mx*100}%"></i></div></div>`).join("")||`<div class="muted">Nenhuma permuta ainda.</div>`}</div>`)};
V.efetivo=()=>{const q=(S.efBusca||"").toLowerCase(),pode=["ccg","admin"].includes(perfilAtual()),l=S.perfis.filter(x=>x.status!=="pendente").filter(x=>!q||(x.nome+" "+x.mat+" "+x.posto).toLowerCase().includes(q)).sort((a,b)=>a.posto.localeCompare(b.posto)||a.nome.localeCompare(b.nome));
 return shell(`<h2>Efetivo</h2><p class="sub">${ativos().length} ativos. Redefina senhas${pode?" e ajuste perfis":""} por aqui.</p>
 <div class="field"><input id="efb" data-busca="efBusca" value="${esc(S.efBusca||"")}" placeholder="Buscar por nome, matrícula ou posto"></div>
 ${l.map(x=>`<div class="card row">${av(x.id)}<div style="flex:1"><b style="color:#fff">${esc(x.nome)}</b><div class="muted">${esc(x.mat)} · ${esc(x.posto)}</div><div class="small">${esc(patTxt(x))}${habTxt(x)?" · "+habTxt(x):""} · ${PERFIL_NOME[x.perfil]}${x.status!=="ativo"?` · <span style="color:var(--red)">${x.status}</span>`:""}</div></div><button class="btn sm ghost" data-a="efAcoes" data-id="${x.id}" aria-label="Ações"><span class="ms">more_vert</span></button></div>`).join("")||`<div class="empty">Ninguém encontrado.</div>`}`)};

/* ---------- escalante ---------- */
const TURNOS=[["07:00","19:00","12h diurno"],["19:00","07:00","12h noturno"],["10:00","22:00","12h (GSE)"],["07:00","07:00","24h"],["09:00","15:00","6h expediente"],["07:00","13:00","6h manhã"],["13:00","19:00","6h tarde"]];
const GRUPO=i=>"Grupo "+String.fromCharCode(65+i);
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
 return shell(`<h2>Escalas</h2><p class="sub">Crie uma escala para cada posto e turno. Depois junte todas na escala unificada e publique.</p>
 <button class="btn gold block" data-a="escCriar"><span class="ms">add</span>Criar escala</button>
 <div class="lbl">Escalas criadas (${es.length})</div>
 ${es.map(e=>{const nG=e.grupos.reduce((t,gr)=>t+gr.length,0);return `<div class="card" style="box-shadow:inset 4px 0 0 ${corEsc(e)}"><div class="row between"><div><div class="muted">${esc(e.posto)}</div><b style="color:#fff">${esc(e.nome)}</b></div><span class="tag ${e.st==="publicada"?"green":"gold"}">${e.st==="publicada"?"Publicada":"Rascunho"}</span></div>
 <div class="kv" style="margin-top:10px"><div><span>Horário</span><b>${e.hi} às ${e.hf}</b></div><div><span>Regime</span><b>${regime(e)}</b></div><div><span>Período</span><b>${fds(e.ini)} a ${fds(e.fim)}</b></div><div><span>Grupos</span><b>${e.grupos.length} · ${nG} guardas</b></div></div>
 <div class="row" style="margin-top:10px;gap:8px"><button class="btn sm ghost" data-a="escEditar" data-id="${e.id}"><span class="ms">edit</span>Editar</button><button class="btn sm red" data-a="escExcluir" data-id="${e.id}" aria-label="Excluir"><span class="ms">delete</span></button></div></div>`}).join("")||`<div class="empty">Nenhuma escala criada ainda.</div>`}
 ${es.length?`<button class="btn gold block" style="margin-top:6px" data-a="go" data-t="escuni"><span class="ms">merge</span>Escala unificada</button>`:""}`)};
V.escnova=()=>{const e=S.escEd,nG=e.grupos.length,todos=ativos().slice().sort((a,b)=>(a.posto===e.posto?0:1)-(b.posto===e.posto?0:1)||a.nome.localeCompare(b.nome)),usados={};e.grupos.forEach((gr,i)=>gr.forEach(x=>usados[x]=i));
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
 ${e.grupos.map((gr,i)=>`<div class="card" style="box-shadow:inset 4px 0 0 ${CORES[i%CORES.length]}"><div class="row between"><b style="color:#fff">${GRUPO(i)}</b><span class="muted">${gr.length} guarda(s)</span></div><div class="chips">${todos.map(x=>{const u=usados[x.id];const mt=e.meta[x.id]||{};return u===i?`<button class="chip on" data-a="escMem" data-g="${x.id}" data-i="${i}">${esc(x.nome.replace("GCM ",""))}${mt.funcao?" · "+esc(mt.funcao):""}${mt.desde?" · a partir de "+fds(mt.desde):""} ✎</button>`:u==null?`<button class="chip" data-a="escG" data-g="${x.id}" data-i="${i}">+ ${esc(x.nome.replace("GCM ",""))}${x.posto===e.posto?"":" ·"}${outra.has(x.id)?" ⚠":""}</button>`:""}).join("")}</div></div>`).join("")}
 <p class="muted">Toque num guarda já escolhido (✎) para definir função (Chefe, Guarnição, Condutor VTR) ou data de início. “·” = de outro posto. “⚠” = já está em outra escala do mesmo período.</p>
 <div class="lbl">Prévia</div>
 <div class="card scroll" style="padding:8px"><table class="egrid"><thead><tr><th></th>${prev.map(s=>`<th>${SEM[parse(s).getDay()].slice(0,1).toUpperCase()}<br>${parse(s).getDate()}</th>`).join("")}</tr></thead><tbody>${e.grupos.map((gr,i)=>`<tr><td class="nm">${GRUPO(i)}<small>${gr.map(x=>esc(g(x).nome.replace("GCM ",""))).join(", ")||"vazio"}</small></td>${prev.map(s=>`<td><span class="cell" style="cursor:default;${grupoDoDia(e,s)===i?"background:"+CORES[i%CORES.length]:"background:var(--low)"}"></span></td>`).join("")}</tr>`).join("")}</tbody></table></div>
 ${Object.keys(st).length?`<div class="card low">${Object.entries(st).map(([gid,v])=>`<div class="row between small" style="padding:3px 0"><span>${esc(g(gid).nome)}</span><b>${v.n} serviços · ${v.h}h</b></div>`).join("")}</div>`:""}
 <div id="eserr"></div><button class="btn gold block" data-a="escSalvar" id="btnEsc"><span class="ms">save</span>Salvar escala</button>`)};
V.escuni=()=>{const mes=S.uniMes||((S.escalas[0]||{}).ini||proxMes()[0]).slice(0,7),es=S.escalas.filter(e=>e.ini.slice(0,7)<=mes&&e.fim.slice(0,7)>=mes),dias=[];for(let s=mes+"-01";mesDe(s)===mes;s=add(s,1))dias.push(s);
 const cf=conflitos(es),gs=[...new Set(es.flatMap(e=>e.grupos.flat()))].map(g).sort((a,b)=>a.posto.localeCompare(b.posto)||a.nome.localeCompare(b.nome)),pub=es.length&&es.every(e=>e.st==="publicada"),b=parse(mes+"-01");
 const cel=(x,s)=>{const e=es.find(e=>{const gi=grupoDoDia(e,s);return gi>=0&&e.grupos[gi].includes(x.id)&&ativoNaEsc(e,x.id,s)});if(!e)return `<td><span class="cell" style="cursor:default;background:var(--low)"></span></td>`;const c=cf.some(q=>q.gid===x.id&&q.s===s);return `<td><span class="cell ucell" style="background:${corEsc(e)};${c?"box-shadow:inset 0 0 0 2px #ff6b5e":""}" title="${esc(e.nome)}">${codTurno(e)}</span></td>`};
 return shell(`<div class="row between"><h2 style="margin:0">${MESF[b.getMonth()]} ${b.getFullYear()}</h2><span class="row" style="gap:2px"><button class="iconbtn" data-a="uniMes" data-d="-1" aria-label="Mês anterior"><span class="ms">chevron_left</span></button><button class="iconbtn" data-a="uniMes" data-d="1" aria-label="Próximo mês"><span class="ms">chevron_right</span></button></span></div>
 <p class="sub">${es.length} escala(s), ${gs.length} guardas.</p>
 <div class="card low">${es.map(e=>`<div class="row" style="padding:4px 0"><span class="cell ucell" style="background:${corEsc(e)};flex:none">${codTurno(e)}</span><span class="small" style="flex:1"><b>${esc(e.nome)}</b> · ${e.hi}–${e.hf} · ${regime(e)}</span><span class="tag ${e.st==="publicada"?"green":"gold"}">${e.st==="publicada"?"publ.":"rasc."}</span></div>`).join("")||`<div class="muted">Nenhuma escala neste mês.</div>`}</div>
 ${cf.length?`<div class="err"><span class="ms">warning</span><span><b>${cf.length} conflito(s):</b> ${cf.slice(0,4).map(q=>esc(g(q.gid).nome)+" em "+fds(q.s)).join(", ")}${cf.length>4?"…":""}. O mesmo guarda está em duas escalas no mesmo dia.</span></div>`:es.length?`<div class="note" style="margin-bottom:10px"><span class="ms" style="color:var(--green)">check_circle</span>Nenhum guarda escalado duas vezes no mesmo dia.</div>`:""}
 ${gs.length?`<div class="card scroll" style="padding:8px"><table class="egrid"><thead><tr><th></th>${dias.map(s=>`<th>${SEM[parse(s).getDay()].slice(0,1).toUpperCase()}<br>${parse(s).getDate()}</th>`).join("")}<th>Total</th></tr></thead><tbody>${gs.map(x=>{let h=0;dias.forEach(s=>{const e=es.find(e=>{const gi=grupoDoDia(e,s);return gi>=0&&e.grupos[gi].includes(x.id)&&ativoNaEsc(e,x.id,s)});if(e)h+=e.horas});return `<tr><td class="nm">${esc(x.nome.replace("GCM ",""))}<small>${esc(x.posto.replace(/ - .*/,""))}</small></td>${dias.map(s=>cel(x,s)).join("")}<td style="white-space:nowrap">${h}h</td></tr>`}).join("")}</tbody></table></div>`:""}
 <div class="grid2" style="margin-top:12px"><button class="btn ghost" data-a="comp" data-p="uni:${mes}" ${es.length?"":"disabled"}><span class="ms">picture_as_pdf</span>PDF</button><button class="btn gold" data-a="uniPublicar" data-m="${mes}" ${es.length&&!cf.length&&!pub?"":"disabled"}><span class="ms">publish</span>${pub?"Publicada":"Publicar"}</button></div>
 <p class="muted">${cf.length?"Resolva os conflitos para publicar. ":""}Ao publicar, a escala de cada guarda é atualizada e ele recebe um aviso no app.</p>`)};

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
 for(const e of es)e.grupos.forEach((gr,i)=>gr.forEach(gid=>{const ds=[];for(let s=mes+"-01";mesDe(s)===mes;s=add(s,1))if(grupoDoDia(e,s)===i&&ativoNaEsc(e,gid,s))ds.push(parse(s).getDate());const fn=((e.meta||{})[gid]||{}).funcao;rows.push([g(gid).nome+" · "+g(gid).mat,e.nome+" ("+GRUPO(i)+(fn?", "+fn:"")+", "+e.hi+"–"+e.hf+")","Dias "+ds.join(", ")+" · "+ds.length*e.horas+"h"])}));
 return{titulo:"Escala Unificada de Serviço",arquivo:"escala-unificada-"+mes,secoes:[{t:"Período",kv:[["Mês",MESF[m-1]+" de "+y],["Escalas",String(es.length)],["Situação",es.every(e=>e.st==="publicada")?"Publicada":"Rascunho"]]},{t:"Escalas",tabela:{cols:["Escala","Horário","Regime"],rows:es.map(e=>[e.nome+" · "+e.posto,e.hi+" às "+e.hf,regime(e)])}},{t:"Servidores",tabela:{cols:["Servidor","Escala","Dias e horas"],rows}}],codigo:codigo({mes,es:es.map(e=>e.id)})}}
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
 go:e=>{if(e.dataset.f)S.filtro=e.dataset.f;go(e.dataset.t,e.dataset.id||null)},
 back:()=>{const v=S.voltar;if(S.tela==="escnova")return go("escalante");if(v&&v.t&&v.t!==S.tela)return go(v.t,v.p);go(HOME[perfilAtual()]||"inicio")},
 closeSheet:(e,ev)=>{if(ev.target===e)closeSheet()},
 x:()=>closeSheet(),
 atualizar:async()=>{await carregar().catch(()=>toast("Sem conexão."));route();render()},
 sair:async()=>{await sb.auth.signOut();location.reload()},
 irLogin:()=>{S.tela="login";render()},
 novoCad:()=>{S.cad=S.cad||cadNovo();S.tela="cadastro";render();scrollTo(0,0)},
 cadSair:()=>{S.tela="login";render()},
 cadIr:e=>{S.cad.etapa=+e.dataset.e;render();scrollTo(0,0)},
 cadVoltar:()=>{S.cad.etapa=Math.max(0,S.cad.etapa-1);render();scrollTo(0,0)},
 cadAvancar:()=>{if(!cadValida(S.cad.etapa))return;S.cad.etapa++;render();scrollTo(0,0)},
 cadEnviar:e=>busy(e,async()=>{for(let i=0;i<4;i++)if(!cadValida(i)){if(i<3){S.cad.etapa=i;render();cadValida(i)}return}
  const c=S.cad;try{const r=await fetch(CFG.url+"/functions/v1/cadastro",{method:"POST",headers:{"Content-Type":"application/json",apikey:CFG.key,Authorization:"Bearer "+CFG.key},body:JSON.stringify({matricula:c.mat.trim(),senha:c.senha,nome:c.nome.trim(),guerra:c.guerra.trim(),tel:c.tel,email:c.email.trim(),patente:c.pat,bm:!!c.bm,adm:c.adm,posto:c.posto,turno:c.turno,perfil:c.perfil,foto:c.foto,selfie:c.selfie})});
   const j=await r.json().catch(()=>({}));if(!r.ok||!j.ok){errBox("cerr",[j.erro||"Não foi possível enviar. Tente de novo."]);return}
   S.cad=null;S.tela="cadastrook";S.param=j.protocolo;render()}catch(x){errBox("cerr",["Sem conexão. Tente de novo."])}}),
 fotoInstr:e=>{const k=e.dataset.k,troca=k==="troca";
  sheet(`<div class="row between"><h2 style="margin:0">Como deve ser a foto</h2><button class="iconbtn" data-a="x" aria-label="Fechar"><span class="ms">close</span></button></div>
  <div class="row" style="gap:16px;margin:14px 0 6px;align-items:center">${GUIA_SVG}<div class="small" style="flex:1"><b style="color:#fff">Do pescoço para cima</b><div class="muted" style="margin-top:4px">Rosto centralizado, pouco espaço acima da cabeça e a gola da farda aparecendo.</div></div></div>
  <div class="regras">${FOTO_OK.map(t=>`<div><span class="ms ok">check_circle</span>${t}</div>`).join("")}${FOTO_NAO.map(t=>`<div><span class="ms no">cancel</span>${t}</div>`).join("")}</div>
  <div class="note ${troca?"gold":""}" style="margin:12px 0 14px"><span class="ms">${troca?"hourglass_top":"verified_user"}</span><span>${troca?"A nova foto vai para análise da Coordenação e só substitui a atual depois de aprovada.":"A foto é conferida pela Coordenação junto com o cadastro."}</span></div>
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
 efAcoes:e=>{const x=g(e.dataset.id),pode=["ccg","admin"].includes(perfilAtual());
  sheet(`<div class="row between"><h2 style="margin:0">${esc(x.nome)}</h2><button class="iconbtn" data-a="x" aria-label="Fechar"><span class="ms">close</span></button></div><p class="sub">${esc(x.mat)} · ${esc(x.posto)} · ${PERFIL_NOME[x.perfil]}</p>
  <form id="fredef"><input type="hidden" id="rd-id" value="${x.id}"><div class="field"><label for="rd1">Senha temporária para ${esc(x.nome)}</label><input id="rd1" minlength="6" required placeholder="Mínimo 6 caracteres"></div><button class="btn ghost block"><span class="ms">key</span>Redefinir senha</button></form>
  ${pode?`<div class="hr" style="margin:16px 0"></div><form id="fperfil"><input type="hidden" id="pp-id" value="${x.id}">
  <div class="grid2"><div class="field"><label for="pp1">Perfil no app</label><select id="pp1">${Object.entries(PERFIL_NOME).filter(([k])=>k!=="admin"||perfilAtual()==="admin").map(([k,l])=>`<option value="${k}" ${k===x.perfil?"selected":""}>${l}</option>`).join("")}</select></div><div class="field"><label for="pp2">Situação</label><select id="pp2"><option value="ativo" ${x.status==="ativo"?"selected":""}>Ativo</option><option value="inativo" ${x.status==="inativo"?"selected":""}>Inativo</option></select></div></div>
  <div class="grid2"><div class="field"><label for="pp3">Patente</label><select id="pp3">${PATENTES.map(k=>`<option ${k===x.pat?"selected":""}>${k}</option>`).join("")}</select></div><div class="field"><label for="pp4">Lotação</label><select id="pp4">${postoOpts(x.posto)}</select></div></div>
  <div class="card low">${[["pp5","bm","Banda de Música (BM)"],["pp6","hab380","Habilitação pistola .380 (**)"],["pp7","hab38","Habilitação revólver .38 (*)"],["pp8","taser","Habilitação Taser (T)"]].map(([id,k,l])=>`<label class="row small" style="padding:6px 0;cursor:pointer"><input type="checkbox" id="${id}" ${x[k]?"checked":""} style="width:22px;min-height:22px;box-shadow:none;accent-color:#e6c429;flex:none">${l}</label>`).join("")}</div>
  <button class="btn gold block">Salvar dados</button></form>`:""}`)},
 escExcl:()=>{const v=document.getElementById("es7").value,x=S.escEd;if(!v)return toast("Escolha a data.");if(!x.excluir.includes(v))x.excluir.push(v);render()},
 escExclRm:e=>{const x=S.escEd;x.excluir=x.excluir.filter(d=>d!==e.dataset.d);render()},
 escMem:e=>{const x=S.escEd,gid=e.dataset.g,m=x.meta[gid]||{};sheet(`<div class="row between"><h2 style="margin:0">${esc(g(gid).nome)}</h2><button class="iconbtn" data-a="x" aria-label="Fechar"><span class="ms">close</span></button></div><p class="sub">${GRUPO(+e.dataset.i)} · ${esc(x.nome||"nova escala")}</p>
  <form id="fmem"><input type="hidden" id="mm-id" value="${gid}"><div class="field"><label for="mm1">Função na equipe</label><select id="mm1">${["","Chefe","Guarnição","Condutor VTR","Rondante","Atendente","Supervisor"].map(f=>`<option value="${f}" ${f===(m.funcao||"")?"selected":""}>${f||"Sem função específica"}</option>`).join("")}</select></div>
  <div class="grid2"><div class="field"><label for="mm2">A partir de</label><input id="mm2" type="date" min="${x.ini}" max="${x.fim}" value="${m.desde||""}"></div><div class="field"><label for="mm3">Até</label><input id="mm3" type="date" min="${x.ini}" max="${x.fim}" value="${m.ate||""}"></div></div>
  <div class="grid2"><button type="button" class="btn red" data-a="escG" data-g="${gid}" data-i="${e.dataset.i}">Tirar do grupo</button><button class="btn gold">Salvar</button></div></form>`)},
 ferRm:e=>busy(e,async()=>{const{error}=await sb.from("feriados").delete().eq("data",e.dataset.d);if(error)return toast(esc(msgErro(error)));await carregar();render();toast("Feriado removido.")}),
 escCriar:()=>{S.escEd=escNova();go("escnova")},
 escEditar:e=>{S.escEd=JSON.parse(JSON.stringify(S.escalas.find(x=>x.id===+e.dataset.id)));S.escEd.meta=S.escEd.meta||{};S.escEd.excluir=S.escEd.excluir||[];go("escnova")},
 escExcluir:e=>sheet(`<h2>Excluir escala?</h2><p class="sub">${esc((S.escalas.find(x=>x.id===+e.dataset.id)||{}).nome)}. Se estiver publicada, sai da escala dos guardas.</p><div class="grid2"><button class="btn ghost" data-a="x">Voltar</button><button class="btn red" data-a="escExcluirOk" data-id="${e.dataset.id}">Excluir</button></div>`),
 escExcluirOk:e=>busy(e,async()=>{closeSheet();const{error}=await sb.from("escalas").delete().eq("id",+e.dataset.id);if(error)return toast(esc(msgErro(error)));await carregar();render();toast("Escala excluída.")}),
 escTurno:e=>{const x=S.escEd;x.hi=e.dataset.i;x.hf=e.dataset.f;x.horas=durH(x.hi,x.hf);render()},
 escGrupo:e=>{const x=S.escEd;if(+e.dataset.d>0)x.grupos.push([]);else if(x.grupos.length>1)x.grupos.pop();render()},
 escG:e=>{closeSheet();const x=S.escEd,gid=e.dataset.g,i=+e.dataset.i,gr=x.grupos[i];if(gr.includes(gid)){x.grupos[i]=gr.filter(q=>q!==gid);delete x.meta[gid]}else if(!x.grupos.some(q=>q.includes(gid)))gr.push(gid);render()},
 escSalvar:e=>busy(e,async()=>{const x=S.escEd,er=[];if(!x.nome.trim())er.push("Dê um nome à escala.");if(!x.ini||!x.fim||x.fim<x.ini)er.push("Confira o período.");if(x.grupos.some(gr=>!gr.length))er.push("Todos os grupos precisam ter pelo menos um guarda.");errBox("eserr",er);if(er.length)return;
  const row={nome:x.nome.trim(),posto:x.posto,ini:x.ini,fim:x.fim,hi:x.hi,hf:x.hf,horas:x.horas,uteis:x.uteis,grupos:gruposParaBanco(x),excluir:(x.excluir||[]).filter(d=>d>=x.ini&&d<=x.fim),sem_feriados:!!x.semFer,status:"rascunho",updated_at:new Date().toISOString()};
  const q=x.id?sb.from("escalas").update(row).eq("id",x.id):sb.from("escalas").insert(row);const{error}=await q;if(error){errBox("eserr",[msgErro(error)]);return}
  S.uniMes=x.ini.slice(0,7);S.escEd=null;await carregar();go("escalante");toast("Escala salva como rascunho.")}),
 uniMes:e=>{const b=parse(((S.uniMes||((S.escalas[0]||{}).ini||proxMes()[0]).slice(0,7)))+"-01");b.setMonth(b.getMonth()+ +e.dataset.d);S.uniMes=iso(b).slice(0,7);render()},
 uniPublicar:e=>busy(e,async()=>{const mes=e.dataset.m,es=S.escalas.filter(x=>x.ini.slice(0,7)<=mes&&x.fim.slice(0,7)>=mes),nomeM=MESF[parse(mes+"-01").getMonth()].toLowerCase(),av0={};
  for(const x of es){const st=escStats(x);for(const[gid,v]of Object.entries(st))av0[gid]=(av0[gid]?av0[gid]+"; ":"")+x.nome+" ("+x.hi+"–"+x.hf+"): "+v.n+" serviço(s)"}
  const avisos=Object.entries(av0).map(([para,t])=>({para,texto:"Escala de "+nomeM+" publicada. "+t+". Confira em Minha Escala."}));
  await rpc("publicar_escalas",{p_ids:es.map(x=>x.id),p_avisos:avisos},"Escala publicada. "+avisos.length+" guarda(s) avisado(s).")}),
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
 if(S.tela==="cadastro"&&el.dataset.c&&el.tagName==="INPUT"&&el.type!=="checkbox"){let v=el.value;if(el.dataset.c==="tel")v=el.value=fmtTel(v);S.cad[el.dataset.c]=v;return}
 if(S.tela==="nova"&&el.dataset.k==="obs"){S.draft.obs=el.value;return}
 if(S.tela==="escnova"&&el.dataset.e==="nome"){S.escEd.nome=el.value;return}
 if(el.dataset.busca){S[el.dataset.busca]=el.value;const q=el.value.toLowerCase();clearTimeout(window.__bt);window.__bt=setTimeout(()=>{render();const i=document.getElementById(el.id);if(i){i.focus();i.setSelectionRange(q.length,q.length)}},300)}
});
document.addEventListener("submit",async ev=>{ev.preventDefault();const f=ev.target,id=f.id,btn=f.querySelector("button");
 if(id==="flogin")return busy(btn,async()=>{const m=document.getElementById("mat").value.trim(),p=document.getElementById("pw").value;
  const{data,error}=await sb.auth.signInWithPassword({email:emailDe(m),password:p});if(error){errBox("lerr",[/invalid/i.test(error.message)?"Matrícula ou senha incorretas.":"Não foi possível entrar. Verifique a conexão."]);return}
  S.uid=data.user.id;S.tela="carregando";render();try{await carregar()}catch(e){toast("Erro ao carregar os dados.")}route();render()});
 if(id==="fmem"){const x=S.escEd,gid=document.getElementById("mm-id").value,m={funcao:document.getElementById("mm1").value,desde:document.getElementById("mm2").value,ate:document.getElementById("mm3").value};if(m.funcao||m.desde||m.ate)x.meta[gid]=m;else delete x.meta[gid];closeSheet();render();return}
 if(id==="fferiado")return busy(btn,async()=>{const d=document.getElementById("fe1").value,n=document.getElementById("fe2").value.trim();if(!d||!n)return toast("Informe data e nome.");const{error}=await sb.from("feriados").upsert({data:d,nome:n});if(error)return toast(esc(msgErro(error)));await carregar();render();toast("Feriado salvo.")});
 if(id==="fcont")return busy(btn,async()=>{closeSheet();await rpc("atualizar_contato",{p_tel:fmtTel(document.getElementById("ct1").value),p_email:document.getElementById("ct2").value},"Contato atualizado.")});
 if(id==="fsenha")return busy(btn,async()=>{const a=document.getElementById("ns1").value,b=document.getElementById("ns2").value;if(a.length<6||a!==b)return errBox("serr",["As senhas precisam ser iguais e ter pelo menos 6 caracteres."]);const{error}=await sb.auth.updateUser({password:a});if(error)return errBox("serr",["Não foi possível trocar a senha."]);closeSheet();toast("Senha alterada.")});
 if(id==="fredef")return busy(btn,async()=>{const alvo=document.getElementById("rd-id").value,s=document.getElementById("rd1").value;const{data,error}=await sb.functions.invoke("redefinir-senha",{body:{id:alvo,senha:s}});if(error||!data||!data.ok)return toast("Não foi possível redefinir.");closeSheet();toast("Senha redefinida. Passe a senha temporária ao servidor.")});
 if(id==="fperfil")return busy(btn,async()=>{const v=k=>document.getElementById(k),args={p_id:v("pp-id").value,p_perfil:v("pp1").value,p_status:v("pp2").value,p_patente:v("pp3").value,p_posto:v("pp4").value,p_bm:v("pp5").checked,p_hab_380:v("pp6").checked,p_hab_38:v("pp7").checked,p_hab_taser:v("pp8").checked};closeSheet();await rpc("atualizar_servidor",args,"Dados atualizados.")});
});
document.addEventListener("keydown",ev=>{if(ev.key==="Escape")closeSheet()});
document.addEventListener("visibilitychange",async()=>{if(document.visibilityState==="visible"&&S.uid&&S.me){try{await carregar();if(!document.querySelector(".sheet-bg")&&!["nova","escnova","cadastro"].includes(S.tela))render()}catch(e){}}});

(async()=>{
 try{await carregarRef()}catch(e){}
 const{data}=await sb.auth.getSession();
 if(data.session){S.uid=data.session.user.id;try{await carregar()}catch(e){app.innerHTML=`<div class="loading"><img src="${LOGO}" alt="" style="height:96px"><div>Sem conexão com o servidor.</div><button class="btn ghost" onclick="location.reload()">Tentar de novo</button></div>`;return}}
 S.tela="login";route();render();
})();
}
