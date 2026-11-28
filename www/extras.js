/* =====================================================================
   Banco Ágape — EXTRAS
   Cartão do cliente, cobrar por QR, som ao receber, tema da noite,
   tutorial, fila sem internet, recibo/desfazer pagamento, painel por hora,
   configurações, subgerente, cadastro em lote, cartões para imprimir,
   backup, ranking, metas e retrospectiva.
   ===================================================================== */
{
const nativo = () => !!(window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform() && Capacitor.Plugins.Share && Capacitor.Plugins.Filesystem);
const pad4 = n => String(n || 0).padStart(4, "0");
const hora = d => new Date(d).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const css = document.createElement("style");
css.textContent = `
.cartao-flip{perspective:1200px;width:100%;max-width:360px;aspect-ratio:1.586;margin:8px auto 4px;cursor:pointer}
.cartao-flip .in{position:relative;width:100%;height:100%;transition:transform .7s cubic-bezier(.3,1.3,.5,1);transform-style:preserve-3d}
.cartao-flip.virado .in{transform:rotateY(180deg)}
.cartao-flip .face{position:absolute;inset:0;border-radius:18px;backface-visibility:hidden;-webkit-backface-visibility:hidden;overflow:hidden;box-shadow:0 18px 30px -14px rgba(0,0,0,.6)}
.cartao-flip .frente{background:linear-gradient(135deg,#6B4732 0%,#4A3024 45%,#2F1D14 100%);color:#fff;padding:18px 20px}
.cartao-flip .frente:before{content:"";position:absolute;right:-60px;top:-70px;width:230px;height:230px;border-radius:50%;background:radial-gradient(circle,rgba(245,194,63,.28),rgba(245,194,63,0) 70%)}
.cartao-flip .frente:after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(115deg,rgba(255,255,255,.035) 0 2px,transparent 2px 9px)}
.cartao-flip .verso{transform:rotateY(180deg);background:#FBF6EE;display:flex;align-items:center;justify-content:center;gap:14px;padding:14px;color:#4A3024}
.cf-topo{display:flex;justify-content:space-between;align-items:center;position:relative;z-index:1}
.cf-marca{display:flex;align-items:center;gap:8px;font-weight:900;letter-spacing:.8px;font-size:14px}
.cf-marca svg{width:24px;height:24px}
.cf-moeda{font-weight:900;font-size:22px;color:#F5C23F}
.cf-chip{position:relative;z-index:1;width:44px;height:34px;border-radius:7px;margin-top:16px;background:linear-gradient(135deg,#FFE08A,#D9A227);box-shadow:inset 0 0 0 1px rgba(0,0,0,.2)}
.cf-chip:before{content:"";position:absolute;inset:8px 6px;border:1.5px solid rgba(74,48,36,.45);border-radius:4px}
.cf-num{position:relative;z-index:1;font-family:ui-monospace,Menlo,monospace;font-size:clamp(17px,5.4vw,21px);letter-spacing:3px;margin-top:12px;text-shadow:0 1px 0 rgba(0,0,0,.4)}
.cf-baixo{position:absolute;left:20px;right:20px;bottom:16px;display:flex;justify-content:space-between;align-items:flex-end;z-index:1}
.cf-baixo small{display:block;font-size:9.5px;letter-spacing:1.2px;color:#E9DCCF;font-weight:700}
.cf-baixo b{display:block;font-size:15px;font-weight:800;max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cartao-flip .verso .qr{width:46%;background:#fff;border-radius:10px;padding:6px;border:2px solid #F5C23F}
.cartao-flip .verso .qr svg{width:100%;height:auto;display:block}
.dica-virar{text-align:center;font-size:12.5px;color:var(--cinza);margin:6px 0 0}
.tuto{text-align:center;padding:6px 4px}
.tuto .ilu{width:120px;height:120px;border-radius:50%;margin:6px auto 14px;display:grid;place-items:center;background:var(--cafe);color:var(--mostarda)}
.tuto .ilu svg{width:58px;height:58px}
.tuto h3{font-size:22px}
.pontos{display:flex;gap:6px;justify-content:center;margin:12px 0 4px}
.pontos i{width:8px;height:8px;border-radius:50%;background:var(--linha)}.pontos i.on{background:var(--cafe);width:22px;border-radius:9px}
.lote-item{display:flex;gap:10px;align-items:center;padding:12px 14px;border-bottom:1px solid var(--linha)}
.lote-item:last-child{border-bottom:0}
.grafico-horas{position:relative;height:190px;margin-top:8px}
.grafico-horas svg{position:absolute;inset:0;width:100%;height:100%}
.legenda{display:flex;gap:14px;flex-wrap:wrap;font-size:12px;font-weight:700;color:var(--marrom);margin-top:6px}
.legenda i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:5px;vertical-align:-1px}
.cfg-linha{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--linha)}
.cfg-linha:last-child{border-bottom:0}
.cfg-linha b{display:block;font-size:15px}.cfg-linha small{display:block;font-size:12.5px;color:var(--cinza)}
.cfg-linha input[type=number]{width:96px;text-align:right}
.retro-img{display:block;width:100%;max-width:330px;margin:10px auto;border-radius:16px;box-shadow:var(--sombra)}
body.sub #abas-g [data-aba="clientes"], body.sub #abas-g [data-aba="extrato"], body.sub #g-modo [data-modo="retirar"],
body.sub .so-gerente, body.sub #pg-novo, body.sub #r-c [data-ed]{display:none!important}
body.sub #abas-g .in{grid-template-columns:repeat(3,1fr)}
/* ---------- tema da noite ---------- */
html.noite{--papel:#1E1612;--creme:#2A201A;--linha:#3D3028;--cafe:#F3E9DC;--marrom:#D9C8B4;--marrom2:#C9B59E;--cinza:#A8968A;--verde:#7FC694}
html.noite body{background-color:#1E1612;background-image:radial-gradient(rgba(255,255,255,.035) 1px,transparent 1px)}
html.noite input,html.noite select,html.noite textarea{background:#1E1612;color:#F3E9DC;border-color:#3D3028}
html.noite .topo,html.noite .cartao,html.noite #tela-login,html.noite .telao{background:#2F1D14}
html.noite .topo,html.noite .cartao,html.noite .telao{color:#F3E9DC}
html.noite .cartao .rot{color:var(--mostarda)}
html.noite .item.eu{background:#3A2C1F!important}
html.noite .resumo div,html.noite .kpi{background:var(--creme)}
html.noite .btn{background:#4A3024;color:var(--mostarda);box-shadow:0 3px 0 #120c09}
html.noite .btn.amarelo{background:var(--mostarda);color:#2F1D14}
html.noite .btn.claro{background:transparent;color:#F3E9DC}
html.noite .tipo{background:#1E1612;color:#F3E9DC}
html.noite .tipo.on{background:#4A3024}
html.noite .acoes-banco span,html.noite .pessoa .ini,html.noite .tuto .ilu{background:#4A3024}
html.noite .seg,html.noite .alterna{background:#3D3028}
html.noite .seg button.on{background:var(--mostarda);color:#2F1D14}
html.noite .alterna button.on{background:#2A201A}
html.noite .opcao,html.noite .chip,html.noite .estrelas button{background:#1E1612;color:#F3E9DC}
html.noite .chip.on{color:#2F1D14}
html.noite .pessoa.sel,html.noite .notif.nova,html.noite .bloco[style*="FFF6DF"]{background:#3A2C1F!important}
html.noite .qr-caixa{background:#fff}
html.noite .etq{background:#3D3028;color:#E9DCCF}
html.noite .etq.am{background:var(--mostarda);color:#2F1D14}
html.noite .bola.mais,html.noite .ic.credito,html.noite .ic.recebido{background:#24362A}
html.noite .bola.menos{background:#3D3028}
html.noite .erro{background:#3A2C1F;color:#F3E9DC}
html.noite .medalha .m,html.noite .prog,html.noite .barra .b{background:#3D3028}
html.noite .barra .b i{background:var(--mostarda)}
html.noite .item-leilao .foto{background-color:#3D3028}
html.noite .cartao-flip .verso{background:#FBF6EE;color:#4A3024}
html.noite .icone-btn{color:#F3E9DC;background:rgba(255,255,255,.1)}
html.noite .opcao.certa{background:#24362A;border-color:#7FC694;color:#F3E9DC}
html.noite .opcao.errada{background:#3D2A22;border-color:#C9B59E;color:#F3E9DC}
html.noite .estrelas button.on{background:#3A2C1F;color:var(--mostarda)}
html.noite .etq.ve{background:#24362A;color:#A8E2B8}
html.noite .etq.ca{background:#F5C23F;color:#2F1D14}
html.noite .alterna button{color:#D9C8B4}
html.noite .alterna button.on{background:#4A3024;color:#FFFFFF}
html.noite .alterna button.on.ret{background:var(--mostarda);color:#2F1D14}
html.noite .seg button{color:#D9C8B4}
html.noite .tipo.on .ti{color:#2F1D14}
html.noite .card-r{color:#F3E9DC}
html.noite .mini.cl{background:#3D3028;color:#F3E9DC}
html.noite .mini.es{background:var(--mostarda);color:#2F1D14}
html.noite .link{color:#E9DCCF}
html.noite .abas button{color:#A8968A}
html.noite .abas button.ativa{color:#F3E9DC}
html.noite .lembrar{color:#F3E9DC}
html.noite .foto-anexo{background-color:#1E1612;color:#E9DCCF}
html.noite .resumo small,html.noite .kpi small{color:#C9B59E}
html.noite select option{background:#2A201A;color:#F3E9DC}
html.noite .voltar{color:#F3E9DC}
`;
document.head.appendChild(css);

/* ---------------- Som do Agapix ao receber (sempre ligado) ---------------- */
let somAgapix = null;
const destravar = () => { try { if (!somAgapix) { somAgapix = new Audio("sons/agapix.wav?v=2"); somAgapix.preload = "auto"; somAgapix.load(); } } catch (e) {} };
["pointerdown", "keydown", "touchstart"].forEach(ev => addEventListener(ev, destravar, { passive: true, once: true }));
window.plim = function(){
  try { if (navigator.vibrate) navigator.vibrate([30, 40, 60]); } catch (e) {}
  try { destravar(); if (somAgapix) { somAgapix.currentTime = 0; const p = somAgapix.play(); if (p && p.catch) p.catch(() => {}); } } catch (e) {}
};
function lerPref(k){ try { return localStorage.getItem("agape_pref_" + k); } catch (e) { return null; } }
function gravarPref(k, v){ try { localStorage.setItem("agape_pref_" + k, v); } catch (e) {} }

/* ---------------- Tema da noite (automático 18h–6h) ---------------- */
function aplicarTema(){
  const p = lerPref("tema") || "auto", h = new Date().getHours();
  const noite = p === "escuro" || (p === "auto" && (h >= 18 || h < 6));
  document.documentElement.classList.toggle("noite", noite);
  const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = noite ? "#2F1D14" : "#4A3024";
}
aplicarTema(); setInterval(aplicarTema, 60000);
window.abrirPreferencias = function(){
  const tema = lerPref("tema") || "auto";
  abrirModal(`<h3>Aparência</h3>
    <label>Tema</label>
    <div class="seg" id="pf-tema">${[["auto","Automático (noite às 18h)"],["claro","Claro"],["escuro","Escuro"]].map(([k,t]) => `<button type="button" data-k="${k}" class="${k===tema?"on":""}">${t}</button>`).join("")}</div>
    <button class="btn claro" id="pf-teste" style="margin-top:18px">Ouvir o som do Agapix</button>
    <button class="btn amarelo" onclick="fecharModal()">Pronto</button>`);
  $$("#pf-tema button").forEach(b => b.onclick = () => { gravarPref("tema", b.dataset.k); $$("#pf-tema button").forEach(x => x.classList.toggle("on", x === b)); aplicarTema(); });
  $("#pf-teste").onclick = () => plim();
};

/* ---------------- Cartão do cliente ---------------- */
const SETAS = '<svg viewBox="0 0 24 24" fill="none" stroke="#F5C23F" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 10.5V9a3 3 0 0 1 3-3H19"/><path d="M15.5 2.5L19.5 6l-4 3.5"/><path d="M19.5 13.5V15a3 3 0 0 1-3 3H5"/><path d="M8.5 14.5L4.5 18l4 3.5"/></svg>';
window.abrirCartao = function(){
  const c = minhaConta || {}, num = pad4(c.numero);
  const numFmt = `AG ${num.slice(0,2)} ${num.slice(2)} 2027`;
  abrirModal(`<h3 style="text-align:center">Meu cartão</h3>
    <div class="cartao-flip" id="cf"><div class="in">
      <div class="face frente">
        <div class="cf-topo"><div class="cf-marca">${SETAS}BANCO ÁGAPE</div><div class="cf-moeda"><span class="ag"><i>α</i>$</span></div></div>
        <div class="cf-chip"></div>
        <div class="cf-num">${numFmt}</div>
        <div class="cf-baixo"><div><small>CLIENTE</small><b>${esc(c.nome || sessao.nome)}</b></div><div style="text-align:right"><small>EQUIPE</small><b>${esc(c.grupo || "—")}</b></div></div>
      </div>
      <div class="face verso">
        <div class="qr">${qrSvg(QR_PREFIXO + num)}</div>
        <div style="text-align:left"><small style="font-weight:800;letter-spacing:1px;color:#7A5641">PARA RECEBER</small>
          <div style="font-weight:900;font-size:18px;line-height:1.15;margin-top:4px">${esc(c.nome || sessao.nome)}</div>
          <div style="font-size:13px;margin-top:6px">Conta <b>${num}</b><br>Usuário <b>${esc(c.usuario || "")}</b></div></div>
      </div></div></div>
    <p class="dica-virar">Toque no cartão para virar e mostrar o QR Code de receber.</p>
    <button class="btn amarelo" id="cf-cobrar">Cobrar um valor</button>
    <button class="btn claro" onclick="fecharModal()">Fechar</button>`);
  $("#cf").onclick = () => $("#cf").classList.toggle("virado");
  $("#cf-cobrar").onclick = abrirCobrar;
};

/* ---------------- Cobrar por QR ---------------- */
function abrirCobrar(){
  abrirModal(`<h3>Cobrar por QR Code</h3><p>Gere um QR com o valor. Quem pagar só escaneia e confirma.</p>
    <label>Valor (α$)</label><input id="cb-v" type="number" inputmode="numeric" min="1" placeholder="0">
    <div class="valores">${[5,10,20,50].map(v => `<button type="button" class="chip" data-v="${v}">${v}</button>`).join("")}</div>
    <label>Motivo (opcional)</label><input id="cb-m" maxlength="40" placeholder="ex.: metade da pizza">
    <div id="t-erro" class="erro hidden"></div>
    <button class="btn amarelo" id="cb-ok">Gerar QR de cobrança</button><button class="btn claro" onclick="fecharModal()">Cancelar</button>`);
  $$("#modal-corpo [data-v]").forEach(b => b.onclick = () => { $("#cb-v").value = b.dataset.v; });
  $("#cb-ok").onclick = () => {
    const v = parseInt($("#cb-v").value, 10); if (!v || v <= 0) return mostrarErro("Informe um valor maior que zero.");
    const m = $("#cb-m").value.trim().replace(/:/g, " ");
    const cod = `AGAPIX-COBRAR:${pad4(minhaConta && minhaConta.numero)}:${v}:${encodeURIComponent(m)}`;
    abrirModal(`<h3 style="text-align:center">Cobrança de ${ag(v)}</h3>${m ? `<p style="text-align:center">${esc(m)}</p>` : ""}
      <div class="qr-caixa">${qrSvg(cod)}</div>
      <p style="text-align:center;font-size:14px">Quem vai pagar abre <b>Transferir → Escanear QR Code</b>. O valor já aparece preenchido.</p>
      <button class="btn claro" onclick="fecharModal()">Fechar</button>`);
  };
}
$("#c-cobrar").addEventListener("click", abrirCobrar);

/* ---------------- Tutorial de primeira vez ---------------- */
const TUTO = [
  ["Bem-vindo ao Banco Ágape!", "Aqui você guarda seus Agapix (α$), a moeda do retiro. Participe das atividades para ganhar.", '<rect x="2" y="5" width="20" height="14" rx="2.5"/><path d="M2 10h20M6 15h4"/>'],
  ["Receber e cobrar", "Toque em Meu cartão e vire para mostrar seu QR Code. Em Cobrar, você gera um QR já com o valor.", '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M21 14v.01M14 21h7v-4"/>'],
  ["Transferir", "Em Transferir, escaneie o QR de outra pessoa ou digite o número da conta. Todo envio gera um comprovante.", '<path d="M4.5 10.5V9a3 3 0 0 1 3-3H19"/><path d="M15.5 2.5L19.5 6l-4 3.5"/><path d="M19.5 13.5V15a3 3 0 0 1-3 3H5"/><path d="M8.5 14.5L4.5 18l4 3.5"/>'],
  ["Check-in e muito mais", "Na Agenda, escaneie o QR das atividades. Em Espiritual e Jogos tem desafios, quiz, enquetes e medalhas!", '<rect x="3" y="4.5" width="18" height="16.5" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4M8 15l2.5 2.5L16 12"/>']
];
window.abrirTutorial = function(i = 0){
  const [t, d, ic] = TUTO[i], ult = i === TUTO.length - 1;
  abrirModal(`<div class="tuto"><div class="ilu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ic}</svg></div>
    <h3>${t}</h3><p style="font-size:15.5px">${d}</p><div class="pontos">${TUTO.map((_, k) => `<i class="${k===i?"on":""}"></i>`).join("")}</div></div>
    <button class="btn amarelo" id="tu-ok">${ult ? "Começar!" : "Próximo"}</button>${ult ? "" : '<button class="btn claro" id="tu-pular">Pular</button>'}`);
  const fim = () => { gravarPref("tutorial", "visto"); fecharModal(); };
  $("#tu-ok").onclick = () => ult ? fim() : abrirTutorial(i + 1);
  if ($("#tu-pular")) $("#tu-pular").onclick = fim;
};

/* ---------------- Fila de pagamentos sem internet ---------------- */
window.filaPagamentos = {
  ler(){ try { return JSON.parse(localStorage.getItem("agape_fila")) || []; } catch (e) { return []; } },
  gravar(l){ try { localStorage.setItem("agape_fila", JSON.stringify(l)); } catch (e) {} this.mostrar(); },
  adicionar(args, rotulo){ const l = this.ler(); l.push({ args: { ...args, p_foto: null }, rotulo, quando: Date.now() }); this.gravar(l); },
  mostrar(){
    let el = $("#g-fila"); const l = this.ler();
    if (!el) { el = document.createElement("div"); el.id = "g-fila"; const ref = $("#g-modo"); if (ref) ref.parentNode.insertBefore(el, ref); }
    el.innerHTML = l.length ? `<div class="bloco" style="margin:0 0 12px;background:#FFF6DF;border-color:var(--mostarda)"><b style="font-size:14px">${l.length} pagamento(s) esperando internet</b>
      <p>${l.map(x => esc(x.rotulo)).join("<br>")}</p><p style="font-size:12.5px">Eles serão enviados sozinhos quando o sinal voltar. Não feche a sessão.</p></div>` : "";
  },
  async processar(){
    if (this._rodando || !sessao || sessao.papel !== "gerente") return; const l = this.ler(); if (!l.length) return;
    this._rodando = true;
    try {
      while (this.ler().length) {
        const [p, ...resto] = this.ler();
        try { await rpc("ger_pagar", { ...p.args, p_token: sessao.token }); this.gravar(resto); toast(`Enviado: ${p.rotulo} ✔`); carregarGerente(true); }
        catch (e) { if (e.offline) break; this.gravar(resto); toast(`Não foi possível enviar "${p.rotulo}": ${e.message}`); }
      }
    } finally { this._rodando = false; }
  }
};
setInterval(() => filaPagamentos.processar(), 8000);
addEventListener("online", () => filaPagamentos.processar());

/* ---------------- Depois do pagamento: recibo e desfazer ---------------- */
window.depoisDoPagamento = function(r, ret, valor, desc){
  const ate = new Date(r.criado_em || Date.now()).getTime() + 5 * 60e3;
  abrirModal(`<div style="text-align:center"><div style="width:76px;height:76px;border-radius:50%;margin:4px auto 10px;display:grid;place-items:center;background:var(--mostarda);color:var(--cafe);font-size:38px;font-weight:900">✓</div>
    <h3>${ret ? "Retirada feita" : "Pagamento feito"}</h3><p>${r.pessoas} ${r.pessoas === 1 ? "pessoa" : "pessoas"} · ${ret ? "−" : "+"} ${agTxt(valor)} cada · total ${agTxt(Math.abs(r.total || valor * r.pessoas))}</p></div>
    <button class="btn amarelo" id="dp-rec">Ver comprovante</button>
    <button class="btn claro" id="dp-desfazer">Desfazer</button>
    <button class="btn claro" onclick="fecharModal()">Fechar</button>`);
  $("#dp-rec").onclick = () => comprovanteLote(r.lote);
  const b = $("#dp-desfazer");
  const tique = () => { if (!document.body.contains(b)) return clearInterval(t); const s = Math.max(0, Math.round((ate - Date.now()) / 1000));
    b.textContent = s ? `Desfazer (${Math.floor(s/60)}:${String(s%60).padStart(2,"0")})` : "Tempo para desfazer acabou"; b.disabled = !s; };
  const t = setInterval(tique, 1000); tique();
  b.onclick = () => desfazerLote(r.lote);
  carregarRecentes();
};
window.desfazerLote = function(lote){
  abrirModal(`<h3>Desfazer este lançamento?</h3><p>O valor volta para como estava, e cada pessoa recebe um aviso. Fica registrado no extrato como estorno.</p>
    <div id="t-erro" class="erro hidden"></div><button class="btn" id="df-ok">Sim, desfazer</button><button class="btn claro" onclick="fecharModal()">Cancelar</button>`);
  $("#df-ok").onclick = async () => {
    try { const r = await rpc("ger_estornar", { p_token: sessao.token, p_lote: lote }); fecharModal(); toast(`Desfeito para ${r.pessoas} ${r.pessoas === 1 ? "pessoa" : "pessoas"}`); carregarGerente(true); carregarRecentes(); }
    catch (e) { mostrarErro(e.message); }
  };
};
async function compartilharImagem(url, nome){
  if (nativo()) {
    try { const r = await Capacitor.Plugins.Filesystem.writeFile({ path: nome, data: url.split(",")[1], directory: "CACHE" });
      await Capacitor.Plugins.Share.share({ title: "Banco Ágape", files: [r.uri] }); } catch (e) { if (!/cancel/i.test(String(e && e.message))) toast("Não consegui compartilhar."); }
    return;
  }
  try { const f = new File([await (await fetch(url)).blob()], nome, { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f] }); return; } } catch (e) { if (e && e.name === "AbortError") return; }
  try { const a = document.createElement("a"); a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove(); toast("Imagem baixada"); } catch (e) { toast("Toque e segure na imagem para salvar."); }
}
window.compartilharImagem = compartilharImagem;
async function fontes(){ try { await Promise.all(["900 40px Montserrat","700 24px Montserrat","800 40px AlfaGrega"].map(f => document.fonts.load(f, "α$"))); } catch (e) {} }
const F = (p, t) => `${p} ${t}px Montserrat, AlfaGrega, sans-serif`;
function cabecalho(x, W, sub){
  x.fillStyle = "#4A3024"; x.fillRect(0, 0, W, 170); x.fillStyle = "#F5C23F"; x.fillRect(0, 166, W, 6);
  x.save(); x.translate(50, 44); x.scale(3.4, 3.4); x.strokeStyle = "#F5C23F"; x.lineWidth = 2.6; x.lineCap = "round"; x.lineJoin = "round";
  x.stroke(new Path2D("M4.5 10.5V9a3 3 0 0 1 3-3H19M15.5 2.5L19.5 6l-4 3.5M19.5 13.5V15a3 3 0 0 1-3 3H5M8.5 14.5L4.5 18l4 3.5")); x.restore();
  x.fillStyle = "#fff"; x.font = F(900, 38); x.fillText("BANCO ÁGAPE", 150, 88);
  x.fillStyle = "#E9DCCF"; x.font = F(600, 20); x.fillText(sub, 150, 122);
}
window.comprovanteLote = async function(lote){
  abrirModal(`<h3>Comprovante do pagamento</h3><div class="vazio">Gerando…</div>`);
  try {
    const r = await rpc("ger_lote", { p_token: sessao.token, p_lote: lote }); await fontes();
    const it = r.itens, info = r.info || {}, W = 720, H = 560 + it.length * 52, c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d");
    x.fillStyle = "#FBF6EE"; x.fillRect(0, 0, W, H); cabecalho(x, W, "Comprovante de pagamento em lote");
    const v = it[0] ? it[0].valor : 0, total = it.reduce((s, i) => s + i.valor, 0);
    x.fillStyle = "#7A5641"; x.font = F(800, 20); x.fillText(v > 0 ? "PAGAMENTO DO BANCO ÁGAPE" : "RETIRADA DO BANCO ÁGAPE", 50, 226);
    x.fillStyle = v > 0 ? "#3E7C4F" : "#4A3024"; x.font = F(900, 56); x.fillText(`${v > 0 ? "+" : "−"} α$ ${fmt(Math.abs(v))} cada`, 50, 296);
    x.fillStyle = "#4A3024"; x.font = F(700, 22);
    x.fillText(`${it.length} pessoa(s) · total α$ ${fmt(Math.abs(total))}`, 50, 338);
    x.fillStyle = "#7A5641"; x.font = F(600, 19);
    x.fillText(`${info.descricao || "Sem motivo"} · ${new Date(info.criado_em).toLocaleString("pt-BR")} · por ${info.por || "gerente"}`.slice(0, 70), 50, 372);
    if (info.estornado) { x.fillStyle = "#B3261E"; x.font = F(900, 24); x.fillText("DESFEITO (ESTORNADO)", 50, 404); }
    let y = 440; x.font = F(700, 22);
    it.forEach((i, k) => { if (k % 2 === 0) { x.fillStyle = "#F1E7D8"; x.fillRect(40, y - 32, W - 80, 52); }
      x.fillStyle = "#4A3024"; x.font = F(800, 22); x.fillText(i.nome.slice(0, 26), 56, y);
      x.fillStyle = "#8C7B6B"; x.font = F(600, 17); x.fillText(`conta ${pad4(i.numero)}${i.grupo ? " · " + i.grupo : ""}`.slice(0, 40), 56, y + 16);
      x.fillStyle = "#4A3024"; x.font = F(800, 22); x.textAlign = "right"; x.fillText(`saldo α$ ${fmt(i.saldo_apos)}`, W - 56, y + 6); x.textAlign = "left"; y += 52; });
    x.fillStyle = "#8C7B6B"; x.font = F(600, 17); x.textAlign = "center"; x.fillText(`Lote ${String(lote).slice(0, 8).toUpperCase()} · Banco Ágape · Retiro Espiritual 2027`, W / 2, H - 40);
    const url = c.toDataURL("image/png");
    abrirModal(`<h3>Comprovante do pagamento</h3><img class="comprovante-img" src="${url}" alt="Comprovante do lote">
      <button class="btn amarelo" id="cl-sh">Compartilhar</button><button class="btn claro" onclick="fecharModal()">Fechar</button>`);
    $("#cl-sh").onclick = () => compartilharImagem(url, `pagamento-agape-${String(lote).slice(0, 8)}.png`);
  } catch (e) { abrirModal(`<h3>Comprovante</h3><p>${esc(e.message)}</p><button class="btn claro" onclick="fecharModal()">Fechar</button>`); }
};

/* ---------------- Pagamentos recentes (aba Pagamentos) ---------------- */
async function carregarRecentes(){
  if (!sessao || sessao.papel !== "gerente") return;
  let el = $("#g-recentes");
  if (!el) { el = document.createElement("div"); el.id = "g-recentes"; $("#aba-enviar").appendChild(el); }
  try {
    const l = await rpc("ger_lotes_recentes", { p_token: sessao.token });
    el.innerHTML = l.length ? `<h2>Pagamentos recentes</h2><div class="lista">${l.map(p => `<div class="lote-item">
      <div class="bola ${p.valor > 0 ? "mais" : "menos"}">${p.valor > 0 ? "+" : "−"}</div>
      <div style="flex:1;min-width:0"><div style="font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(p.descricao || "Sem motivo")}${p.estornado ? ' <span class="tag">desfeito</span>' : ""}</div>
        <div style="font-size:12.5px;color:var(--cinza)">${hora(p.criado_em)} · ${p.pessoas} pessoa(s) · ${agTxt(Math.abs(p.total))} · ${esc(p.por)}</div></div>
      <button class="mini cl" data-rec="${p.lote}">Recibo</button>${p.pode_desfazer && !p.estornado ? `<button class="mini" data-des="${p.lote}">Desfazer</button>` : ""}</div>`).join("")}</div>` : "";
    $$("#g-recentes [data-rec]").forEach(b => b.onclick = () => comprovanteLote(b.dataset.rec));
    $$("#g-recentes [data-des]").forEach(b => b.onclick = () => desfazerLote(b.dataset.des));
  } catch (e) {}
}
window.carregarRecentes = carregarRecentes;

/* ---------------- Controle: gráfico por hora ---------------- */
var graficoHoras = async function(){
  let box = $("#g-horas");
  if (!box) { box = document.createElement("div"); box.id = "g-horas"; box.className = "bloco"; const p = $("#g-painel"); if (!p) return; p.appendChild(box); }
  try {
    const l = await rpc("ger_economia_horas", { p_token: sessao.token }); window._horasCache = l;
    if (!l.length) { box.innerHTML = "<h4>Movimento por hora</h4><p>Sem movimento nas últimas 72 horas.</p>"; return; }
    const ult = l.slice(-24), max = Math.max(1, ...ult.map(h => Math.max(h.injetado, h.transferido, h.retirado)));
    box.innerHTML = `<h4>Movimento por hora</h4><p style="font-size:12.5px">Últimas ${ult.length} horas com movimento</p><div class="grafico-horas"><svg id="gh-svg"></svg></div>
      <div class="legenda"><span><i style="background:#3E7C4F"></i>Injetado</span><span><i style="background:#F5C23F"></i>Transferido</span><span><i style="background:#7A5641"></i>Retirado</span></div>`;
    const s = $("#gh-svg"), desenhar = () => {
      const W = s.clientWidth, H = s.clientHeight; if (!W) return; const pb = 22, pt = 8, n = ult.length, gw = (W - 8) / n, bw = Math.max(2, Math.min(10, gw / 3.6));
      const yy = v => H - pb - (H - pb - pt) * v / max;
      let out = `<line x1="0" x2="${W}" y1="${H - pb}" y2="${H - pb}" stroke="currentColor" opacity=".2"/>`;
      ult.forEach((h, i) => { const x0 = 4 + i * gw + gw / 2 - bw * 1.5;
        [["injetado","#3E7C4F"],["transferido","#F5C23F"],["retirado","#7A5641"]].forEach(([k, cor], j) => { const v = h[k]; if (!v) return;
          out += `<rect x="${x0 + j * bw}" y="${yy(v)}" width="${bw - 1}" height="${H - pb - yy(v)}" rx="1.5" fill="${cor}"><title>${hora(h.hora)} · ${k}: α$ ${v}</title></rect>`; });
        if (n <= 12 || i % Math.ceil(n / 8) === 0) out += `<text x="${4 + i * gw + gw / 2}" y="${H - 6}" text-anchor="middle" font-size="10" fill="currentColor" opacity=".7">${new Date(h.hora).getHours()}h</text>`; });
      out += `<text x="2" y="12" font-size="10" fill="currentColor" opacity=".6">α$ ${fmt(max)}</text>`;
      s.innerHTML = out; };
    desenhar(); if (!s._ro) { s._ro = new ResizeObserver(desenhar); s._ro.observe(s); }
  } catch (e) {}
}
const _extratoGeral = carregarExtratoGeral;
carregarExtratoGeral = async function(){ await _extratoGeral(); graficoHoras(); };

/* ---------------- Gerente: configurações, subgerente, lote, cartões, backup ---------------- */
async function montarConfig(){
  if (!sessao || sessao.papel !== "gerente") return;
  let el = $("#g-config");
  if (!el) { el = document.createElement("div"); el.id = "g-config"; const conta = $("#aba-conta"); conta.insertBefore(el, conta.lastElementChild); }
  el.innerHTML = (sessao.nivel === "sub" ? `<div class="bloco"><h4>Você é subgerente</h4><p>Pode pagar até o limite definido pelo gerente e mostrar os QR de check-in na aba Retiro.</p></div>`
    : `<div class="bloco"><h4>Onde estão as ferramentas?</h4><p>Cadastro em lote, cartões, subgerente, regras, metas, backup, ranking e retrospectiva ficam na aba <b>Retiro</b>, separados por categoria.</p></div>`)
    + `<button class="btn claro" onclick="abrirPreferencias()">Aparência</button>`;
}
window.abrirRegras = async function(){
  try {
    const c = (await rpc("ger_config", { p_token: sessao.token })).config;
    abrirModal(`<h3>Regras do banco</h3>
      <div class="cfg-linha"><div><b>Limite de transferência por dia</b><small>Por cliente. Vazio = sem limite.</small></div><input id="cf-lim" type="number" min="0" inputmode="numeric" value="${c.limite_transf_dia || ""}" placeholder="sem"></div>
      <div class="cfg-linha"><div><b>Pagamento máximo do subgerente</b><small>Por pessoa, em α$</small></div><input id="cf-submax" type="number" min="1" inputmode="numeric" value="${c.subgerente_max}"></div>
      <div id="t-erro" class="erro hidden"></div><button class="btn amarelo" id="cf-salvar">Salvar regras</button><button class="btn claro" onclick="fecharModal()">Cancelar</button>`);
    $("#cf-salvar").onclick = async () => {
      try { await rpc("ger_salvar_config", { p_token: sessao.token, p_limite: Number($("#cf-lim").value) || null, p_ranking: c.ranking_publico,
        p_retro: c.retrospectiva_liberada, p_sub_max: Number($("#cf-submax").value) || 20 }); fecharModal(); toast("Regras salvas ✔"); } catch (e) { mostrarErro(e.message); } };
  } catch (e) { toast(e.message); }
};
window.abrirMetas = async function(){
  try {
    const r = await rpc("ger_config", { p_token: sessao.token });
    const grupos = [...new Set(contas.filter(x => x.papel === "cliente").map(x => x.grupo).filter(Boolean))].sort();
    const meta = g => r.metas.find(m => m.grupo === g) || {};
    abrirModal(`<h3>Metas das equipes</h3><p>Quando a equipe chegar ao valor em α$, todos recebem o aviso de meta batida.</p>
      ${grupos.length ? grupos.map(g => `<div class="cfg-linha" style="flex-wrap:wrap"><div style="flex:1 1 100%"><b>${esc(g)}</b>${meta(g).batida_em ? '<small style="color:var(--verde)">Meta batida ✔</small>' : ""}</div>
        <input type="number" min="1" inputmode="numeric" placeholder="meta α$" data-meta="${esc(g)}" value="${meta(g).alvo || ""}" style="width:120px">
        <input placeholder="prêmio (opcional)" data-premio="${esc(g)}" value="${esc(meta(g).premio || "")}" style="flex:1;min-width:140px"></div>`).join("")
        : "<p>Cadastre clientes com equipe para criar metas.</p>"}
      <div id="t-erro" class="erro hidden"></div><button class="btn amarelo" id="cf-metas">Salvar metas</button><button class="btn claro" onclick="fecharModal()">Cancelar</button>`);
    $("#cf-metas").onclick = async () => { let n = 0;
      for (const i of $$("#modal-corpo [data-meta]")) { const v = Number(i.value); if (!v) continue;
        try { await rpc("ger_salvar_meta", { p_token: sessao.token, p_grupo: i.dataset.meta, p_alvo: v, p_premio: $(`#modal-corpo [data-premio="${CSS.escape(i.dataset.meta)}"]`).value }); n++; } catch (e) { return mostrarErro(e.message); } }
      fecharModal(); toast(`${n} meta(s) salva(s) ✔`); };
  } catch (e) { toast(e.message); }
};
window.montarConfig = montarConfig;
$('#abas-g [data-aba="conta"]').addEventListener("click", montarConfig);
$('#abas-g [data-aba="enviar"]').addEventListener("click", () => { carregarRecentes(); filaPagamentos.mostrar(); });

window.criarSubgerente = criarSubgerente;
function criarSubgerente(){
  const pin = String(Math.floor(1000 + Math.random() * 9000));
  abrirModal(`<h3>Novo subgerente</h3><p>Ele entra pelo botão <b>Gerente</b>, pode pagar até o limite que você definiu e mostrar os QR de check-in. Não pode retirar, nem ver o Controle, nem mudar as regras.</p>
    <label>Nome</label><input id="sg-n" placeholder="ex.: Pr. Lucas">
    <label>Usuário</label><input id="sg-u" autocapitalize="none" placeholder="ex.: lucas.sub">
    <label>PIN</label><input id="sg-p" inputmode="numeric" maxlength="6" value="${pin}">
    <div id="t-erro" class="erro hidden"></div><button class="btn amarelo" id="sg-ok">Criar subgerente</button><button class="btn claro" onclick="fecharModal()">Cancelar</button>`);
  $("#sg-ok").onclick = async () => {
    const nome = $("#sg-n").value.trim(), usuario = $("#sg-u").value.trim().toLowerCase(), pin = $("#sg-p").value.trim();
    try { await rpc("ger_criar_conta", { p_token: sessao.token, p_nome: nome, p_usuario: usuario, p_pin: pin, p_grupo: null, p_papel: "subgerente" });
      abrirModal(`<h3>Subgerente criado ✔</h3><p>Passe para <b>${esc(nome)}</b>:</p><div class="cartao-papel" style="font-size:18px;margin:12px 0">Entrar como: <b>Gerente</b><br>Usuário: <b>${esc(usuario)}</b><br>PIN: <b>${esc(pin)}</b></div>
        <button class="btn amarelo" onclick="fecharModal()">Fechar</button>`);
      carregarGerente(); }
    catch (e) { mostrarErro(e.message); }
  };
}

/* Cadastro em lote: uma pessoa por linha — "Nome; Equipe" (também aceita colar da planilha) */
function semAcento(t){ return t.normalize("NFD").replace(/[̀-ͯ]/g, ""); }
function usuarioPara(nome, usados){
  const p = semAcento(nome).toLowerCase().replace(/[^a-z0-9 ]/g, " ").trim().split(/\s+/).filter(Boolean);
  let u = (p.length > 1 ? p[0] + "." + p[p.length - 1] : p[0] || "cliente").slice(0, 26), s = u, i = 2;
  while (usados.has(s) || s.length < 3) s = u + i++;
  usados.add(s); return s;
}
window.abrirCadastroLote = abrirCadastroLote;
function abrirCadastroLote(){
  abrirModal(`<h3>Cadastro em lote</h3><p>Uma pessoa por linha: <b>Nome; Equipe</b>. Pode colar direto de uma planilha (coluna A nome, coluna B equipe).</p>
    <textarea id="lt-txt" style="min-height:180px" placeholder="Maria Souza; Equipe Café&#10;João Lima; Equipe Mostarda&#10;Ana Clara; Equipe Café"></textarea>
    <label class="btn claro" style="text-align:center;margin-top:10px">Abrir arquivo .csv ou .txt<input type="file" accept=".csv,.txt,text/plain,text/csv" id="lt-arq" class="hidden"></label>
    <div id="t-erro" class="erro hidden"></div><button class="btn amarelo" id="lt-ver">Revisar lista</button><button class="btn claro" onclick="fecharModal()">Cancelar</button>`);
  $("#lt-arq").onchange = async e => { const f = e.target.files[0]; if (f) $("#lt-txt").value = await f.text(); };
  $("#lt-ver").onclick = () => {
    const usados = new Set(contas.map(c => c.usuario));
    const pessoas = $("#lt-txt").value.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
      .map(l => l.split(/\t|;|,/).map(x => x.trim())).filter(([n]) => n && !/^nome$/i.test(n))
      .map(([nome, grupo]) => ({ nome, grupo: grupo || null, usuario: usuarioPara(nome, usados), pin: String(Math.floor(1000 + Math.random() * 9000)) }));
    if (!pessoas.length) return mostrarErro("Cole pelo menos um nome.");
    abrirModal(`<h3>${pessoas.length} pessoa(s) para cadastrar</h3><p>Os usuários e PINs foram gerados. Confira antes de criar.</p>
      <div class="lista" style="max-height:44vh;overflow:auto;margin:10px 0">${pessoas.map(p => `<div class="item" style="padding:9px 12px"><div class="meio"><div class="t1">${esc(p.nome)}</div>
        <div class="t2">${esc(p.grupo || "sem equipe")} · @${esc(p.usuario)} · PIN ${p.pin}</div></div></div>`).join("")}</div>
      <div id="t-erro" class="erro hidden"></div><button class="btn amarelo" id="lt-ok">Criar ${pessoas.length} conta(s)</button><button class="btn claro" onclick="fecharModal()">Cancelar</button>`);
    $("#lt-ok").onclick = async () => {
      const b = $("#lt-ok"); b.disabled = true; b.textContent = "Criando…";
      try {
        const res = await rpc("ger_criar_lote", { p_token: sessao.token, p_pessoas: pessoas });
        const ok = pessoas.filter((p, i) => res[i] && res[i].ok).map((p, i) => ({ ...p, numero: (res.find(r => r.usuario === p.usuario) || {}).numero }));
        const falhas = res.filter(r => !r.ok);
        await carregarGerente();
        abrirModal(`<h3>${ok.length} conta(s) criada(s) ✔</h3>${falhas.length ? `<div class="erro">${falhas.length} não deu certo:<br>${falhas.map(f => esc(f.usuario + ": " + f.erro)).join("<br>")}</div>` : ""}
          <p>Gere agora os cartões com usuário e PIN para imprimir ou mandar para cada um. <b>Os PINs só aparecem agora</b>; depois só dá para trocar.</p>
          <button class="btn amarelo" id="lt-cart">Gerar cartões com PIN</button><button class="btn claro" onclick="fecharModal()">Fechar</button>`);
        $("#lt-cart").onclick = () => cartoesImprimir(ok);
      } catch (e) { mostrarErro(e.message); b.disabled = false; b.textContent = "Tentar de novo"; }
    };
  };
}

/* Cartões para imprimir: folhas A4 com 10 cartões (com PIN quando acabou de cadastrar) */
window.cartoesImprimir = cartoesImprimir;
async function cartoesImprimir(lista){
  const pessoas = lista || contas.filter(c => c.papel === "cliente" && c.ativo).sort((a, b) => a.nome.localeCompare(b.nome));
  if (!pessoas.length) return toast("Nenhum cliente para gerar cartões.");
  abrirModal(`<h3>Cartões para imprimir</h3><div class="vazio">Gerando folhas…</div>`);
  await fontes();
  const W = 1240, H = 1754, cw = 560, ch = 312, mx = 40, my = 58, gx = 40, gy = 28, folhas = [];
  for (let f = 0; f < Math.ceil(pessoas.length / 10); f++) {
    const c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d");
    x.fillStyle = "#fff"; x.fillRect(0, 0, W, H);
    pessoas.slice(f * 10, f * 10 + 10).forEach((p, i) => {
      const X = mx + (i % 2) * (cw + gx), Y = my + Math.floor(i / 2) * (ch + gy);
      x.setLineDash([8, 8]); x.strokeStyle = "#bbb"; x.lineWidth = 2; x.strokeRect(X - 6, Y - 6, cw + 12, ch + 12); x.setLineDash([]);
      const gr = x.createLinearGradient(X, Y, X + cw, Y + ch); gr.addColorStop(0, "#6B4732"); gr.addColorStop(.5, "#4A3024"); gr.addColorStop(1, "#2F1D14");
      x.fillStyle = gr; x.beginPath(); x.roundRect(X, Y, cw, ch, 22); x.fill();
      x.save(); x.translate(X + 24, Y + 22); x.scale(1.6, 1.6); x.strokeStyle = "#F5C23F"; x.lineWidth = 2.6; x.lineCap = "round"; x.lineJoin = "round";
      x.stroke(new Path2D("M4.5 10.5V9a3 3 0 0 1 3-3H19M15.5 2.5L19.5 6l-4 3.5M19.5 13.5V15a3 3 0 0 1-3 3H5M8.5 14.5L4.5 18l4 3.5")); x.restore();
      x.fillStyle = "#fff"; x.font = F(900, 24); x.fillText("BANCO ÁGAPE", X + 70, Y + 48);
      x.fillStyle = "#F5C23F"; x.font = F(900, 26); x.textAlign = "right"; x.fillText("α$", X + cw - 24, Y + 48); x.textAlign = "left";
      x.fillStyle = "#fff"; x.font = F(900, 30); let nome = p.nome; while (x.measureText(nome).width > cw - 48 && nome.length > 4) nome = nome.slice(0, -1); x.fillText(nome, X + 24, Y + 118);
      x.fillStyle = "#E9DCCF"; x.font = F(600, 18); x.fillText(`${p.grupo || "sem equipe"}${p.numero ? " · conta " + pad4(p.numero) : ""}`, X + 24, Y + 146);
      x.fillStyle = "rgba(255,255,255,.1)"; x.beginPath(); x.roundRect(X + 20, Y + 168, cw - 40, 116, 14); x.fill();
      x.fillStyle = "#E9DCCF"; x.font = F(700, 16); x.fillText("USUÁRIO", X + 40, Y + 200); x.fillText("PIN", X + 40, Y + 254);
      x.fillStyle = "#F5C23F"; x.font = "700 30px ui-monospace, Menlo, monospace"; x.fillText(p.usuario, X + 150, Y + 204);
      x.fillText(p.pin || "_ _ _ _", X + 150, Y + 258);
      x.fillStyle = "#E9DCCF"; x.font = F(600, 14); x.textAlign = "right"; x.fillText("Entre como Cliente", X + cw - 36, Y + 258); x.textAlign = "left";
    });
    x.fillStyle = "#999"; x.font = F(600, 18); x.textAlign = "center"; x.fillText(`Banco Ágape · Retiro Espiritual 2027 · folha ${f + 1}`, W / 2, H - 22); x.textAlign = "left";
    folhas.push(c.toDataURL("image/png"));
  }
  abrirModal(`<h3>${folhas.length} folha(s) · ${pessoas.length} cartão(ões)</h3><p>Imprima em A4 e recorte na linha pontilhada${lista ? "" : ". Sem PIN: anote à mão ou troque o PIN de cada um na aba Clientes"}.</p>
    ${folhas.map((u, i) => `<img class="comprovante-img" src="${u}" alt="Folha ${i + 1} de cartões"><button class="btn claro" data-f="${i}">Compartilhar folha ${i + 1}</button>`).join("")}
    <button class="btn amarelo" onclick="fecharModal()">Fechar</button>`);
  $$("#modal-corpo [data-f]").forEach(b => b.onclick = () => compartilharImagem(folhas[b.dataset.f], `cartoes-agape-folha-${Number(b.dataset.f) + 1}.png`));
}

/* Backup: 3 planilhas CSV (abrem no Excel e no Google Planilhas) */
function csv(linhas, colunas){
  const q = v => { if (v == null) return ""; const s = String(v); return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  return "﻿" + [colunas.map(c => c[1]).join(";"), ...linhas.map(l => colunas.map(([k]) => q(typeof k === "function" ? k(l) : l[k])).join(";"))].join("\r\n");
}
async function salvarTexto(nome, texto){
  if (nativo()) {
    const r = await Capacitor.Plugins.Filesystem.writeFile({ path: nome, data: texto, directory: "CACHE", encoding: "utf8" });
    return r.uri;
  }
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([texto], { type: "text/csv;charset=utf-8" })); a.download = nome;
  document.body.appendChild(a); a.click(); a.remove(); return null;
}
window.baixarBackup = baixarBackup;
async function baixarBackup(){
  abrirModal(`<h3>Backup</h3><div class="vazio">Juntando os dados…</div>`);
  try {
    const d = await rpc("ger_exportar", { p_token: sessao.token }), dt = new Date(d.gerado_em), tag = `${dt.getFullYear()}-${pad4(dt.getMonth() + 1).slice(2)}-${pad4(dt.getDate()).slice(2)}_${pad4(dt.getHours()).slice(2)}h${pad4(dt.getMinutes()).slice(2)}`;
    const dh = v => v ? new Date(v).toLocaleString("pt-BR") : "";
    const arqs = [
      [`agape-contas_${tag}.csv`, csv(d.contas, [["numero","Conta"],["nome","Nome"],["usuario","Usuário"],["grupo","Equipe"],["tipo","Tipo"],["saldo","Saldo (α$)"],[l => l.ativo ? "sim" : "não","Ativa"],[l => dh(l.criado_em),"Criada em"]])],
      [`agape-movimentacoes_${tag}.csv`, csv(d.movimentacoes, [["id","Nº"],[l => dh(l.criado_em),"Data e hora"],["numero","Conta"],["nome","Nome"],["grupo","Equipe"],["valor","Valor (α$)"],["saldo_apos","Saldo depois"],["descricao","Descrição"],["lancado_por","Lançado por"],[l => l.estornado ? "sim" : "","Desfeito"]])],
      [`agape-presencas_${tag}.csv`, csv(d.presencas, [["atividade","Atividade"],[l => dh(l.inicio),"Início"],["nome","Nome"],["grupo","Equipe"],[l => l.pontual ? "sim" : "não","Na hora"],[l => dh(l.criado_em),"Check-in"]])]
    ];
    const uris = []; for (const [n, t] of arqs) { const u = await salvarTexto(n, t); if (u) uris.push(u); }
    if (uris.length) { try { await Capacitor.Plugins.Share.share({ title: "Backup Banco Ágape", files: uris }); } catch (e) {} }
    abrirModal(`<h3>Backup pronto ✔</h3><p>${d.contas.length} contas, ${d.movimentacoes.length} movimentações e ${d.presencas.length} presenças em 3 planilhas (.csv), que abrem no Excel e no Google Planilhas.</p>
      ${uris.length ? "" : "<p>Os arquivos foram baixados no aparelho.</p>"}<button class="btn amarelo" onclick="fecharModal()">Fechar</button>`);
  } catch (e) { abrirModal(`<h3>Backup</h3><p>${esc(e.message)}</p><button class="btn claro" onclick="fecharModal()">Fechar</button>`); }
}

/* ---------------- Subgerente: Retiro mostra só a programação ---------------- */
const _abrirRetiro = window.abrirRetiro;
window.abrirRetiro = function(sub){
  if (sessao && sessao.nivel === "sub" && sub !== "programacao") return _abrirRetiro("programacao");
  return _abrirRetiro(sub);
};

/* ---------------- Retrospectiva ---------------- */
window.abrirRetrospectiva = async function(){
  abrirModal(`<h3>Sua retrospectiva</h3><div class="vazio">Preparando…</div>`);
  try {
    const r = await rpc("minha_retrospectiva", { p_token: sessao.token });
    if (!r.liberada) return abrirModal(`<h3>Ainda não!</h3><p>A retrospectiva é liberada no fim do retiro. Fique de olho nas notificações.</p><button class="btn claro" onclick="fecharModal()">Fechar</button>`);
    await fontes();
    const W = 1080, H = 1920, c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d");
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#5E3E2E"); g.addColorStop(.55, "#4A3024"); g.addColorStop(1, "#2A1810"); x.fillStyle = g; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 26; i++) { const cx = (i * 211) % W, cy = 260 + ((i * 397) % 1500), rr = 10 + (i % 5) * 6; x.fillStyle = "rgba(245,194,63,.07)"; x.beginPath(); x.arc(cx, cy, rr, 0, 7); x.fill(); }
    x.save(); x.translate(80, 100); x.scale(4, 4); x.strokeStyle = "#F5C23F"; x.lineWidth = 2.6; x.lineCap = "round"; x.lineJoin = "round";
    x.stroke(new Path2D("M4.5 10.5V9a3 3 0 0 1 3-3H19M15.5 2.5L19.5 6l-4 3.5M19.5 13.5V15a3 3 0 0 1-3 3H5M8.5 14.5L4.5 18l4 3.5")); x.restore();
    x.fillStyle = "#fff"; x.font = F(900, 44); x.fillText("BANCO ÁGAPE", 200, 160);
    x.fillStyle = "#F5C23F"; x.font = F(800, 30); x.fillText("RETROSPECTIVA · RECONECTADOS 2027", 80, 300);
    x.fillStyle = "#fff"; x.font = F(900, 76); let nome = r.nome; while (x.measureText(nome).width > W - 160) nome = nome.slice(0, -1); x.fillText(nome, 80, 400);
    x.fillStyle = "#E9DCCF"; x.font = F(600, 34); x.fillText(r.grupo ? `${r.grupo} · ${r.posicao_equipe || "–"}º lugar entre as equipes` : "Retiro Espiritual 2027", 80, 456);
    x.fillStyle = "#F5C23F"; x.font = F(900, 150); x.fillText(`α$ ${fmt(r.ganhou)}`, 80, 680);
    x.fillStyle = "#E9DCCF"; x.font = F(700, 34); x.fillText("ganhos durante o retiro", 84, 736);
    const itens = [[r.checkins, "check-ins"], [r.desafios, "desafios cumpridos"], [r.quiz, "acertos no quiz"], [r.oracoes, "pedidos pelos quais orou"],
      [r.pessoas_ajudadas, "pessoas que você ajudou"], [r.medalhas, "medalhas"]];
    itens.forEach(([v, t], i) => { const X = 80 + (i % 2) * 470, Y = 860 + Math.floor(i / 2) * 230;
      x.fillStyle = "rgba(255,255,255,.08)"; x.beginPath(); x.roundRect(X, Y, 440, 200, 28); x.fill();
      x.fillStyle = "#fff"; x.font = F(900, 96); x.fillText(fmt(v), X + 34, Y + 112); x.fillStyle = "#E9DCCF"; x.font = F(700, 30); x.fillText(t, X + 36, Y + 164); });
    x.fillStyle = "#F5C23F"; x.beginPath(); x.roundRect(80, 1580, W - 160, 150, 30); x.fill();
    x.fillStyle = "#2F1D14"; x.font = F(900, 44); x.fillText(`Terminou em ${r.posicao}º de ${r.total_clientes}`, 120, 1650);
    x.font = F(700, 30); x.fillText(`Saldo final α$ ${fmt(r.saldo)} · enviou α$ ${fmt(r.enviou)} para os outros`, 120, 1700);
    x.fillStyle = "#E9DCCF"; x.font = F(600, 28); x.textAlign = "center"; x.fillText("O banco oficial do Retiro Espiritual 2027", W / 2, H - 80);
    const url = c.toDataURL("image/png");
    abrirModal(`<h3 style="text-align:center">Sua retrospectiva</h3><img class="retro-img" src="${url}" alt="Retrospectiva do retiro de ${esc(r.nome)}">
      <button class="btn amarelo" id="rt-sh">Compartilhar nos stories</button><button class="btn claro" onclick="fecharModal()">Fechar</button>`);
    $("#rt-sh").onclick = () => compartilharImagem(url, "retrospectiva-reconectados-2027.png");
  } catch (e) { abrirModal(`<h3>Retrospectiva</h3><p>${esc(e.message)}</p><button class="btn claro" onclick="fecharModal()">Fechar</button>`); }
};

/* ---------------- Ganchos no fluxo do cliente ---------------- */
const _iniciar2 = iniciar;
iniciar = function(){
  _iniciar2();
  if (sessao && sessao.papel === "cliente" && lerPref("tutorial") !== "visto") setTimeout(() => { if ($("#modal").classList.contains("hidden")) abrirTutorial(0); }, 3300);
  if (sessao && sessao.papel === "gerente") { const pag = $('#abas-g [data-aba="enviar"]'); if (pag && !pag.classList.contains("ativa")) pag.click();
    setTimeout(() => { filaPagamentos.mostrar(); carregarRecentes(); filaPagamentos.processar(); }, 600); }
};
// menu do cliente: preferências e tutorial
$("#c-menu").addEventListener("click", () => setTimeout(() => {
  const corpo = $("#modal-corpo"); if (!corpo || $("#mn-pref")) return;
  const sair = [...corpo.querySelectorAll("button")].find(b => /Sair/.test(b.textContent)); if (!sair) return;
  sair.insertAdjacentHTML("beforebegin", `<button class="btn claro" id="mn-pref">Aparência</button><button class="btn claro" id="mn-tuto">Ver tutorial</button>`);
  $("#mn-pref").onclick = abrirPreferencias; $("#mn-tuto").onclick = () => abrirTutorial(0);
}, 0));

/* ---------------- Estilos novos: categorias, voltar, sorteio, gincana ---------------- */
const css2 = document.createElement("style");
css2.textContent = `
.voltar{display:inline-flex;align-items:center;gap:4px;font-size:17px;font-weight:800;padding:8px 10px 8px 0;min-height:44px}
.voltar svg{width:28px;height:28px}
.categoria{background:var(--creme);border:1px solid var(--linha);border-radius:18px;box-shadow:var(--sombra);margin-top:12px;overflow:hidden}
.cat-topo{width:100%;display:flex;justify-content:space-between;align-items:center;gap:10px;background:none;border:0;padding:16px;cursor:pointer;color:inherit;font:inherit;text-align:left}
.cat-topo b{display:block;font-size:16.5px;font-weight:900}
.cat-topo small{display:block;font-size:12.5px;color:var(--cinza);margin-top:2px;font-weight:600}
.cat-seta{display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:#EADCC6;flex:none;transition:transform .25s}
.cat-seta svg{width:20px;height:20px;transform:rotate(-90deg)}
.categoria.aberta .cat-seta{transform:rotate(180deg);background:var(--mostarda)}
.cat-corpo{display:none;padding:0 12px 14px}
.categoria.aberta .cat-corpo{display:block}
.categoria .cards-retiro{margin-top:0}
.categoria .card-r{box-shadow:none;background:#fff}
html.noite .categoria .card-r{background:#1E1612}
html.noite .cat-seta{background:#3D3028}
.clicavel-k{cursor:pointer;position:relative}
.kpi.clicavel-k{padding-right:26px}
.clicavel-k:after{content:"›";position:absolute;right:12px;top:10px;font-size:20px;font-weight:900;color:var(--marrom2)}
.barra.clicavel-k:after{top:-2px;right:-2px}
.tabela-dia tr.clicavel-k{cursor:pointer}.tabela-dia tr.clicavel-k:after{content:none}
.tabela-dia tr.clicavel-k:active td{background:#F3EADC}
.sorteio-tela{display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%}
.rolo{position:relative;width:min(92vw,820px);height:clamp(120px,22vh,220px);overflow:hidden;border-radius:24px;background:rgba(0,0,0,.25);border:4px solid var(--mostarda);margin:18px 0}
.rolo:before,.rolo:after{content:"";position:absolute;left:0;right:0;height:35%;z-index:2;pointer-events:none}
.rolo:before{top:0;background:linear-gradient(#2F1D14,rgba(47,29,20,0))}.rolo:after{bottom:0;background:linear-gradient(rgba(47,29,20,0),#2F1D14)}
.rolo .fita{position:absolute;left:0;right:0;top:0;will-change:transform}
.rolo .fita div{height:clamp(120px,22vh,220px);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:clamp(30px,6.5vw,72px);color:#fff;text-align:center;padding:0 20px;line-height:1.05}
.ganhador{font-size:clamp(36px,8vw,96px);font-weight:900;color:var(--mostarda);animation:ganha .7s cubic-bezier(.3,1.6,.5,1)}
@keyframes ganha{0%{transform:scale(.2);opacity:0}100%{transform:none;opacity:1}}
#confete{position:fixed;inset:0;pointer-events:none;z-index:70}
.tab-gincana{width:100%;border-collapse:collapse;font-size:14px}
.tab-gincana th,.tab-gincana td{padding:8px 6px;border-bottom:1px solid var(--linha);text-align:right;white-space:nowrap}
.tab-gincana th:first-child,.tab-gincana td:first-child{text-align:left;white-space:normal}
.tab-gincana tfoot td{font-weight:900;border-top:2px solid var(--cafe)}
.btn.perigo{background:#B23A1E;color:#fff;border-color:#B23A1E}
.ativ-ed{cursor:pointer}
.aviso-pix{position:fixed;left:50%;top:calc(12px + env(safe-area-inset-top));z-index:999;width:min(94vw,460px);display:flex;gap:12px;align-items:center;padding:14px 16px;border-radius:20px;
  background:#FFFBF4;color:#2F1D14;box-shadow:0 18px 40px -12px rgba(0,0,0,.55);transform:translate(-50%,-140%);transition:transform .45s cubic-bezier(.2,1.3,.4,1);cursor:pointer}
.aviso-pix.on{transform:translate(-50%,0)}
.aviso-pix .ap-ic{width:44px;height:44px;border-radius:12px;background:#2F1D14;display:grid;place-items:center;flex:none}.aviso-pix .ap-ic svg{width:26px;height:26px}
.aviso-pix .ap-tx{flex:1;min-width:0}.aviso-pix .ap-topo{display:flex;justify-content:space-between;font-size:12px;color:#8A776A}.aviso-pix .ap-topo b{color:#7A5641;letter-spacing:.04em;text-transform:uppercase}
.aviso-pix .ap-t{font-weight:900;font-size:16px;margin-top:2px}.aviso-pix .ap-d{font-size:13.5px;margin-top:2px;line-height:1.3}
#placar-publico{position:fixed;inset:0;z-index:90;overflow:auto;background:var(--papel)}
`;
document.head.appendChild(css2);

/* ---------------- Gincana: tabela por prova (cliente, gerente e página pública) ---------------- */
function tabelaGincana(g){
  if (!g.provas.length) return '<p>Nenhuma prova lançada ainda.</p>';
  const eq = g.equipes.map(e => e.grupo);
  return `<div class="scroll"><table class="tab-gincana"><thead><tr><th>Prova</th>${eq.map(e => `<th>${esc(e.replace(/^equipe\s+/i, ""))}</th>`).join("")}</tr></thead>
    <tbody>${g.provas.map(p => `<tr><td><b>${esc(p.nome)}</b>${p.descricao ? `<br><small style="color:var(--cinza)">${esc(p.descricao)}</small>` : ""}</td>${eq.map(e => `<td>${p.pontos[e] != null ? fmt(p.pontos[e]) : "–"}</td>`).join("")}</tr>`).join("")}</tbody>
    <tfoot><tr><td>Total</td>${g.equipes.map(e => `<td>${fmt(e.total)}</td>`).join("")}</tr></tfoot></table></div>`;
}
window.jgGincana = async function(){
  try { const g = await rpc("placar_gincana", {}), meu = minhaConta && minhaConta.grupo;
    $("#jg-c").innerHTML = `<div class="bloco"><h4>Placar da gincana</h4>${g.equipes.length ? barrasGincana(g.equipes, meu) : "<p>Sem equipes ainda.</p>"}</div>
      <div class="bloco"><h4>Pontos por prova</h4>${tabelaGincana(g)}</div>`;
  } catch (e) { $("#jg-c").innerHTML = `<div class="vazio">${esc(e.message)}</div>`; }
};
window.gGincana = async function(){
  const g = await rpc("placar_gincana", {});
  const grupos = [...new Set([...contas.filter(c => c.papel === "cliente" && c.ativo).map(c => c.grupo).filter(Boolean), ...g.equipes.map(e => e.grupo)])].sort();
  $("#r-c").innerHTML = `<button class="btn amarelo" id="gi-nova">+ Nova prova</button>
    <div class="bloco"><h4>Placar</h4>${g.equipes.length ? barrasGincana(g.equipes) : "<p>Sem equipes ainda.</p>"}</div>
    ${g.provas.length ? `<h2>Provas</h2><div class="lista">${g.provas.map(p => `<div class="lote-item"><div style="flex:1;min-width:0"><div style="font-weight:800">${esc(p.nome)}</div>
      <div style="font-size:12.5px;color:var(--cinza)">${Object.keys(p.pontos).length ? Object.entries(p.pontos).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${esc(k)}: ${v}`).join(" · ") : "sem pontos ainda"}</div></div>
      <button class="mini" data-pt="${p.id}">Lançar pontos</button><button class="mini cl" data-ep="${p.id}">✎</button></div>`).join("")}</div>` : '<div class="vazio">Crie as provas da gincana e lance os pontos de cada equipe. O placar do telão e o dos clientes se atualizam sozinhos.</div>'}`;
  const formProva = p => { abrirModal(`<h3>${p ? "Editar prova" : "Nova prova"}</h3>
      <label>Nome da prova</label><input id="gp-n" maxlength="60" value="${esc(p ? p.nome : "")}" placeholder="ex.: Corrida do saco">
      <label>Descrição (opcional)</label><input id="gp-d" maxlength="140" value="${esc(p && p.descricao || "")}">
      ${p ? '<label class="lembrar"><input type="checkbox" id="gp-a" checked><span class="chave"></span>Contar no placar</label>' : ""}
      <div id="t-erro" class="erro hidden"></div><button class="btn amarelo" id="gp-ok">Salvar</button><button class="btn claro" onclick="fecharModal()">Cancelar</button>`);
    $("#gp-ok").onclick = async () => { try { const r = await rpc("ger_salvar_prova", { p_token: sessao.token, p_id: p ? p.id : null, p_nome: $("#gp-n").value, p_descricao: $("#gp-d").value, p_ativa: p ? $("#gp-a").checked : true });
      fecharModal(); toast("Prova salva ✔"); if (!p) lancar({ id: r.id, nome: $("#gp-n") ? "" : "", pontos: {} }, true); else gGincana(); } catch (e) { mostrarErro(e.message); } }; };
  const lancar = (p, nova) => { abrirModal(`<h3>Pontos${p.nome ? ": " + esc(p.nome) : " da prova"}</h3><p>Digite os pontos de cada equipe nesta prova.</p>
      ${grupos.map(gr => `<div class="cfg-linha"><div><b>${esc(gr)}</b></div><input type="number" inputmode="numeric" data-g="${esc(gr)}" value="${p.pontos[gr] != null ? p.pontos[gr] : ""}" placeholder="0"></div>`).join("") || "<p>Cadastre clientes com equipe primeiro.</p>"}
      <div class="valores">${[["1º lugar",100],["2º",70],["3º",50],["participou",20]].map(([t, v]) => `<span class="chip" style="cursor:default">${t}: ${v}</span>`).join("")}</div>
      <div id="t-erro" class="erro hidden"></div><button class="btn amarelo" id="gl-ok">Salvar pontos</button><button class="btn claro" onclick="fecharModal()">${nova ? "Depois" : "Cancelar"}</button>`);
    $("#gl-ok").onclick = async () => { const pts = {}; $$("#modal-corpo [data-g]").forEach(i => { if (i.value !== "") pts[i.dataset.g] = Number(i.value); });
      try { await rpc("ger_pontuar_prova", { p_token: sessao.token, p_prova: p.id, p_pontos: pts }); fecharModal(); toast("Pontos lançados ✔"); gGincana(); } catch (e) { mostrarErro(e.message); } };
    const _f = fecharModal; };
  $("#gi-nova").onclick = () => formProva(null);
  $$("#r-c [data-pt]").forEach(b => b.onclick = () => lancar(g.provas.find(p => String(p.id) === b.dataset.pt)));
  $$("#r-c [data-ep]").forEach(b => b.onclick = () => formProva(g.provas.find(p => String(p.id) === b.dataset.ep)));
};

/* Página pública do placar (QR do telão): index.html#placar */
async function placarPublico(){
  let el = $("#placar-publico");
  if (!el) { el = document.createElement("div"); el.id = "placar-publico"; document.body.appendChild(el); }
  try { const g = await rpc("placar_gincana", {});
    el.innerHTML = `<header class="topo"><div class="in"><div class="marca"><div class="selo">${document.querySelector(".marca .selo").innerHTML}</div><div><b>Banco Ágape</b><small>Placar da gincana</small></div></div>
      <button class="icone-btn" id="pp-x" aria-label="Fechar">✕</button></div></header>
      <div class="wrap"><div class="bloco"><h4>Classificação</h4>${g.equipes.length ? barrasGincana(g.equipes) : "<p>Sem pontos ainda.</p>"}</div>
      <div class="bloco"><h4>Pontos por prova</h4>${tabelaGincana(g)}</div>
      <p style="text-align:center;font-size:12.5px;color:var(--cinza)">Atualizado às ${hora(g.atualizado)} · atualiza sozinho</p></div>`;
    $("#pp-x").onclick = () => { el.remove(); clearInterval(placarPublico._t); if (location.hash === "#placar") history.replaceState(null, "", location.pathname + location.search); };
  } catch (e) { el.innerHTML = `<div class="wrap"><div class="vazio">Não consegui carregar o placar. Confira a internet.</div></div>`; }
  clearInterval(placarPublico._t); placarPublico._t = setInterval(() => { if ($("#placar-publico")) placarPublico(); }, 15000);
}
window.placarPublico = placarPublico;
if (location.hash === "#placar") setTimeout(placarPublico, 50);
addEventListener("hashchange", () => { if (location.hash === "#placar") placarPublico(); });
// QR do telão escaneado dentro do app
const _tratarQR = tratarQR;
tratarQR = function(cod){ if (/#placar$/i.test(String(cod))) { fecharModal(); return placarPublico(); } return _tratarQR(cod); };
const _decodificar = decodificar;
decodificar = function(img, w, h){ const r = jsQR(img.data, w, h, { inversionAttempts: "dontInvert" }); if (r && /#placar$/i.test(r.data.trim())) return r.data.trim(); return _decodificar(img, w, h); };

/* ---------------- Sorteio ---------------- */
let sorteados = [];
window.gSorteio = async function(){
  const ativs = await rpc("programacao", { p_token: sessao.token }).catch(() => []);
  const grupos = [...new Set(contas.filter(c => c.papel === "cliente" && c.ativo).map(c => c.grupo).filter(Boolean))].sort();
  $("#r-c").innerHTML = `<div class="bloco"><h4>Quem entra no sorteio?</h4>
      <select id="so-f" style="margin-top:10px"><option value="todos">Todos os clientes</option>${grupos.map(g => `<option value="g:${esc(g)}">Só a ${esc(g)}</option>`).join("")}
        <option value="saldo">Quem tem saldo</option>${ativs.filter(a => a.presentes > 0).map(a => `<option value="a:${a.id}">Fez check-in em: ${esc(a.titulo)}</option>`).join("")}</select>
      <label class="lembrar"><input type="checkbox" id="so-rep" checked><span class="chave"></span>Não repetir quem já foi sorteado</label>
      <p id="so-n" style="font-size:13px"></p></div>
    <button class="btn amarelo" id="so-ir" style="font-size:18px;padding:18px">🎰 Sortear agora</button>
    ${sorteados.length ? `<h2>Já sorteados</h2><div class="lista">${sorteados.map((s, i) => `<div class="item"><div style="width:28px;font-weight:900">${i + 1}º</div><div class="meio"><div class="t1">${esc(s.nome)}</div><div class="t2">${esc(s.grupo || "")} · ${hora(s.quando)}</div></div></div>`).join("")}</div>
      <button class="btn claro" id="so-limpa">Limpar lista de sorteados</button>` : ""}`;
  const candidatos = async () => { const f = $("#so-f").value; let l = contas.filter(c => c.papel === "cliente" && c.ativo);
    if (f.startsWith("g:")) l = l.filter(c => c.grupo === f.slice(2));
    if (f === "saldo") l = l.filter(c => c.saldo > 0);
    if (f.startsWith("a:")) { const r = await rpc("ger_presencas", { p_token: sessao.token, p_atividade: Number(f.slice(2)) }); const ids = new Set(r.presentes.map(p => p.conta_id)); l = l.filter(c => ids.has(c.id)); }
    if ($("#so-rep").checked) { const ja = new Set(sorteados.map(s => s.id)); l = l.filter(c => !ja.has(c.id)); }
    return l; };
  const contar = async () => { const l = await candidatos(); $("#so-n").textContent = `${l.length} pessoa(s) participando.`; };
  $("#so-f").onchange = contar; $("#so-rep").onchange = contar; contar();
  if ($("#so-limpa")) $("#so-limpa").onclick = () => { sorteados = []; gSorteio(); };
  $("#so-ir").onclick = async () => { const l = await candidatos(); if (!l.length) return toast("Ninguém para sortear com esse filtro."); rodarSorteio(l); };
};
function rodarSorteio(lista){
  const g = lista[Math.floor(Math.random() * lista.length)];
  const voltas = Math.max(30, Math.min(60, lista.length * 3));
  const nomes = []; for (let i = 0; i < voltas; i++) nomes.push(lista[Math.floor(Math.random() * lista.length)].nome); nomes.push(g.nome);
  abrirTelaoSorteio(`<div class="sorteio-tela"><div class="olho" style="font-size:clamp(13px,1.8vw,20px)">Sorteio · Retiro Reconectados 2027</div>
    <div class="rolo"><div class="fita" id="so-fita">${nomes.map(n => `<div>${esc(n)}</div>`).join("")}</div></div><div id="so-res" style="min-height:160px;text-align:center"></div></div>`);
  const fita = $("#so-fita"), alt = fita.firstElementChild.offsetHeight, fim = -(nomes.length - 1) * alt, dur = 4800, t0 = performance.now();
  try { destravar(); } catch (e) {}
  let ultimo = -1;
  const passo = t => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4), y = fim * e; fita.style.transform = `translateY(${y}px)`;
    const idx = Math.floor(-y / alt); if (idx !== ultimo) { ultimo = idx; try { if (navigator.vibrate) navigator.vibrate(5); } catch (x) {} }
    if (p < 1) return requestAnimationFrame(passo);
    sorteados.push({ id: g.id, nome: g.nome, grupo: g.grupo, quando: new Date().toISOString() });
    $("#so-res").innerHTML = `<div class="ganhador">${esc(g.nome)}</div><div style="color:#E9DCCF;font-size:clamp(16px,2.4vw,26px);font-weight:700;margin-top:6px">${esc(g.grupo || "")}</div>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:20px"><button class="btn amarelo" id="so-premio" style="width:auto;padding:14px 22px">Dar prêmio em α$</button>
      <button class="btn claro" id="so-denovo" style="width:auto;padding:14px 22px;color:#fff;border-color:rgba(255,255,255,.3)">Sortear de novo</button></div>`;
    confete(); try { plim(); } catch (x) {}
    $("#so-premio").onclick = () => premiar(g);
    $("#so-denovo").onclick = async () => { fecharTelaoSorteio(); await gSorteio(); $("#so-ir").click(); };
  };
  requestAnimationFrame(passo);
}
function abrirTelaoSorteio(html){
  let t = $("#telao-sorteio"); if (!t) { t = document.createElement("div"); t.id = "telao-sorteio"; t.className = "telao"; document.body.appendChild(t); }
  t.innerHTML = `<button class="fechar" id="ts-x">Fechar ✕</button>${html}`; t.classList.remove("hidden");
  $("#ts-x").onclick = fecharTelaoSorteio;
}
function fecharTelaoSorteio(){ const t = $("#telao-sorteio"); if (t) t.remove(); const c = $("#confete"); if (c) c.remove(); if ($("#so-ir")) gSorteio(); }
function premiar(g){
  abrirModal(`<h3>Prêmio para ${esc(g.nome)}</h3><label>Valor (α$)</label><input id="pr-v" type="number" inputmode="numeric" min="1" value="20">
    <div id="t-erro" class="erro hidden"></div><button class="btn amarelo" id="pr-ok">Pagar prêmio</button><button class="btn claro" onclick="fecharModal()">Cancelar</button>`);
  const m = $("#modal"); m.style.zIndex = 95;
  $("#pr-ok").onclick = async () => { const v = Number($("#pr-v").value); if (!v || v <= 0) return mostrarErro("Informe o valor.");
    try { await rpc("ger_pagar", { p_token: sessao.token, p_contas: [g.id], p_valor: v, p_descricao: "Prêmio do sorteio", p_foto: null, p_chave: "s" + Date.now() });
      fecharModal(); m.style.zIndex = ""; somCofre(); avisoPix(g, v); } catch (e) { mostrarErro(e.message); } };
}
const audioCofre = new Audio("sons/cofre.wav?v=2"); audioCofre.preload = "auto";
function somCofre(){ try { audioCofre.currentTime = 0; audioCofre.play().catch(() => {}); if (navigator.vibrate) navigator.vibrate([30, 40, 30]); } catch (e) {} }
function avisoPix(g, v){
  const n = document.createElement("div"); n.className = "aviso-pix";
  n.innerHTML = `<div class="ap-ic">${document.querySelector(".marca .selo").innerHTML}</div>
    <div class="ap-tx"><div class="ap-topo"><b>Banco Ágape</b><span>agora</span></div>
    <div class="ap-t">Agapix recebido! 🎉</div><div class="ap-d">${esc(g.nome)} recebeu <b>${agTxt(v)}</b> · Prêmio do sorteio</div></div>`;
  document.body.appendChild(n); requestAnimationFrame(() => n.classList.add("on"));
  setTimeout(() => { n.classList.remove("on"); setTimeout(() => n.remove(), 500); }, 5000);
  n.onclick = () => { n.classList.remove("on"); setTimeout(() => n.remove(), 500); };
}
function confete(){
  const c = document.createElement("canvas"); c.id = "confete"; document.body.appendChild(c); const x = c.getContext("2d");
  c.width = innerWidth * devicePixelRatio; c.height = innerHeight * devicePixelRatio; x.scale(devicePixelRatio, devicePixelRatio);
  const cores = ["#F5C23F", "#FFE08A", "#ffffff", "#D9A227", "#7FC694"], ps = Array.from({ length: 160 }, () => ({ x: innerWidth / 2, y: innerHeight * .45,
    vx: (Math.random() - .5) * 14, vy: -Math.random() * 14 - 4, r: 4 + Math.random() * 6, c: cores[Math.floor(Math.random() * cores.length)], a: Math.random() * 6, va: (Math.random() - .5) * .3 }));
  let n = 0; const tique = () => { x.clearRect(0, 0, innerWidth, innerHeight);
    ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .35; p.vx *= .99; p.a += p.va; x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c; x.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); x.restore(); });
    if (++n < 220 && document.body.contains(c)) requestAnimationFrame(tique); else c.remove(); };
  tique();
}

/* ---------------- Controle da economia: tudo clicável ---------------- */
const classe = t => { const d = t.descricao || ""; return /^Recebido de /.test(d) ? "transf_in" : /^Enviado para /.test(d) ? "transf_out" : /^Estorno:/.test(d) ? "estorno"
  : t.valor < 0 ? "retirada" : /^Check-in:/.test(d) ? "checkin" : /^Quiz/.test(d) ? "quiz" : /^Desafio:/.test(d) ? "desafio" : /^Enquete/.test(d) ? "enquete" : "pagamento"; };
let movCache = null;
async function movimentos(){ movCache = await rpc("ger_transacoes", { p_token: sessao.token, p_limite: 1000 }); return movCache; }
function detalhe(titulo, lista, mostrarTotal = true){
  const tot = lista.reduce((s, t) => s + t.valor, 0);
  abrirModal(`<h3>${titulo}</h3><p>${lista.length} movimentação(ões)${mostrarTotal ? ` · total ${tot < 0 ? "−" : ""}${agTxt(Math.abs(tot))}` : ""}</p>
    <div class="lista" style="margin:10px 0;max-height:60vh;overflow:auto">${lista.length ? lista.map(t => linhaTransacao(t, true)).join("") : '<div class="vazio">Nada por aqui.</div>'}</div>
    <button class="btn claro" onclick="fecharModal()">Fechar</button>`);
  $$("#modal-corpo [data-foto]").forEach(el => el.onclick = () => verFoto(el.dataset.foto));
}
async function abrirDetalheControle(tipo, valor){
  abrirModal(`<h3>Carregando…</h3><div class="vazio">Buscando movimentações</div>`);
  if (tipo === "circulacao") {
    const l = contas.filter(c => c.papel === "cliente" && c.ativo).sort((a, b) => b.saldo - a.saldo), tot = l.reduce((s, c) => s + c.saldo, 0);
    return abrirModal(`<h3>Em circulação</h3><p>${agTxt(tot)} com ${l.length} clientes · do maior para o menor saldo</p>
      <div class="lista" style="margin:10px 0;max-height:60vh;overflow:auto">${l.map((c, i) => `<div class="item"><div style="width:30px;font-weight:900;color:var(--marrom2)">${i + 1}º</div><div class="meio"><div class="t1">${esc(c.nome)}</div><div class="t2">${esc(c.grupo || "")} · ${tot ? Math.round(100 * c.saldo / tot) : 0}% do total</div></div><div class="val">${agTxt(c.saldo)}</div></div>`).join("")}</div>
      <button class="btn claro" onclick="fecharModal()">Fechar</button>`);
  }
  const l = (await movimentos()).filter(t => !t.estornado || tipo === "retirada");
  const ORIG = { pagamento: "Pagamentos do gerente", checkin: "Check-ins", quiz: "Quiz", desafio: "Desafios", enquete: "Enquetes" };
  if (tipo === "injetado") return detalhe("Tudo que foi injetado", l.filter(t => t.valor > 0 && !["transf_in","estorno"].includes(classe(t))));
  if (tipo === "retirado") return detalhe("Retiradas", l.filter(t => classe(t) === "retirada"));
  if (tipo === "transferido") return detalhe("Transferências entre pessoas", l.filter(t => classe(t) === "transf_in"));
  if (tipo === "origem") return detalhe(ORIG[valor] || valor, l.filter(t => t.valor > 0 && classe(t) === valor));
  if (tipo === "dia") return detalhe("Movimentações de " + new Date(valor + "T12:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" }),
    l.filter(t => { const d = new Date(t.criado_em); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}` === valor; }), false);
  if (tipo === "hora") return detalhe("Movimentações das " + new Date(valor).getHours() + "h", l.filter(t => Math.abs(new Date(t.criado_em) - new Date(valor) - 30 * 60e3) <= 30 * 60e3), false);
}
window.abrirDetalheControle = abrirDetalheControle;
// liga os cliques depois que o painel é desenhado
const _desenharPainel = desenharPainel;
desenharPainel = function(e){
  _desenharPainel(e);
  const tiles = $$("#g-painel .kpi"), tipos = ["circulacao", "injetado", "retirado", "transferido"];
  tiles.forEach((k, i) => { k.classList.add("clicavel-k"); k.onclick = () => abrirDetalheControle(tipos[i]); });
  const orig = Object.entries(e.por_origem || {}).sort((a, b) => b[1] - a[1]);
  $$("#g-painel .bloco")[0] && $$("#g-painel .bloco")[0].querySelectorAll(".barra").forEach((b, i) => { b.classList.add("clicavel-k"); b.style.cursor = "pointer"; b.onclick = () => abrirDetalheControle("origem", orig[i][0]); });
  $$("#g-painel .tabela-dia tbody tr").forEach((tr, i) => { tr.classList.add("clicavel-k"); tr.onclick = () => abrirDetalheControle("dia", e.por_dia[i].dia); });
  const p = $("#g-painel p"); if (p && !$("#g-painel .dica-clique")) p.insertAdjacentHTML("afterend", '<p class="dica-clique" style="font-size:12.5px;color:var(--cinza);margin:6px 2px 0">Toque em qualquer número para ver os detalhes.</p>');
};
const _graficoHoras = graficoHoras;
graficoHoras = async function(){ await _graficoHoras(); const s = $("#gh-svg"); if (!s) return;
  s.style.cursor = "pointer"; s.onclick = ev => { const r = ev.target.closest("rect"); if (!r) return; const t = r.querySelector("title"); if (!t) return;
    const l = (window._horasCache || []); const h = l.find(x => t.textContent.startsWith(hora(x.hora))); if (h) abrirDetalheControle("hora", h.hora); }; };
}
