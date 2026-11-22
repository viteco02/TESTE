/* =====================================================================
   Banco Ágape — módulo do RETIRO
   Agenda + check-in, meditação, desafios, oração, diário, placar,
   quiz, enquetes, medalhas e catálogo do leilão (participante e gerente)
   ===================================================================== */
{
const SVG = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const IC = {
  agenda: SVG('<rect x="3" y="4.5" width="18" height="16.5" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>'),
  qr: SVG('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M21 14v.01M14 21h7v-4"/>'),
  livro: SVG('<path d="M4 19.5V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M19 19v3H6a2 2 0 0 1 0-4h13"/><path d="M11.5 6.5v6M9 9h5"/>'),
  alvo: SVG('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>'),
  maos: SVG('<path d="M12 21c-4-2-7-5.5-7-10V5l3-2v7"/><path d="M12 21c4-2 7-5.5 7-10V5l-3-2v7"/><path d="M12 21V9"/>'),
  pena: SVG('<path d="M20 4c-8 0-14 6-14 14v2h2c8 0 12-6 12-16z"/><path d="M4 20L14 10"/>'),
  trofeu: SVG('<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>'),
  quiz: SVG('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17v.01"/>'),
  enquete: SVG('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  martelo: SVG('<path d="M14.5 3.5l6 6M12 6l6 6M13.2 4.8l-6.4 6.4M17.2 8.8l-6.4 6.4M9.5 13.5L3 20"/><path d="M14 21h7"/>'),
  foto: SVG('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 8"/>'),
  telao: SVG('<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>'),
  medalha: SVG('<circle cx="12" cy="14" r="6"/><path d="M8.5 9L6 2h4l2 5M15.5 9L18 2h-4l-2 5"/><path d="M12 11.5l.9 1.8 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3z"/>'),
  coroa: SVG('<path d="M3 18h18M4 18L3 7l5 4 4-7 4 7 5-4-1 11"/>')
};
Object.assign(ICONES_NOTIF, { agenda: IC.agenda, desafio: IC.alvo, oracao: IC.maos, conquista: IC.medalha, quiz: IC.quiz, enquete: IC.enquete });
const MEDALHA_IC = { pontual: IC.agenda, generoso: SVG('<path d="M4.5 10.5V9a3 3 0 0 1 3-3H19"/><path d="M15.5 2.5L19.5 6l-4 3.5"/><path d="M19.5 13.5V15a3 3 0 0 1-3 3H5"/><path d="M8.5 14.5L4.5 18l4 3.5"/>'),
  guerreiro: IC.maos, sabio: IC.quiz, desafiante: IC.alvo, voz: IC.enquete };
const TIPOS = { palestra: "Palestra", culto: "Culto", refeicao: "Refeição", atividade: "Atividade", livre: "Livre" };
const hm = d => new Date(d).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
const diaChave = d => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`; };
const diaNome = k => { const [y,m,d] = k.split("-").map(Number); const x = new Date(y, m-1, d);
  const hoje = diaChave(Date.now()); if (k === hoje) return "Hoje";
  return x.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" }).replace(".", ""); };
const erroModal = e => abrirModal(`<h3>Ops!</h3><p>${esc(e.message || e)}</p><button class="btn claro" onclick="fecharModal()">Fechar</button>`);
const seg = (id, itens, ativo) => `<div class="seg" id="${id}">${itens.map(([k,t]) => `<button type="button" data-k="${k}" class="${k===ativo?"on":""}">${t}</button>`).join("")}</div>`;
const ligarSeg = (id, fn) => $$(`#${id} button`).forEach(b => b.onclick = () => fn(b.dataset.k));
const vazio = t => `<div class="bloco" style="text-align:center;color:var(--cinza)">${t}</div>`;
const val = id => { const e = $(id); return e ? e.value : ""; };

/* ============================ PARTICIPANTE ============================ */
let abaC = "banco", subFe = "meditacao", subJogos = "placar", agendaDia = null, cacheAgenda = [];

$$("#abas-c button").forEach(b => b.addEventListener("click", () => trocarAbaC(b.dataset.aba)));
function trocarAbaC(a){
  abaC = a;
  $$("#abas-c button").forEach(b => b.classList.toggle("ativa", b.dataset.aba === a));
  ["banco","agenda","fe","jogos","leilao"].forEach(x => $("#aba-c-"+x).classList.toggle("hidden", x !== a));
  window.scrollTo(0, 0); carregarAbaC();
}
window.carregarAbaC = function(silencioso){
  if (!sessao || sessao.papel !== "cliente") return;
  if (abaC === "banco") { carregarCliente(); carregarConquistas(); }
  else if (abaC === "agenda") carregarAgenda();
  else if (abaC === "fe") carregarFe(silencioso);
  else if (abaC === "jogos") carregarJogos(silencioso);
  else if (abaC === "leilao" && !silencioso) carregarLeilao();
};
// atualização automática da aba aberta (o saldo já se atualiza sozinho)
setInterval(() => {
  if (document.hidden || !sessao) return;
  if (sessao.papel === "cliente" && ["agenda","jogos"].includes(abaC)) carregarAbaC(true);
  if (sessao.papel === "cliente" && abaC === "fe" && subFe === "oracao") carregarFe(true);
  if (sessao.papel === "gerente" && telaoAberto) desenharTelao();
}, 12000);
const _iniciar = iniciar;
iniciar = function(){ abaC = "banco"; _iniciar(); if (sessao && sessao.papel === "cliente") trocarAbaC("banco"); };

/* ---------- Medalhas ---------- */
async function carregarConquistas(){
  try {
    const r = await rpc("minhas_conquistas", { p_token: sessao.token });
    const ganhas = r.medalhas.filter(m => m.ganhou).length;
    $("#c-conquistas").innerHTML = `<h2>Medalhas <span class="etq am">${ganhas}/${r.medalhas.length}</span></h2>
      ${r.mais_generoso_nome ? `<div class="bloco" style="display:flex;gap:12px;align-items:center;margin:0 0 10px;padding:12px 14px">
        <div style="width:38px;height:38px;border-radius:50%;background:var(--mostarda);color:var(--cafe);display:grid;place-items:center;flex:none">${IC.coroa}</div>
        <div><b style="font-size:14px">${r.mais_generoso ? "Você é o mais generoso do retiro!" : "Mais generoso do retiro"}</b>
        <div style="font-size:13px;color:var(--marrom)">${r.mais_generoso ? "Ninguém transferiu mais α$ para os outros." : esc(r.mais_generoso_nome)}</div></div></div>` : ""}
      <div class="medalhas">${r.medalhas.map(m => `<div class="medalha ${m.ganhou?"ok":""}">
        <div class="m">${MEDALHA_IC[m.codigo] || IC.medalha}</div><b>${esc(m.titulo)}</b>
        <small>${m.ganhou ? "Conquistada!" : esc(m.descricao)}</small>
        ${m.ganhou ? "" : `<div class="prog"><i style="width:${Math.round(100*m.progresso/m.meta)}%"></i></div><small>${m.progresso}/${m.meta}</small>`}
      </div>`).join("")}</div>`;
  } catch (e) {}
}

/* ---------- Agenda + check-in ---------- */
function fimDe(a, lista){
  if (a.fim) return new Date(a.fim);
  const prox = lista.find(b => new Date(b.inicio) > new Date(a.inicio));
  const umaHora = new Date(new Date(a.inicio).getTime() + 3600e3);
  return prox && new Date(prox.inicio) < umaHora ? new Date(prox.inicio) : umaHora;
}
function situacao(lista){
  const agora = Date.now(); let atual = null, proxima = null;
  for (const a of lista) {
    const ini = new Date(a.inicio).getTime(), fim = fimDe(a, lista).getTime();
    if (ini <= agora && agora < fim) atual = atual || a;
    if (ini > agora && !proxima) proxima = a;
  }
  return { atual, proxima };
}
const checkinAberto = a => { const t = Date.now(), ini = new Date(a.inicio).getTime();
  return t >= ini - 15*60e3 && t <= (a.fim ? new Date(a.fim).getTime() : ini + 2*3600e3); };

async function carregarAgenda(){
  try { cacheAgenda = await rpc("programacao", { p_token: sessao.token }); desenharAgenda(); }
  catch (e) { if (!cacheAgenda.length) $("#aba-c-agenda").innerHTML = vazio(esc(e.message)); }
}
function desenharAgenda(){
  const lista = cacheAgenda, el = $("#aba-c-agenda");
  if (!lista.length) { el.innerHTML = `<h2 style="margin-top:6px">Programação</h2>` + vazio("A programação do retiro ainda não foi publicada."); return; }
  const dias = [...new Set(lista.map(a => diaChave(a.inicio)))];
  const hoje = diaChave(Date.now());
  if (!agendaDia || !dias.includes(agendaDia)) agendaDia = dias.includes(hoje) ? hoje : (dias.find(d => d > hoje) || dias[dias.length-1]);
  const { atual, proxima } = situacao(lista);
  const destaque = (a, rot) => a ? `<div class="bloco" style="background:${rot==="Agora"?"var(--cafe)":"var(--creme)"};color:${rot==="Agora"?"#fff":"inherit"}">
      <span class="etq ${rot==="Agora"?"am":"ca"}">${rot}</span>
      <h4 style="margin-top:8px;font-size:20px">${esc(a.titulo)}</h4>
      <p style="color:inherit;opacity:.85">${hm(a.inicio)}${a.local ? " · " + esc(a.local) : ""}</p>
      ${!a.fiz_checkin && checkinAberto(a) && a.checkin_valor > 0 ? `<button class="btn amarelo" style="margin-top:12px" data-scan>Fazer check-in · ganhe ${agTxt(a.checkin_valor)}</button>` : ""}
      ${a.fiz_checkin ? `<p style="color:inherit;font-weight:800;margin-top:10px">✓ Check-in feito</p>` : ""}</div>` : "";
  const doDia = lista.filter(a => diaChave(a.inicio) === agendaDia);
  el.innerHTML = `${destaque(atual, "Agora")}${destaque(proxima, "A seguir")}
    <button class="btn" style="display:flex;align-items:center;justify-content:center;gap:8px" data-scan><span style="width:20px;height:20px;display:inline-flex">${IC.qr}</span>Escanear QR de check-in</button>
    <h2>Programação</h2>
    <div class="valores" id="ag-dias">${dias.map(d => `<button type="button" class="chip ${d===agendaDia?"on":""}" data-d="${d}">${diaNome(d)}</button>`).join("")}</div>
    <div class="lista" style="margin-top:12px">${doDia.map(a => {
      const fim = fimDe(a, lista).getTime(), passou = fim < Date.now(), agora = atual && atual.id === a.id;
      return `<div class="ativ ${agora?"agora":""} ${passou&&!agora?"passou":""}">
        <div class="hora">${hm(a.inicio)}<small>${a.fim ? "até " + hm(a.fim) : ""}</small></div>
        <div style="flex:1;min-width:0"><div style="font-weight:800">${esc(a.titulo)}</div>
          <div class="sub">${TIPOS[a.tipo]||""}${a.local ? " · " + esc(a.local) : ""}</div>
          ${a.descricao ? `<div class="sub">${esc(a.descricao)}</div>` : ""}
          <div class="acao">${a.fiz_checkin ? `<span class="etq ve">✓ presença</span>` :
            a.checkin_valor > 0 ? (checkinAberto(a) ? `<button class="mini" data-scan>Check-in · ${agTxt(a.checkin_valor)}</button>` : passou ? "" : `<span class="etq">check-in vale ${agTxt(a.checkin_valor)}</span>`) : ""}</div>
        </div></div>`; }).join("")}</div>`;
  $$("#ag-dias .chip").forEach(c => c.onclick = () => { agendaDia = c.dataset.d; desenharAgenda(); });
  $$("#aba-c-agenda [data-scan]").forEach(b => b.onclick = () => abrirScanner("Check-in", "Aponte a câmera para o QR Code da atividade."));
}
window.fazerCheckin = async function(codigo){
  try {
    const r = await rpc("checkin", { p_token: sessao.token, p_codigo: codigo });
    abrirModal(`<div style="text-align:center;padding:10px 0">
      <div style="width:84px;height:84px;border-radius:50%;margin:0 auto 12px;display:grid;place-items:center;background:${r.pontual?"var(--mostarda)":"#EADCC6"};color:var(--cafe);font-size:42px;font-weight:900">✓</div>
      <h3>Check-in feito!</h3><p>${esc(r.titulo)}</p>
      <p style="font-size:22px;font-weight:900;color:var(--cafe);margin-top:12px">${r.pontual ? (r.valor ? "+ " + ag(r.valor) : "Presença registrada") : "Presença registrada"}</p>
      ${r.pontual ? "" : `<p style="font-size:13.5px">Chegou depois do horário, por isso não valeu α$ desta vez.</p>`}</div>
      <button class="btn amarelo" onclick="fecharModal()">Amém!</button>`);
    if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
    carregarCliente(); carregarNotificacoes(); if (abaC === "agenda") carregarAgenda();
  } catch (e) { erroModal(e); }
};

/* ---------- Espiritual ---------- */
function carregarFe(silencioso){
  const el = $("#aba-c-fe");
  if (!silencioso || !$("#fe-seg")) {
    el.innerHTML = seg("fe-seg", [["meditacao","Meditação"],["desafios","Desafios"],["oracao","Oração"],["diario","Diário"]], subFe) + `<div id="fe-c"></div>`;
    ligarSeg("fe-seg", k => { subFe = k; carregarFe(); });
  }
  ({ meditacao: feMeditacao, desafios: feDesafios, oracao: feOracao, diario: feDiario })[subFe]();
}
async function feMeditacao(){
  try {
    const l = await rpc("meditacoes", { p_token: sessao.token });
    if (!l.length) { $("#fe-c").innerHTML = vazio("A meditação do dia é liberada pela manhã. Volte daqui a pouco!"); return; }
    const [hoje, ...antes] = l;
    const card = (m, grande) => `<div class="bloco" ${grande ? 'style="background:var(--cafe);color:#fff;border:0"' : ""}>
      <span class="etq ${grande?"am":""}">${diaChave(Date.now()) === m.dia ? "Meditação de hoje" : diaNome(m.dia)}</span>
      <h4 style="margin-top:10px;font-size:${grande?"22px":"17px"}">${esc(m.referencia)}</h4>
      ${m.texto_biblico ? `<p style="font-style:italic;border-left:3px solid var(--mostarda);padding-left:12px;margin-top:10px;color:${grande?"#F3E9DC":"var(--marrom)"}">${esc(m.texto_biblico)}</p>` : ""}
      ${m.reflexao ? `<p style="margin-top:12px;color:${grande?"#fff":"var(--cafe)"};white-space:pre-wrap">${esc(m.reflexao)}</p>` : ""}</div>`;
    $("#fe-c").innerHTML = card(hoje, true) + (antes.length ? `<h2>Dias anteriores</h2>` + antes.map(m => card(m, false)).join("") : "");
  } catch (e) { $("#fe-c").innerHTML = vazio(esc(e.message)); }
}
const STATUS = { pendente: ["etq am", "Aguardando aprovação"], aprovado: ["etq ve", "✓ Cumprido"], recusado: ["etq ca", "Não aprovado · tente de novo"] };
async function feDesafios(){
  try {
    const l = await rpc("desafios", { p_token: sessao.token });
    const feitos = l.filter(d => d.status === "aprovado").length;
    $("#fe-c").innerHTML = l.length ? `<p style="color:var(--marrom);margin:14px 2px 0">Cumpra os desafios e ganhe α$. Você completou <b>${feitos} de ${l.length}</b>.</p>` + l.map(d => `
      <div class="bloco"><div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
        <h4>${esc(d.titulo)}</h4><span class="etq am">${agTxt(d.valor)}</span></div>
        ${d.descricao ? `<p>${esc(d.descricao)}</p>` : ""}
        <div style="margin-top:12px;display:flex;justify-content:space-between;align-items:center;gap:8px">
          ${d.status ? `<span class="${STATUS[d.status][0]}">${STATUS[d.status][1]}</span>` : `<span style="font-size:12.5px;color:var(--cinza)">${d.precisa_aprovacao ? "O gerente confirma antes de pagar" : "Vale na hora"}</span>`}
          ${!d.status || d.status === "recusado" ? `<button class="mini" data-d="${d.id}">Cumpri!</button>` : ""}</div></div>`).join("")
      : vazio("Os desafios espirituais aparecem aqui em breve.");
    $$("#fe-c [data-d]").forEach(b => b.onclick = () => {
      const d = l.find(x => x.id == b.dataset.d);
      abrirModal(`<h3>${esc(d.titulo)}</h3><p>Conte rapidinho como foi (opcional).</p>
        <textarea id="dz-com" maxlength="300" placeholder="ex.: orei pela Ana da Equipe Raiz"></textarea>
        <div id="t-erro" class="erro hidden"></div>
        <button class="btn amarelo" id="dz-ok">Marcar como cumprido</button><button class="btn claro" onclick="fecharModal()">Cancelar</button>`);
      $("#dz-ok").onclick = async () => {
        try { const r = await rpc("cumprir_desafio", { p_token: sessao.token, p_desafio: d.id, p_comentario: val("#dz-com") });
          fecharModal(); toast(r.status === "aprovado" ? `Desafio cumprido! +${agTxt(r.valor)}` : "Enviado! O gerente vai confirmar.");
          feDesafios(); carregarCliente(); carregarNotificacoes(); }
        catch (e) { mostrarErro(e.message); }
      };
    });
  } catch (e) { $("#fe-c").innerHTML = vazio(esc(e.message)); }
}
async function feOracao(){
  try {
    const l = await rpc("mural", { p_token: sessao.token });
    $("#fe-c").innerHTML = `<button class="btn amarelo" id="or-novo">Fazer um pedido de oração</button>` +
      (l.length ? l.map(o => `<div class="bloco">
        <div style="display:flex;justify-content:space-between;gap:8px"><b style="font-size:14px">${o.anonimo ? "Anônimo" : esc(o.autor)}${o.minha ? ' <span class="etq">seu pedido</span>' : ""}</b>
        <small style="color:var(--cinza)">${quando(o.criado_em)}</small></div>
        <p style="font-size:15.5px;color:var(--cafe);white-space:pre-wrap">${esc(o.texto)}</p>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px">
          <span style="font-size:13px;color:var(--marrom);font-weight:700">${o.orando} ${o.orando == 1 ? "pessoa orando" : "pessoas orando"}</span>
          <button class="mini ${o.eu_orando ? "es" : ""}" data-o="${o.id}">${o.eu_orando ? "✓ Estou orando" : "Estou orando"}</button></div></div>`).join("")
      : vazio("Nenhum pedido ainda. Seja o primeiro a compartilhar."));
    $("#or-novo").onclick = () => {
      abrirModal(`<h3>Pedido de oração</h3>
        <textarea id="or-txt" maxlength="500" placeholder="Pelo que você quer que a gente ore?"></textarea>
        <label style="display:flex;align-items:center;gap:10px;font-size:15px;margin-top:14px"><input type="checkbox" id="or-anon" style="width:22px;height:22px">Publicar como anônimo</label>
        <div id="t-erro" class="erro hidden"></div>
        <button class="btn amarelo" id="or-ok">Publicar no mural</button><button class="btn claro" onclick="fecharModal()">Cancelar</button>`);
      $("#or-ok").onclick = async () => {
        try { await rpc("pedir_oracao", { p_token: sessao.token, p_texto: val("#or-txt"), p_anonimo: $("#or-anon").checked });
          fecharModal(); toast("Pedido publicado 🙏"); feOracao(); } catch (e) { mostrarErro(e.message); }
      };
    };
    $$("#fe-c [data-o]").forEach(b => b.onclick = async () => {
      try { await rpc("orar", { p_token: sessao.token, p_oracao: Number(b.dataset.o) }); feOracao(); } catch (e) { toast(e.message); }
    });
  } catch (e) { $("#fe-c").innerHTML = vazio(esc(e.message)); }
}
// Diário: fica SOMENTE neste celular (localStorage), ninguém mais vê
const chaveDiario = () => "agape_diario_" + (meuUsuario || sessao.nome);
const lerDiario = () => { try { return JSON.parse(localStorage.getItem(chaveDiario())) || []; } catch (e) { return []; } };
const gravarDiario = l => { try { localStorage.setItem(chaveDiario(), JSON.stringify(l)); return true; } catch (e) { return false; } };
function feDiario(){
  const l = lerDiario();
  $("#fe-c").innerHTML = `<div class="bloco" style="background:#FFF6DF;border-color:var(--mostarda)"><b style="font-size:14px">Só você vê isto.</b>
      <p>O diário fica guardado apenas neste celular. Nem o gerente nem o servidor têm acesso.</p></div>
    <label>O que Deus falou com você hoje?</label>
    <textarea id="di-txt" placeholder="Escreva aqui…"></textarea>
    <button class="btn amarelo" id="di-ok">Guardar no diário</button>
    ${l.length ? `<h2>Minhas anotações</h2>` + l.map(n => `<div class="bloco"><div style="display:flex;justify-content:space-between;gap:8px">
      <small style="color:var(--cinza);font-weight:700">${dataHora(n.data)}</small><button class="link" style="font-size:13px" data-x="${n.id}">apagar</button></div>
      <p class="diario-item" style="color:var(--cafe);font-size:15.5px">${esc(n.texto)}</p></div>`).join("") : ""}`;
  $("#di-ok").onclick = () => {
    const t = val("#di-txt").trim(); if (!t) return toast("Escreva alguma coisa primeiro.");
    l.unshift({ id: Date.now(), data: new Date().toISOString(), texto: t });
    if (!gravarDiario(l)) return toast("Não consegui guardar neste aparelho.");
    toast("Guardado no seu diário"); feDiario();
  };
  $$("#fe-c [data-x]").forEach(b => b.onclick = () => {
    abrirModal(`<h3>Apagar anotação?</h3><p>Ela some deste celular e não dá para recuperar.</p>
      <button class="btn" id="di-del">Apagar</button><button class="btn claro" onclick="fecharModal()">Cancelar</button>`);
    $("#di-del").onclick = () => { gravarDiario(l.filter(n => n.id != b.dataset.x)); fecharModal(); feDiario(); };
  });
}

/* ---------- Jogos: placar, quiz, enquetes ---------- */
function carregarJogos(silencioso){
  const el = $("#aba-c-jogos");
  if (!silencioso || !$("#jg-seg")) {
    el.innerHTML = seg("jg-seg", [["placar","Placar"],["quiz","Quiz"],["enquetes","Enquetes"]], subJogos) + `<div id="jg-c"></div>`;
    ligarSeg("jg-seg", k => { subJogos = k; carregarJogos(); });
  }
  if (silencioso && subJogos === "enquetes" && $("#jg-c .estrelas button.on, #jg-c .opcao.certa, #jg-c textarea:focus")) return; // não atrapalha quem está respondendo
  ({ placar: jgPlacar, quiz: jgQuiz, enquetes: jgEnquetes })[subJogos]();
}
const barrasPlacar = (eq, meu) => { const max = Math.max(1, ...eq.map(e => e.total));
  return eq.map((e, i) => `<div class="barra ${e.grupo === meu ? "eu" : ""}"><div class="n">${i+1}º</div>
    <div class="t"><div><span>${esc(e.grupo)}</span><span>${agTxt(e.total)}</span></div>
    <div class="b"><i style="width:${Math.max(3, Math.round(100*e.total/max))}%"></i></div></div></div>`).join(""); };
async function jgPlacar(){
  try {
    const r = await rpc("placar", { p_token: sessao.token }), meu = $("#c-grupo").textContent;
    $("#jg-c").innerHTML = `<div class="bloco"><h4>Placar das equipes</h4><p style="margin-bottom:6px">Soma dos α$ de cada equipe, ao vivo.</p>
      ${r.equipes.length ? barrasPlacar(r.equipes, meu) : "<p>Sem equipes ainda.</p>"}</div>`;
  } catch (e) { $("#jg-c").innerHTML = vazio(esc(e.message)); }
}
function restante(ate){ const s = Math.max(0, Math.round((new Date(ate) - Date.now())/1000)); return s >= 60 ? `${Math.floor(s/60)} min` : `${s} s`; }
async function jgQuiz(){
  try {
    const l = await rpc("quiz", { p_token: sessao.token });
    const abertas = l.filter(q => q.aberta && q.minha_escolha == null), resto = l.filter(q => !(q.aberta && q.minha_escolha == null));
    const certas = l.filter(q => q.acertou).length;
    $("#jg-c").innerHTML = (abertas.length ? `<div class="bloco" style="background:var(--cafe);color:#fff;border:0;text-align:center">
        <b style="font-size:18px">Rodada relâmpago!</b><p style="color:#E9DCCF">Responda antes do tempo acabar. Cada acerto vale α$.</p></div>` : "")
      + abertas.map(q => `<div class="bloco"><div style="display:flex;justify-content:space-between;gap:8px"><span class="etq am">${agTxt(q.valor)}</span>
          <span class="etq ca">⏱ ${restante(q.aberta_ate)}</span></div><h4 style="margin-top:10px">${esc(q.pergunta)}</h4>
          ${q.opcoes.map((o, i) => `<button class="opcao" data-q="${q.id}" data-i="${i}">${String.fromCharCode(65+i)}) ${esc(o)}</button>`).join("")}</div>`).join("")
      + (!abertas.length ? vazio("Nenhuma pergunta aberta agora. Fique de olho: o gerente libera rodadas relâmpago nos intervalos!") : "")
      + (resto.length ? `<h2>Já respondidas · ${certas} acerto${certas===1?"":"s"}</h2>` + resto.map(q => `<div class="bloco"><h4 style="font-size:15px">${esc(q.pergunta)}</h4>
          ${q.opcoes.map((o, i) => `<div class="opcao ${i===q.correta?"certa":""} ${i===q.minha_escolha&&i!==q.correta?"errada":""}" style="cursor:default">${String.fromCharCode(65+i)}) ${esc(o)}${i===q.minha_escolha?" · sua resposta":""}</div>`).join("")}
          <p style="font-weight:800">${q.minha_escolha == null ? "Não respondeu a tempo" : q.acertou ? `Acertou! +${agTxt(q.valor)}` : "Não foi dessa vez"}</p></div>`).join("") : "");
    $$("#jg-c [data-q]").forEach(b => b.onclick = async () => {
      $$(`#jg-c [data-q="${b.dataset.q}"]`).forEach(x => x.disabled = true);
      try { const r = await rpc("responder_quiz", { p_token: sessao.token, p_pergunta: Number(b.dataset.q), p_escolha: Number(b.dataset.i) });
        b.classList.add(r.acertou ? "certa" : "errada");
        if (!r.acertou) $(`#jg-c [data-q="${b.dataset.q}"][data-i="${r.correta}"]`).classList.add("certa");
        toast(r.acertou ? `Acertou! +${agTxt(r.valor)}` : "Errou… a certa está em verde");
        setTimeout(() => { jgQuiz(); carregarCliente(); }, 1600);
      } catch (e) { toast(e.message); jgQuiz(); }
    });
  } catch (e) { $("#jg-c").innerHTML = vazio(esc(e.message)); }
}
async function jgEnquetes(){
  try {
    const l = await rpc("enquetes", { p_token: sessao.token });
    const abertas = l.filter(e => e.aberta && e.minha_resposta == null), feitas = l.filter(e => e.minha_resposta != null);
    $("#jg-c").innerHTML = (abertas.length ? abertas.map(e => `<div class="bloco" data-e="${e.id}">
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><h4>${esc(e.pergunta)}</h4><span class="etq am">ganhe ${agTxt(e.valor)}</span></div>
        ${e.tipo === "estrelas" ? `<div class="estrelas">${[1,2,3,4,5].map(n => `<button type="button" data-n="${n}">★</button>`).join("")}</div>`
          : e.opcoes.map((o, i) => `<button type="button" class="opcao" data-n="${i}">${esc(o)}</button>`).join("")}
        <textarea placeholder="Quer comentar? (opcional)" style="min-height:70px;margin-top:10px" maxlength="400"></textarea>
        <button class="btn amarelo" data-enviar>Enviar resposta</button></div>`).join("")
      : vazio("Nenhuma enquete aberta agora. Quando tiver, ela aparece aqui valendo α$!"))
      + (feitas.length ? `<h2>Você já respondeu</h2>` + feitas.map(e => `<div class="bloco" style="padding:12px 16px"><b style="font-size:14.5px">${esc(e.pergunta)}</b>
          <p>${e.tipo === "estrelas" ? "★".repeat(e.minha_resposta) : esc(e.opcoes[e.minha_resposta])}</p></div>`).join("") : "");
    $$("#jg-c [data-e]").forEach(card => {
      let escolha = null;
      card.querySelectorAll("[data-n]").forEach(b => b.onclick = () => {
        escolha = Number(b.dataset.n);
        card.querySelectorAll("[data-n]").forEach(x => x.classList.toggle(x.classList.contains("opcao") ? "certa" : "on",
          x.classList.contains("opcao") ? x === b : Number(x.dataset.n) <= escolha));
      });
      card.querySelector("[data-enviar]").onclick = async () => {
        if (escolha === null) return toast("Escolha uma resposta.");
        try { const r = await rpc("responder_enquete", { p_token: sessao.token, p_enquete: Number(card.dataset.e), p_resposta: escolha, p_comentario: card.querySelector("textarea").value });
          toast(`Obrigado! +${agTxt(r.valor)}`); jgEnquetes(); carregarCliente(); }
        catch (e) { toast(e.message); }
      };
    });
  } catch (e) { $("#jg-c").innerHTML = vazio(esc(e.message)); }
}

/* ---------- Leilão (catálogo) ---------- */
async function carregarLeilao(){
  const el = $("#aba-c-leilao");
  try {
    const l = await rpc("leilao", { p_token: sessao.token });
    el.innerHTML = `<div class="bloco" style="background:var(--cafe);color:#fff;border:0;margin-top:6px">
        <span class="etq am">Catálogo do leilão</span>
        <h4 style="margin-top:8px;font-size:20px">Junte α$ e dê seus lances no fim do retiro!</h4>
        <p style="color:#E9DCCF">Seu saldo agora: <b style="color:var(--mostarda)">${agTxt(meuSaldo)}</b></p></div>`
      + (l.length ? l.map(i => { const falta = i.lance_minimo - meuSaldo;
          return `<div class="item-leilao"><div class="foto" ${i.foto ? `style="background-image:url('${i.foto}')"` : ""}>${i.foto ? "" : IC.foto}</div>
          <div class="info"><h4 style="margin:0;font-size:18px">${esc(i.titulo)}</h4>
          ${i.descricao ? `<p style="margin:6px 0 0;color:var(--marrom);font-size:14.5px">${esc(i.descricao)}</p>` : ""}
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;gap:8px">
            <span>Lance mínimo <b class="ag" style="font-size:18px"><i>α</i>$ ${fmt(i.lance_minimo)}</b></span>
            ${falta > 0 ? `<span class="etq">faltam ${agTxt(falta)}</span>` : `<span class="etq ve">dá para você!</span>`}</div></div></div>`; }).join("")
        : vazio("Os itens do leilão vão aparecer aqui. Vá juntando seus α$!"));
  } catch (e) { el.innerHTML = vazio(esc(e.message)); }
}

/* ============================== GERENTE ============================== */
let subR = null, telaoAberto = null;
const CARDS_R = [
  ["programacao", IC.agenda, "Programação", "Horários e QR de check-in"],
  ["desafios", IC.alvo, "Desafios", "Criar e aprovar"],
  ["meditacoes", IC.livro, "Meditações", "Texto do dia"],
  ["quiz", IC.quiz, "Quiz bíblico", "Rodadas relâmpago"],
  ["enquetes", IC.enquete, "Enquetes", "Opinião valendo α$"],
  ["leilao", IC.martelo, "Leilão", "Catálogo com fotos"],
  ["oracao", IC.maos, "Mural de oração", "Acompanhar pedidos"],
  ["placar", IC.telao, "Placar no telão", "Ranking das equipes"]
];
window.abrirRetiro = function(sub){
  subR = sub || null;
  const el = $("#aba-retiro");
  if (!subR) {
    el.innerHTML = `<h2 style="margin-top:6px">Retiro Reconectados</h2><div class="cards-retiro">${CARDS_R.map(([k, ic, t, s]) =>
      `<button class="card-r" data-r="${k}">${ic}<b>${t}</b><small>${s}</small>${k==="desafios"?'<span class="badge hidden" id="r-pend"></span>':""}</button>`).join("")}</div>`;
    $$("#aba-retiro [data-r]").forEach(b => b.onclick = () => abrirRetiro(b.dataset.r));
    rpc("ger_desafios", { p_token: sessao.token }).then(r => { const b = $("#r-pend"); if (b && r.pendentes.length) { b.textContent = r.pendentes.length; b.classList.remove("hidden"); } }).catch(()=>{});
    return;
  }
  const t = CARDS_R.find(c => c[0] === subR);
  el.innerHTML = `<button class="voltar" id="r-voltar">← Retiro</button><h2 style="margin-top:4px">${t[2]}</h2><div id="r-c"><div class="vazio">Carregando…</div></div>`;
  $("#r-voltar").onclick = () => abrirRetiro();
  window.scrollTo(0, 0);
  ({ programacao: gProgramacao, desafios: gDesafios, meditacoes: gMeditacoes, quiz: gQuiz, enquetes: gEnquetes,
     leilao: gLeilao, oracao: gOracao, placar: gPlacar })[subR]();
};
const recarregarR = () => abrirRetiro(subR);
const salvarCom = (fn, args, msg) => async () => {
  try { await rpc(fn, Object.assign({ p_token: sessao.token }, args())); fecharModal(); toast(msg); recarregarR(); }
  catch (e) { mostrarErro(e.message); }
};
const rodape = (id, txt) => `<div id="t-erro" class="erro hidden"></div><button class="btn amarelo" id="${id}">${txt}</button><button class="btn claro" onclick="fecharModal()">Cancelar</button>`;
function confirmar(titulo, texto, fn){
  abrirModal(`<h3>${titulo}</h3><p>${texto}</p><div id="t-erro" class="erro hidden"></div>
    <button class="btn" id="cf-ok">Confirmar</button><button class="btn claro" onclick="fecharModal()">Cancelar</button>`);
  $("#cf-ok").onclick = async () => { try { await fn(); fecharModal(); recarregarR(); } catch (e) { mostrarErro(e.message); } };
}
function abrirTelao(html, tipo){
  let t = $("#telao"); if (!t) { t = document.createElement("div"); t.id = "telao"; t.className = "telao"; document.body.appendChild(t); }
  telaoAberto = tipo || "fixo";
  t.innerHTML = `<button class="fechar" id="tl-x">Fechar ✕</button><div style="width:100%;max-width:1100px" id="tl-c">${html}</div>`;
  t.classList.remove("hidden");
  $("#tl-x").onclick = () => { t.classList.add("hidden"); telaoAberto = null;
    try { if (document.fullscreenElement) document.exitFullscreen().catch(()=>{}); } catch (e) {} };
  try { t.requestFullscreen && t.requestFullscreen().catch(()=>{}); } catch (e) {}
}

/* ---------- Programação ---------- */
const doisDig = n => String(n).padStart(2, "0");
const isoLocal = d => { const x = new Date(d); return { data: `${x.getFullYear()}-${doisDig(x.getMonth()+1)}-${doisDig(x.getDate())}`, hora: `${doisDig(x.getHours())}:${doisDig(x.getMinutes())}` }; };
async function gProgramacao(){
  const l = await rpc("programacao", { p_token: sessao.token });
  const dias = [...new Set(l.map(a => diaChave(a.inicio)))];
  $("#r-c").innerHTML = `<button class="btn amarelo" id="pg-novo">+ Nova atividade</button>` + (l.length ? dias.map(d => `<h2>${diaNome(d)}</h2><div class="lista">${
    l.filter(a => diaChave(a.inicio) === d).map(a => `<div class="ativ"><div class="hora">${hm(a.inicio)}<small>${a.fim ? "até " + hm(a.fim) : ""}</small></div>
      <div style="flex:1;min-width:0"><div style="font-weight:800">${esc(a.titulo)}</div>
      <div class="sub">${TIPOS[a.tipo]}${a.local ? " · " + esc(a.local) : ""} · check-in ${a.checkin_valor ? agTxt(a.checkin_valor) + " até " + a.tolerancia_min + " min" : "sem α$"}</div>
      <div class="acao" style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="mini es" data-qr="${a.id}">QR check-in</button>
        <button class="mini cl" data-pr="${a.id}">Presenças (${a.presentes})</button>
        <button class="mini cl" data-ed="${a.id}">Editar</button></div></div></div>`).join("")}</div>`).join("")
    : vazio("Nenhuma atividade cadastrada. Comece pela programação do primeiro dia."));
  $("#pg-novo").onclick = () => formAtividade();
  $$("#r-c [data-ed]").forEach(b => b.onclick = () => formAtividade(l.find(a => a.id == b.dataset.ed)));
  $$("#r-c [data-qr]").forEach(b => b.onclick = () => { const a = l.find(x => x.id == b.dataset.qr);
    abrirTelao(`<span class="etq am" style="font-size:16px;padding:6px 14px">CHECK-IN · ${agTxt(a.checkin_valor)}</span>
      <h1 style="margin-top:14px">${esc(a.titulo)}</h1><p style="font-size:clamp(16px,2.2vw,24px);color:#E9DCCF;margin:0">${hm(a.inicio)}${a.local ? " · " + esc(a.local) : ""}</p>
      <div class="qr-caixa" style="margin:22px auto">${qrSvg("AGAPIX-CHECKIN:" + a.codigo)}</div>
      <p style="font-size:clamp(15px,2vw,22px);color:#E9DCCF">Abra o Banco Ágape → Agenda → Escanear QR de check-in</p>`); });
  $$("#r-c [data-pr]").forEach(b => b.onclick = async () => { const a = l.find(x => x.id == b.dataset.pr);
    try { const r = await rpc("ger_presencas", { p_token: sessao.token, p_atividade: a.id });
      abrirModal(`<h3>${esc(a.titulo)}</h3><p><b>${r.presentes.length}</b> presentes · <b>${r.ausentes.length}</b> ainda não fizeram check-in</p>
        <h2>Presentes</h2><div class="lista">${r.presentes.map(p => `<div class="item"><div class="meio"><div class="t1">${esc(p.nome)}</div>
          <div class="t2">${p.grupo ? esc(p.grupo) + " · " : ""}${hm(p.criado_em)}</div></div>${p.pontual ? '<span class="etq ve">na hora</span>' : '<span class="etq">atrasado</span>'}</div>`).join("") || '<div class="vazio">Ninguém ainda.</div>'}</div>
        <h2>Faltando</h2><div class="lista">${r.ausentes.map(p => `<div class="item"><div class="meio"><div class="t1">${esc(p.nome)}</div><div class="t2">${esc(p.grupo||"")}</div></div></div>`).join("") || '<div class="vazio">Todo mundo veio!</div>'}</div>
        <button class="btn claro" onclick="fecharModal()">Fechar</button>`);
    } catch (e) { erroModal(e); } });
}
function formAtividade(a){
  const ini = a ? isoLocal(a.inicio) : { data: isoLocal(Date.now()).data, hora: "" }, fim = a && a.fim ? isoLocal(a.fim) : null;
  abrirModal(`<h3>${a ? "Editar atividade" : "Nova atividade"}</h3>
    <label>Nome</label><input id="fa-t" maxlength="80" value="${esc(a?.titulo||"")}" placeholder="ex.: Palestra: Reconectados com Deus">
    <div class="linha2"><div><label>Tipo</label><select id="fa-tp">${Object.entries(TIPOS).map(([k,t]) => `<option value="${k}" ${a?.tipo===k?"selected":""}>${t}</option>`).join("")}</select></div>
    <div><label>Local</label><input id="fa-l" maxlength="60" value="${esc(a?.local||"")}" placeholder="Salão principal"></div></div>
    <label>Dia</label><input id="fa-d" type="date" value="${ini.data}">
    <div class="linha2"><div><label>Início</label><input id="fa-i" type="time" value="${ini.hora}"></div><div><label>Fim (opcional)</label><input id="fa-f" type="time" value="${fim ? fim.hora : ""}"></div></div>
    <div class="linha2"><div><label>Check-in vale (α$)</label><input id="fa-v" type="number" min="0" inputmode="numeric" value="${a ? a.checkin_valor : 10}"></div>
    <div><label>Tolerância (min)</label><input id="fa-tol" type="number" min="0" inputmode="numeric" value="${a ? a.tolerancia_min : 10}"></div></div>
    <p style="font-size:12.5px">O check-in abre 15 min antes. Quem escanear até a tolerância ganha os α$; depois disso só conta presença.</p>
    <label>Descrição (opcional)</label><input id="fa-ds" maxlength="200" value="${esc(a?.descricao||"")}">
    ${a ? '<button class="link" id="fa-del" style="margin-top:10px">Excluir atividade</button>' : ""}
    ${rodape("fa-ok", "Salvar")}`);
  $("#fa-ok").onclick = salvarCom("ger_salvar_atividade", () => {
    const d = val("#fa-d"), i = val("#fa-i"), f = val("#fa-f");
    if (!d || !i) throw new Error("Informe o dia e o horário de início.");
    return { p_id: a ? a.id : null, p_titulo: val("#fa-t"), p_local: val("#fa-l"), p_tipo: val("#fa-tp"), p_descricao: val("#fa-ds"),
      p_inicio: new Date(`${d}T${i}`).toISOString(), p_fim: f ? new Date(`${d}T${f}`).toISOString() : null,
      p_checkin_valor: Number(val("#fa-v")||0), p_tolerancia_min: Number(val("#fa-tol")||0) };
  }, a ? "Atividade atualizada" : "Atividade criada");
  if (a) $("#fa-del").onclick = () => confirmar("Excluir atividade?", `"${esc(a.titulo)}" e as presenças dela serão apagadas.`,
    () => rpc("ger_excluir_atividade", { p_token: sessao.token, p_id: a.id }));
}

/* ---------- Desafios ---------- */
async function gDesafios(){
  const r = await rpc("ger_desafios", { p_token: sessao.token });
  $("#r-c").innerHTML = (r.pendentes.length ? `<h2 style="margin-top:6px">Para aprovar <span class="etq am">${r.pendentes.length}</span></h2>` + r.pendentes.map(p => `
      <div class="bloco"><b>${esc(p.nome)}</b> <span style="color:var(--cinza);font-size:13px">${esc(p.grupo||"")}</span>
      <p style="color:var(--cafe);font-weight:700">${esc(p.desafio)} · ${agTxt(p.valor)}</p>${p.comentario ? `<p>"${esc(p.comentario)}"</p>` : ""}
      <div class="linha2" style="margin-top:6px"><button class="mini cl" data-av="${p.id}" data-ok="0">Recusar</button><button class="mini" data-av="${p.id}" data-ok="1">Aprovar e pagar</button></div></div>`).join("") : "")
    + `<button class="btn amarelo" id="dz-novo">+ Novo desafio</button>`
    + (r.desafios.length ? `<h2>Desafios</h2>` + r.desafios.map(d => `<div class="bloco" style="${d.ativo?"":"opacity:.6"}">
      <div style="display:flex;justify-content:space-between;gap:8px"><h4>${esc(d.titulo)}</h4><span class="etq am">${agTxt(d.valor)}</span></div>
      ${d.descricao ? `<p>${esc(d.descricao)}</p>` : ""}
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px">
        <span style="font-size:13px;color:var(--marrom);font-weight:700">${d.cumpridos} cumpriram${d.pendentes ? ` · ${d.pendentes} aguardando` : ""} · ${d.precisa_aprovacao ? "com aprovação" : "automático"}${d.ativo ? "" : " · desativado"}</span>
        <button class="mini cl" data-ed="${d.id}">Editar</button></div></div>`).join("") : vazio("Crie o primeiro desafio. Ex.: “Ore por alguém da outra equipe”."));
  $$("#r-c [data-av]").forEach(b => b.onclick = async () => {
    try { await rpc("ger_avaliar_desafio", { p_token: sessao.token, p_resposta: Number(b.dataset.av), p_aprovar: b.dataset.ok === "1" });
      toast(b.dataset.ok === "1" ? "Aprovado e pago ✔" : "Recusado"); recarregarR(); } catch (e) { toast(e.message); } });
  $("#dz-novo").onclick = () => formDesafio();
  $$("#r-c [data-ed]").forEach(b => b.onclick = () => formDesafio(r.desafios.find(d => d.id == b.dataset.ed)));
}
function formDesafio(d){
  abrirModal(`<h3>${d ? "Editar desafio" : "Novo desafio"}</h3>
    <label>Desafio</label><input id="fd-t" maxlength="80" value="${esc(d?.titulo||"")}" placeholder="ex.: Leia o Salmo 23">
    <label>Explicação (opcional)</label><input id="fd-d" maxlength="200" value="${esc(d?.descricao||"")}">
    <div class="linha2"><div><label>Vale (α$)</label><input id="fd-v" type="number" min="0" inputmode="numeric" value="${d ? d.valor : 10}"></div>
    <div><label>Pagamento</label><select id="fd-a"><option value="1">Eu aprovo antes</option><option value="0" ${d && !d.precisa_aprovacao ? "selected" : ""}>Automático</option></select></div></div>
    ${d ? `<label>Situação</label><select id="fd-at"><option value="1">Ativo</option><option value="0" ${d.ativo ? "" : "selected"}>Desativado</option></select>` : ""}
    ${rodape("fd-ok", "Salvar")}`);
  $("#fd-ok").onclick = salvarCom("ger_salvar_desafio", () => ({ p_id: d ? d.id : null, p_titulo: val("#fd-t"), p_descricao: val("#fd-d"),
    p_valor: Number(val("#fd-v")||0), p_precisa_aprovacao: val("#fd-a") === "1", p_ativo: d ? val("#fd-at") === "1" : true }), "Desafio salvo");
}

/* ---------- Meditações ---------- */
async function gMeditacoes(){
  const l = await rpc("ger_meditacoes", { p_token: sessao.token });
  $("#r-c").innerHTML = `<button class="btn amarelo" id="md-novo">+ Meditação</button>` + (l.length ? l.map(m => `<div class="bloco">
      <div style="display:flex;justify-content:space-between;gap:8px"><span class="etq ${m.liberada?"ve":""}">${diaNome(m.dia)} · ${m.liberada ? "liberada" : "libera às " + m.liberar_em}</span>
      <button class="mini cl" data-ed="${m.dia}">Editar</button></div>
      <h4 style="margin-top:8px">${esc(m.referencia)}</h4>${m.texto_biblico ? `<p style="font-style:italic">${esc(m.texto_biblico)}</p>` : ""}</div>`).join("")
    : vazio("Cadastre a meditação de cada dia do retiro. Ela aparece para todos no horário que você escolher."));
  $("#md-novo").onclick = () => formMeditacao();
  $$("#r-c [data-ed]").forEach(b => b.onclick = () => formMeditacao(l.find(m => m.dia === b.dataset.ed)));
}
function formMeditacao(m){
  abrirModal(`<h3>${m ? "Editar meditação" : "Nova meditação"}</h3>
    <div class="linha2"><div><label>Dia</label><input id="fm-d" type="date" value="${m ? m.dia : isoLocal(Date.now()).data}" ${m ? "disabled" : ""}></div>
    <div><label>Libera às</label><input id="fm-h" type="time" value="${m ? m.liberar_em : "06:00"}"></div></div>
    <label>Referência bíblica</label><input id="fm-r" maxlength="60" value="${esc(m?.referencia||"")}" placeholder="ex.: João 15:5">
    <label>Texto bíblico</label><textarea id="fm-t" maxlength="1500">${esc(m?.texto_biblico||"")}</textarea>
    <label>Reflexão</label><textarea id="fm-x" maxlength="3000" style="min-height:150px">${esc(m?.reflexao||"")}</textarea>
    ${m ? '<button class="link" id="fm-del" style="margin-top:10px">Excluir</button>' : ""}
    ${rodape("fm-ok", "Salvar")}`);
  $("#fm-ok").onclick = salvarCom("ger_salvar_meditacao", () => ({ p_dia: val("#fm-d"), p_referencia: val("#fm-r"), p_texto: val("#fm-t"), p_reflexao: val("#fm-x"), p_liberar_em: val("#fm-h") }), "Meditação salva");
  if (m) $("#fm-del").onclick = () => confirmar("Excluir meditação?", diaNome(m.dia), () => rpc("ger_excluir_meditacao", { p_token: sessao.token, p_dia: m.dia }));
}

/* ---------- Quiz ---------- */
async function gQuiz(){
  const l = await rpc("ger_quiz", { p_token: sessao.token });
  const st = q => q.aberta ? `<span class="etq am">aberta · ${restante(q.aberta_ate)}</span>` : q.aberta_ate ? `<span class="etq">encerrada</span>` : `<span class="etq ca">não liberada</span>`;
  $("#r-c").innerHTML = `<div class="bloco" style="background:var(--cafe);color:#fff;border:0"><h4>Rodada relâmpago</h4>
      <p style="color:#E9DCCF">Marque as perguntas e libere. Todos recebem notificação e têm o tempo escolhido para responder.</p>
      <div class="linha2" style="margin-top:8px"><select id="qz-min"><option value="2">2 minutos</option><option value="5" selected>5 minutos</option><option value="10">10 minutos</option><option value="15">15 minutos</option><option value="30">30 minutos</option></select>
      <button class="btn amarelo" id="qz-lib" style="margin-top:0">Liberar</button></div></div>
    <button class="btn claro" id="qz-novo">+ Nova pergunta</button>`
    + (l.length ? l.map(q => `<div class="bloco"><label style="display:flex;gap:10px;align-items:flex-start;margin:0;font-size:15px;color:var(--cafe)">
        <input type="checkbox" data-sel="${q.id}" style="width:22px;height:22px;flex:none;margin-top:2px" ${!q.aberta_ate ? "checked" : ""}><span>${esc(q.pergunta)}</span></label>
        <p style="font-size:13px">Certa: <b>${esc(q.opcoes[q.correta])}</b> · ${agTxt(q.valor)}</p>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;gap:8px">${st(q)}
          <span style="font-size:13px;color:var(--marrom);font-weight:700">${q.acertos}/${q.respostas} acertos</span>
          <button class="mini cl" data-ed="${q.id}">Editar</button></div></div>`).join("") : vazio("Cadastre as perguntas antes do retiro e libere nos intervalos."));
  $("#qz-novo").onclick = () => formPergunta();
  $$("#r-c [data-ed]").forEach(b => b.onclick = () => formPergunta(l.find(q => q.id == b.dataset.ed)));
  $("#qz-lib").onclick = () => {
    const ids = $$("#r-c [data-sel]").filter(c => c.checked).map(c => Number(c.dataset.sel));
    if (!ids.length) return toast("Marque as perguntas da rodada.");
    confirmar("Liberar rodada relâmpago?", `${ids.length} pergunta(s) por ${val("#qz-min")} minutos. Todos os participantes serão avisados.`,
      () => rpc("ger_liberar_rodada", { p_token: sessao.token, p_perguntas: ids, p_minutos: Number(val("#qz-min")) }).then(() => toast("Rodada liberada!")));
  };
}
function formPergunta(q){
  const ops = q ? q.opcoes : ["", "", "", ""];
  abrirModal(`<h3>${q ? "Editar pergunta" : "Nova pergunta"}</h3>
    <label>Pergunta</label><textarea id="fq-p" maxlength="300" style="min-height:80px">${esc(q?.pergunta||"")}</textarea>
    <label>Alternativas (marque a certa)</label>
    ${[0,1,2,3].map(i => `<div style="display:flex;gap:10px;align-items:center;margin-top:8px"><input type="radio" name="fq-c" value="${i}" style="width:22px;height:22px;flex:none" ${q && q.correta===i ? "checked" : !q && i===0 ? "checked" : ""}>
      <input class="fq-o" maxlength="120" placeholder="${String.fromCharCode(65+i)}) ${i>1 ? "(opcional)" : ""}" value="${esc(ops[i]||"")}"></div>`).join("")}
    <label>Vale (α$)</label><input id="fq-v" type="number" min="0" inputmode="numeric" value="${q ? q.valor : 5}">
    ${q ? '<button class="link" id="fq-del" style="margin-top:10px">Excluir pergunta</button>' : ""}
    ${rodape("fq-ok", "Salvar")}`);
  $("#fq-ok").onclick = salvarCom("ger_salvar_pergunta", () => {
    const todas = $$(".fq-o").map(i => i.value.trim()); const marcada = Number($('input[name="fq-c"]:checked').value);
    if (!todas[marcada]) throw new Error("A alternativa marcada como certa está vazia.");
    const opcoes = [], mapa = {}; todas.forEach((t, i) => { if (t) { mapa[i] = opcoes.length; opcoes.push(t); } });
    return { p_id: q ? q.id : null, p_pergunta: val("#fq-p"), p_opcoes: opcoes, p_correta: mapa[marcada], p_valor: Number(val("#fq-v")||0) };
  }, "Pergunta salva");
  if (q) $("#fq-del").onclick = () => confirmar("Excluir pergunta?", esc(q.pergunta), () => rpc("ger_excluir_pergunta", { p_token: sessao.token, p_id: q.id }));
}

/* ---------- Enquetes ---------- */
async function gEnquetes(){
  const l = await rpc("ger_enquetes", { p_token: sessao.token });
  const resultado = e => {
    const cont = {}; (e.contagem||[]).forEach(c => cont[c.resposta] = c.qtd);
    const itens = e.tipo === "estrelas" ? [5,4,3,2,1].map(n => ["★".repeat(n), cont[n]||0]) : e.opcoes.map((o, i) => [o, cont[i]||0]);
    const max = Math.max(1, ...itens.map(i => i[1]));
    return (e.tipo === "estrelas" && e.media ? `<p style="font-size:22px;font-weight:900;color:var(--cafe)">${String(e.media).replace(".", ",")} <span style="color:#C9951C">★</span> <span style="font-size:13px;color:var(--cinza)">média</span></p>` : "")
      + itens.map(([t, n]) => `<div class="barra"><div class="t"><div><span style="font-size:14px">${esc(t)}</span><span style="font-size:14px">${n}</span></div>
        <div class="b" style="height:10px"><i style="width:${Math.round(100*n/max)}%"></i></div></div></div>`).join("")
      + (e.comentarios && e.comentarios.length ? `<details style="margin-top:8px"><summary style="font-weight:800;cursor:pointer">${e.comentarios.length} comentário(s)</summary>
        ${e.comentarios.map(c => `<p style="border-left:3px solid var(--mostarda);padding-left:10px">${esc(c)}</p>`).join("")}</details>` : "");
  };
  $("#r-c").innerHTML = `<button class="btn amarelo" id="en-novo">+ Nova enquete</button>` + (l.length ? l.map(e => `<div class="bloco">
      <div style="display:flex;justify-content:space-between;gap:8px"><h4>${esc(e.pergunta)}</h4><span class="etq ${e.aberta?"am":""}">${e.aberta ? "aberta" : "encerrada"}</span></div>
      <p style="font-size:13px">${e.respostas} resposta(s) · vale ${agTxt(e.valor)}</p>${resultado(e)}
      ${e.aberta ? `<button class="mini cl" style="margin-top:10px" data-fim="${e.id}">Encerrar enquete</button>` : ""}</div>`).join("")
    : vazio("Crie uma enquete. Ex.: “O que achou da palestra de hoje?”"));
  $("#en-novo").onclick = () => {
    abrirModal(`<h3>Nova enquete</h3>
      <label>Pergunta</label><input id="fe-p" maxlength="140" placeholder="O que achou da palestra de hoje?">
      <div class="linha2"><div><label>Tipo de resposta</label><select id="fe-t"><option value="estrelas">Estrelas (1 a 5)</option><option value="opcoes">Opções</option></select></div>
      <div><label>Vale (α$)</label><input id="fe-v" type="number" min="0" inputmode="numeric" value="5"></div></div>
      <div id="fe-ops" class="hidden"><label>Opções (uma por linha)</label><textarea id="fe-o" placeholder="Sim\nNão\nMais ou menos"></textarea></div>
      <p style="font-size:12.5px">Todos recebem notificação. Quem responder ganha os α$ na hora.</p>
      ${rodape("fe-ok", "Publicar enquete")}`);
    $("#fe-t").onchange = () => $("#fe-ops").classList.toggle("hidden", val("#fe-t") !== "opcoes");
    $("#fe-ok").onclick = salvarCom("ger_criar_enquete", () => ({ p_pergunta: val("#fe-p"), p_tipo: val("#fe-t"),
      p_opcoes: val("#fe-t") === "opcoes" ? val("#fe-o").split("\n").map(x => x.trim()).filter(Boolean) : null, p_valor: Number(val("#fe-v")||0) }), "Enquete publicada");
  };
  $$("#r-c [data-fim]").forEach(b => b.onclick = () => confirmar("Encerrar enquete?", "Ninguém mais poderá responder.",
    () => rpc("ger_encerrar_enquete", { p_token: sessao.token, p_id: Number(b.dataset.fim) })));
}

/* ---------- Leilão ---------- */
async function gLeilao(){
  const l = await rpc("leilao", { p_token: sessao.token });
  $("#r-c").innerHTML = `<p style="color:var(--marrom);margin:4px 2px 0">Os participantes veem este catálogo na aba Leilão, com quanto falta para cada item.</p>
    <button class="btn amarelo" id="lt-novo">+ Novo item</button>` + (l.length ? `<div class="lista" style="margin-top:12px">${l.map(i => `<div class="item">
      <div style="width:56px;height:56px;border-radius:10px;flex:none;background:#E7DDD0 center/cover;${i.foto ? `background-image:url('${i.foto}')` : ""}"></div>
      <div class="meio"><div class="t1">${esc(i.titulo)}</div><div class="t2">lance mínimo ${agTxt(i.lance_minimo)}</div></div>
      <button class="mini cl" data-ed="${i.id}">Editar</button></div>`).join("")}</div>` : vazio("Cadastre os itens com foto para a galera ir juntando α$."));
  $("#lt-novo").onclick = () => formItem();
  $$("#r-c [data-ed]").forEach(b => b.onclick = () => formItem(l.find(i => i.id == b.dataset.ed)));
}
async function reduzirFoto(arquivo){
  const img = await createImageBitmap(arquivo); const k = Math.min(1, 900 / Math.max(img.width, img.height));
  const c = document.createElement("canvas"); c.width = Math.round(img.width*k); c.height = Math.round(img.height*k);
  c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); return c.toDataURL("image/jpeg", 0.72);
}
function formItem(i){
  let foto = null;
  abrirModal(`<h3>${i ? "Editar item" : "Novo item do leilão"}</h3>
    <label class="item-leilao" style="display:block;cursor:pointer;margin-top:10px"><div class="foto" id="fi-prev" ${i && i.foto ? `style="background-image:url('${i.foto}')"` : ""}>${i && i.foto ? "" : IC.foto}</div>
      <div style="padding:10px;text-align:center;font-weight:800;color:var(--marrom)">${i && i.foto ? "Trocar foto" : "Escolher foto"}</div>
      <input type="file" accept="image/*" id="fi-f" class="hidden"></label>
    <label>Nome do item</label><input id="fi-t" maxlength="80" value="${esc(i?.titulo||"")}" placeholder="ex.: Bíblia de estudo">
    <label>Descrição (opcional)</label><input id="fi-d" maxlength="200" value="${esc(i?.descricao||"")}">
    <label>Lance mínimo (α$)</label><input id="fi-v" type="number" min="0" inputmode="numeric" value="${i ? i.lance_minimo : 50}">
    ${i ? '<button class="link" id="fi-del" style="margin-top:10px">Excluir item</button>' : ""}
    ${rodape("fi-ok", "Salvar")}`);
  $("#fi-f").onchange = async e => { const f = e.target.files[0]; if (!f) return;
    try { foto = await reduzirFoto(f); const p = $("#fi-prev"); p.style.backgroundImage = `url('${foto}')`; p.innerHTML = ""; } catch (x) { toast("Não consegui abrir essa foto."); } };
  $("#fi-ok").onclick = salvarCom("ger_salvar_item", () => ({ p_id: i ? i.id : null, p_titulo: val("#fi-t"), p_descricao: val("#fi-d"), p_lance_minimo: Number(val("#fi-v")||0), p_foto: foto }), "Item salvo");
  if (i) $("#fi-del").onclick = () => confirmar("Excluir item?", esc(i.titulo), () => rpc("ger_excluir_item", { p_token: sessao.token, p_id: i.id }));
}

/* ---------- Mural (moderação) ---------- */
async function gOracao(){
  const l = await rpc("mural", { p_token: sessao.token });
  $("#r-c").innerHTML = `<p style="color:var(--marrom);margin:4px 2px 0">Pedidos anônimos continuam anônimos também para o gerente. Se algum pedido for inadequado, você pode ocultá-lo.</p>`
    + (l.length ? l.map(o => `<div class="bloco"><div style="display:flex;justify-content:space-between;gap:8px"><b style="font-size:14px">${o.anonimo ? "Anônimo" : esc(o.autor)}</b>
      <small style="color:var(--cinza)">${quando(o.criado_em)}</small></div><p style="color:var(--cafe);white-space:pre-wrap">${esc(o.texto)}</p>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px"><span style="font-size:13px;font-weight:700;color:var(--marrom)">${o.orando} orando</span>
      <button class="mini cl" data-oc="${o.id}">Ocultar</button></div></div>`).join("") : vazio("Nenhum pedido ainda."));
  $$("#r-c [data-oc]").forEach(b => b.onclick = () => confirmar("Ocultar pedido?", "Ele deixa de aparecer no mural de todos.",
    () => rpc("ger_ocultar_oracao", { p_token: sessao.token, p_oracao: Number(b.dataset.oc) })));
}

/* ---------- Placar / telão ---------- */
async function gPlacar(){
  const r = await rpc("placar", { p_token: sessao.token });
  $("#r-c").innerHTML = `<button class="btn amarelo" id="pl-telao" style="display:flex;align-items:center;justify-content:center;gap:8px"><span style="width:20px;height:20px;display:inline-flex">${IC.telao}</span>Abrir no telão</button>
    <div class="bloco">${r.equipes.length ? barrasPlacar(r.equipes, null) : "<p>Cadastre as pessoas com equipe para o placar aparecer.</p>"}</div>
    <p style="font-size:13px;color:var(--cinza);text-align:center">Dica: espelhe a tela do celular no projetor. O telão se atualiza sozinho.</p>`;
  $("#pl-telao").onclick = () => { abrirTelao("", "placar"); desenharTelao(); };
}
async function desenharTelao(){
  if (telaoAberto !== "placar") return;
  try { const r = await rpc("placar", { p_token: sessao.token }); const c = $("#tl-c"); if (!c) return;
    c.innerHTML = `<div class="olho" style="font-size:clamp(13px,1.6vw,18px)">Retiro espiritual Reconectados 2027</div>
      <h1 style="margin:10px 0 26px">Placar das equipes</h1><div style="text-align:left">${barrasPlacar(r.equipes, null)}</div>
      <p style="color:#E9DCCF;margin-top:20px">Atualizado às ${hm(r.atualizado)}</p>`;
  } catch (e) {}
}
}
