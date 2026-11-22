import React from 'react';
import {AbsoluteFill, Easing, Img, staticFile, useCurrentFrame} from 'remotion';
import {loadFonts} from './fonts';

// Contribuição do visitante via QR Code → 7me. Mesmo design system do Fachadômetro azul.
export const DFPS = 30, DW = 1920, DH = 1080, DDUR = 30, SLOW = 1.5;
const W = DW, H = DH, DUR = DDUR, FPS = DFPS;
const C = {navy: '#0B2257', navy2: '#163A8C', blue: '#2563EB', sky: '#7FA8FF', gold: '#F2B51C', soft: '#AFC3EA', ok: '#22C55E'};
const SANS = "'Montserrat', sans-serif", NUM = "'Anton', sans-serif", UI = "'Inter', sans-serif";
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const eo = Easing.bezier(0.16, 1, 0.3, 1), eio = Easing.bezier(0.65, 0, 0.35, 1), ei = Easing.bezier(0.5, 0, 0.75, 0), eb = Easing.bezier(0.34, 1.56, 0.64, 1);
const pa = (T: number, s: number, d: number, e = eo) => e(clamp((T - s) / d));
const win = (T: number, a: number, b: number, fi = 0.4, fo = 0.35) => Math.min(pa(T, a, fi), 1 - pa(T, b - fo, fo, ei));
const rand = (s: number) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

const Bg: React.FC<{T: number}> = ({T}) => {
  const b = (cx: number, cy: number, r: number, c: string, a: number, sp: number, ph: number) => {
    const x = cx + Math.sin(T * sp + ph) * 7, y = cy + Math.cos(T * sp * 0.8 + ph) * 6;
    return `radial-gradient(circle at ${x}% ${y}%, ${c.replace('A', String(a))} 0%, transparent ${r}%)`; };
  return (<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, #0E2A66 0%, #071840 55%, #030B22 100%)'}}>
    <AbsoluteFill style={{background: [b(2, 4, 42, 'rgba(37,99,235,A)', 0.75, 0.35, 0), b(100, 2, 30, 'rgba(127,168,255,A)', 0.35, 0.3, 2), b(98, 100, 44, 'rgba(37,99,235,A)', 0.7, 0.28, 4), b(0, 100, 30, 'rgba(22,58,140,A)', 0.8, 0.33, 1)].join(','), filter: 'blur(40px)'}} />
  </AbsoluteFill>);
};
const Grain: React.FC<{f: number}> = ({f}) => <AbsoluteFill style={{opacity: 0.09, mixBlendMode: 'screen', backgroundImage: `url(${staticFile('images/grain.png')})`, backgroundSize: '480px', backgroundPosition: `${rand(Math.floor(f / 2)) * 400}px ${rand(Math.floor(f / 2) + 7) * 400}px`}} />;
const Grid: React.FC<{k: number; w?: number; h?: number}> = ({k, w = W, h = H}) => (
  <svg style={{position: 'absolute', inset: 0, opacity: k}} width={w} height={h}>
    <defs><radialGradient id="gr"><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient><mask id="gm"><rect width={w} height={h} fill="url(#gr)" /></mask></defs>
    <g mask="url(#gm)" stroke="rgba(255,255,255,0.09)" strokeWidth={1.2}>
      {Array.from({length: Math.ceil(w / 70) + 1}).map((_, i) => <line key={'v' + i} x1={i * 70} y1={0} x2={i * 70} y2={h} />)}
      {Array.from({length: Math.ceil(h / 70) + 1}).map((_, i) => <line key={'h' + i} x1={0} y1={i * 70} x2={w} y2={i * 70} />)}
    </g></svg>);
const Swipe: React.FC<{T: number; t: number}> = ({T, t}) => {
  const p = clamp((T - (t - 0.35)) / 0.7); if (p <= 0 || p >= 1) return null;
  return (<AbsoluteFill>{[0, 1, 2].map((i) => { const q = eio(clamp(p * 1.3 - i * 0.12)); const x = lerp(-140, 140, q);
    return <div key={i} style={{position: 'absolute', top: '-20%', bottom: '-20%', left: `${x - 30 + i * 6}%`, width: `${i === 1 ? 70 : 18}%`, transform: 'skewX(-18deg)',
      background: i === 1 ? 'linear-gradient(90deg, #FFFFFF, #DCE7FF)' : i === 0 ? C.sky : C.blue}} />; })}</AbsoluteFill>);
};
const Pill: React.FC<{children: React.ReactNode; dark?: boolean; size?: number}> = ({children, dark, size = 30}) => (
  <span style={{display: 'inline-block', fontFamily: SANS, fontWeight: 800, fontSize: size, letterSpacing: size * 0.16, color: dark ? '#fff' : C.navy, background: dark ? C.navy : '#fff',
    padding: '8px 22px', borderRadius: 999, boxShadow: '0 0 30px rgba(127,168,255,0.55)'}}>{children}</span>);
const Letters: React.FC<{T: number; a: number; text: string; size: number; color?: string; italic?: boolean}> = ({T, a, text, size, color = '#fff', italic}) => (
  <span style={{whiteSpace: 'nowrap'}}>{text.split('').map((c, i) => { const q = pa(T, a + i * 0.03, 0.55, eb); const o = clamp((T - a - i * 0.03) * 6);
    return <span key={i} style={{display: 'inline-block', whiteSpace: 'pre', opacity: o, transform: `translateY(${(1 - q) * -60}px) scale(${lerp(1.5, 1, q)})`, filter: `blur(${(1 - clamp(q * 1.2)) * 10}px)`,
      fontFamily: SANS, fontWeight: 900, fontStyle: italic ? 'italic' : 'normal', fontSize: size, letterSpacing: -2, lineHeight: 1.05, color, textShadow: '0 0 40px rgba(127,168,255,0.7)'}}>{c}</span>; })}</span>);

/* QR ilustrativo (substituir pela imagem real do QR da igreja: public/images/qr.png) */
const QR_N = 25;
const qrCell = (x: number, y: number) => {
  const finder = (fx: number, fy: number) => { const dx = x - fx, dy = y - fy; if (dx < 0 || dy < 0 || dx > 6 || dy > 6) return -1; return (dx === 0 || dy === 0 || dx === 6 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4)) ? 1 : 0; };
  for (const [fx, fy] of [[0, 0], [QR_N - 7, 0], [0, QR_N - 7]]) { const v = finder(fx, fy); if (v >= 0) return v === 1; }
  if ((x === 7 || y === 7) && (x < 8 && y < 8)) return false; if (x === QR_N - 8 && y < 8) return false; if (y === QR_N - 8 && x < 8) return false;
  if (x >= 9 && x <= 15 && y >= 9 && y <= 15) return false; // centro livre p/ o logo
  return rand(x * 31 + y * 7 + 3) > 0.52;
};
const QR: React.FC<{size: number}> = ({size}) => { const c = size / QR_N;
  return (<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
    <rect width={size} height={size} fill="#fff" />
    {Array.from({length: QR_N * QR_N}).map((_, i) => { const x = i % QR_N, y = Math.floor(i / QR_N); return qrCell(x, y) ? <rect key={i} x={x * c} y={y * c} width={c + 0.5} height={c + 0.5} fill={C.navy} /> : null; })}
    <rect x={9.4 * c} y={9.4 * c} width={6.2 * c} height={6.2 * c} rx={c} fill={C.navy} />
    <text x={size / 2} y={size / 2 + c * 1.1} textAnchor="middle" fontFamily="Anton" fontSize={c * 3.2} fill="#fff">7me</text>
  </svg>); };

/* placa com o QR (o que o visitante vê na igreja) */
const Placa: React.FC<{w: number}> = ({w}) => (
  <div style={{width: w, padding: w * 0.07, borderRadius: w * 0.07, background: '#fff', boxShadow: '0 40px 90px rgba(0,0,0,0.5)', textAlign: 'center'}}>
    <div style={{fontFamily: SANS, fontWeight: 900, fontSize: w * 0.085, color: C.navy, lineHeight: 1, marginBottom: w * 0.05}}>CONTRIBUA AQUI</div>
    <QR size={w * 0.86} />
    <div style={{fontFamily: SANS, fontWeight: 700, fontSize: w * 0.05, color: C.navy2, marginTop: w * 0.045, letterSpacing: w * 0.004}}>aponte a câmera do celular</div>
  </div>);

/* telas do celular */
const PW = 470, PH = 960;
const PIX = '00020126580014BR.GOV.BCB.PIX0136a1b2c3d4-iasd-parque-vitoria520400005303986540550.005802BR5925IGREJA ADVENTISTA 7 DIA6009SAO PAULO62070503***6304A1B2';
const Tap: React.FC<{T: number; t: number; x: string | number; y: string | number}> = ({T, t, x, y}) => { const q = (T - t) / 0.55; if (q < 0 || q > 1) return null;
  return <div style={{position: 'absolute', left: x, top: y, width: 34, height: 34, marginLeft: -17, marginTop: -17, borderRadius: 17, background: 'rgba(11,34,87,0.35)', border: '2px solid rgba(255,255,255,0.8)', transform: `scale(${1 + q * 4})`, opacity: 1 - q, zIndex: 9}} />; };
const press = (T: number, t: number) => (T > t && T < t + 0.25 ? 0.95 : 1);
const Screen: React.FC<{T: number}> = ({T}) => {
  const cam = pa(T, 4.6, 0.6, eio);
  const app = pa(T, 8.2, 0.6, eio);
  const pix = pa(T, 11.15, 0.55, eio);
  const sw = pa(T, 13.5, 0.7, eio);                 // troca de app → banco
  const bk2 = pa(T, 14.75, 0.5, eio), bk3 = pa(T, 15.55, 0.5, eio), bk4 = pa(T, 16.9, 0.5, eio), done = pa(T, 18.3, 0.4);
  const qrZ = lerp(0.55, 1, pa(T, 5.3, 1.5, eio)); const lock = pa(T, 6.85, 0.35, eb);
  const laser = T > 5.7 && T < 6.85 ? (T - 5.7) / 1.15 : -1;
  const ban = win(T, 7.15, 8.5, 0.45, 0.2); const sway = (1 - lock) * Math.sin(T * 2.1) * 10;
  const field = (txt: React.ReactNode, active: boolean) => <div style={{height: 88, borderRadius: 18, background: '#fff', border: `3px solid ${active ? C.blue : '#D5DEEF'}`, display: 'flex', alignItems: 'center', padding: '0 22px', fontFamily: NUM, fontSize: 44, overflow: 'hidden'}}>{txt}</div>;
  const caret = (on: boolean) => on && Math.floor(T * 3) % 2 === 0 ? <span style={{width: 3, height: 44, background: C.blue, marginLeft: 4}} /> : null;
  return (<div style={{position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 56, background: '#000'}}>
    {/* bloqueio */}
    <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(170deg,#3b5f99,#0d1730)'}}>
      <div style={{position: 'absolute', top: 120, width: '100%', textAlign: 'center', fontFamily: UI, fontWeight: 500, fontSize: 24, color: '#fff', opacity: 0.85}}>sábado</div>
      <div style={{position: 'absolute', top: 150, width: '100%', textAlign: 'center', fontFamily: UI, fontWeight: 700, fontSize: 110, color: '#fff', letterSpacing: -3}}>10:42</div>
      <div style={{position: 'absolute', bottom: 60, left: 50, width: 70, height: 70, borderRadius: 35, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <svg width={34} height={34} viewBox="0 0 24 24"><path d="M4 7h3l2-2h6l2 2h3v12H4z" fill="none" stroke="#fff" strokeWidth={2} /><circle cx={12} cy={13} r={3.5} fill="none" stroke="#fff" strokeWidth={2} /></svg></div>
      <Tap T={T} t={4.25} x={85} y={PH - 95} />
    </div>
    {/* câmera */}
    <div style={{position: 'absolute', inset: 0, transform: `translateY(${(1 - cam) * 100}%)`, background: 'radial-gradient(ellipse at 50% 50%, #3a4252, #11151d 75%)'}}>
      <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `translate(${sway}px, ${sway * 0.6}px) scale(${qrZ})`, filter: `blur(${(1 - pa(T, 5.0, 1.2)) * 4}px)`}}><Placa w={330} /></div>
      {(() => { const s = lerp(340, 270, lock), cx = PW / 2, cy = PH / 2 + 22, col = lock > 0.5 ? C.gold : '#fff', L = 46;
        return <svg width={PW} height={PH} style={{position: 'absolute', inset: 0}}>
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy], i) => { const x = cx + sx * s / 2, y = cy + sy * s / 2;
            return <path key={i} d={`M${x},${y - sy * L} L${x},${y} L${x - sx * L},${y}`} fill="none" stroke={col} strokeWidth={7} strokeLinecap="round" style={{filter: `drop-shadow(0 0 8px ${col})`}} />; })}
          {laser >= 0 && (() => { const ly = cy - s / 2 + s * (0.5 - 0.5 * Math.cos(laser * Math.PI * 2)); return <line x1={cx - s / 2 + 10} x2={cx + s / 2 - 10} y1={ly} y2={ly} stroke={C.sky} strokeWidth={4} style={{filter: 'drop-shadow(0 0 10px #7FA8FF)'}} />; })()}
        </svg>; })()}
      <div style={{position: 'absolute', bottom: 46, left: '50%', marginLeft: -42, width: 84, height: 84, borderRadius: 42, border: '6px solid #fff', background: 'rgba(255,255,255,0.15)'}} />
      <div style={{position: 'absolute', top: 70, width: '100%', textAlign: 'center', fontFamily: UI, fontWeight: 700, fontSize: 22, letterSpacing: 3, color: C.gold}}>FOTO · VÍDEO</div>
      <div style={{position: 'absolute', inset: 0, background: '#fff', opacity: T > 6.85 ? Math.max(0, 0.5 - (T - 6.85) * 1.6) : 0}} />
      {ban > 0 && <div style={{position: 'absolute', left: 18, right: 18, top: 60, transform: `translateY(${(1 - pa(T, 7.15, 0.5, eb)) * -160}px) scale(${press(T, 7.9)})`, opacity: ban,
        background: 'rgba(240,244,252,0.96)', borderRadius: 26, padding: '16px 18px', display: 'flex', gap: 16, alignItems: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.45)'}}>
        <div style={{width: 58, height: 58, borderRadius: 14, background: C.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: NUM, fontSize: 26, color: '#fff'}}>7me</div>
        <div style={{fontFamily: UI, color: '#0d1426'}}><div style={{fontWeight: 700, fontSize: 22}}>Código QR</div><div style={{fontWeight: 500, fontSize: 21, opacity: 0.75}}>Abrir link do 7me</div></div></div>}
      <Tap T={T} t={7.9} x={260} y={105} />
    </div>
    {/* 7me: valor */}
    <div style={{position: 'absolute', inset: 0, transform: `translateY(${(1 - app) * 100}%) translateX(${-pix * 30}%)`, background: '#F3F6FC', fontFamily: UI, color: C.navy}}>
      <div style={{height: 240, background: `linear-gradient(160deg, ${C.navy2}, ${C.navy})`, padding: '84px 34px 0', color: '#fff'}}>
        <div style={{fontFamily: NUM, fontSize: 48, lineHeight: 1}}>7me</div><div style={{fontWeight: 500, fontSize: 21, opacity: 0.8, marginTop: 10}}>IASD Parque Vitória</div></div>
      <div style={{padding: '26px 30px'}}>
        <div style={{fontWeight: 700, fontSize: 24, marginBottom: 14}}>Tipo de contribuição</div>
        <div style={{display: 'flex', gap: 14}}>{['Dízimo', 'Oferta'].map((l, i) => { const on = i === 1 && T > 9.05;
          return <div key={l} style={{flex: 1, height: 90, borderRadius: 20, background: on ? C.navy : '#fff', color: on ? '#fff' : C.navy, border: `3px solid ${on ? C.navy : '#D5DEEF'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 26, transform: `scale(${i === 1 ? press(T, 8.95) : 1})`}}>{l}</div>; })}</div>
        <div style={{fontWeight: 700, fontSize: 24, margin: '28px 0 14px'}}>Valor</div>
        {(() => { const full = 'R$ 50,00'; const n = Math.floor(clamp((T - 9.45) / 0.8) * full.length); const on = T > 9.35 && T < 10.6;
          return field(<>{full.slice(0, n) || <span style={{fontFamily: UI, fontSize: 24, opacity: 0.4}}>R$ 0,00</span>}{caret(on)}</>, on); })()}
        <div style={{marginTop: 32, height: 90, borderRadius: 45, background: C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontWeight: 700, fontSize: 28, color: C.navy, transform: `scale(${press(T, 10.85)})`, boxShadow: '0 14px 30px rgba(242,181,28,0.45)'}}>
          <svg width={30} height={30} viewBox="0 0 24 24"><path d="M12 2l10 10-10 10L2 12z" fill="none" stroke={C.navy} strokeWidth={2.4} /></svg>Gerar Pix</div>
      </div>
      <Tap T={T} t={8.95} x={340} y={385} /><Tap T={T} t={10.85} x={235} y={705} />
    </div>
    {/* 7me: Pix copia e cola */}
    <div style={{position: 'absolute', inset: 0, transform: `translateX(${(1 - pix) * 100}%)`, background: '#F3F6FC', fontFamily: UI, color: C.navy}}>
      <div style={{height: 180, background: `linear-gradient(160deg, ${C.navy2}, ${C.navy})`, padding: '84px 34px 0', color: '#fff', fontWeight: 700, fontSize: 30}}>Pix gerado</div>
      <div style={{padding: '26px 30px'}}>
        <div style={{fontWeight: 500, fontSize: 22, opacity: 0.7}}>Valor</div><div style={{fontFamily: NUM, fontSize: 60, marginBottom: 18}}>R$ 50,00</div>
        <div style={{fontWeight: 700, fontSize: 24, marginBottom: 12}}>Pix Copia e Cola</div>
        <div style={{borderRadius: 18, background: '#fff', border: `3px dashed ${T > 12.2 ? C.ok : '#B9C6E0'}`, padding: 18, fontFamily: 'monospace', fontSize: 19, lineHeight: 1.35, wordBreak: 'break-all', height: 210, overflow: 'hidden', color: '#33415c'}}>{PIX}</div>
        <div style={{marginTop: 26, height: 90, borderRadius: 45, background: T > 12.2 ? C.ok : C.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontWeight: 700, fontSize: 28, color: '#fff', transform: `scale(${press(T, 12.05)})`}}>
          {T > 12.2 ? '✓ Código copiado' : 'Copiar código'}</div>
      </div>
      <Tap T={T} t={12.05} x={235} y={745} />
      {T > 12.25 && <div style={{position: 'absolute', left: '50%', bottom: 60, transform: `translateX(-50%) translateY(${(1 - pa(T, 12.25, 0.4, eb)) * 40}px)`, opacity: win(T, 12.25, 13.6, 0.3, 0.3), background: '#0d1426', color: '#fff', fontWeight: 600, fontSize: 22, padding: '14px 26px', borderRadius: 30, whiteSpace: 'nowrap'}}>Copiado para a área de transferência</div>}
    </div>
    {/* banco */}
    <div style={{position: 'absolute', inset: 0, transform: `translateX(${(1 - sw) * 105}%) scale(${lerp(0.85, 1, sw)})`, borderRadius: 56, overflow: 'hidden', background: '#F4F5F7', fontFamily: UI, color: '#1b1f2a'}}>
      <div style={{height: 230, background: 'linear-gradient(160deg,#2f3a4f,#151a26)', padding: '80px 32px 0', color: '#fff'}}>
        <div style={{fontWeight: 500, fontSize: 22, opacity: 0.75}}>Olá, visitante</div><div style={{fontWeight: 700, fontSize: 36, marginTop: 6}}>Seu banco</div></div>
      <div style={{padding: 28, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16}}>
        {['Pix', 'Pagar', 'Transferir', 'Cartões'].map((l, i) => <div key={l} style={{height: 130, borderRadius: 22, background: '#fff', boxShadow: '0 4px 14px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: 24, transform: `scale(${i === 0 ? press(T, 14.45) : 1})`}}>
          <svg width={36} height={36} viewBox="0 0 24 24"><path d={i === 0 ? 'M12 2l10 10-10 10L2 12z' : 'M4 6h16v12H4z'} fill="none" stroke="#2f3a4f" strokeWidth={2} /></svg>{l}</div>)}
      </div>
      <Tap T={T} t={14.45} x={130} y={330} />
      {/* menu pix */}
      <div style={{position: 'absolute', inset: 0, transform: `translateX(${(1 - bk2) * 100}%)`, background: '#F4F5F7', padding: '90px 28px'}}>
        <div style={{fontWeight: 700, fontSize: 34, marginBottom: 26}}>Área Pix</div>
        {['Pix Copia e Cola', 'Pagar com QR Code', 'Transferir com chave'].map((l, i) => <div key={l} style={{height: 96, borderRadius: 20, background: i === 0 && T > 15.25 ? '#e7ecf6' : '#fff', marginBottom: 14, display: 'flex', alignItems: 'center', padding: '0 24px', fontWeight: 600, fontSize: 25, transform: `scale(${i === 0 ? press(T, 15.25) : 1})`, boxShadow: '0 4px 14px rgba(0,0,0,0.05)'}}>{l}<span style={{marginLeft: 'auto', opacity: 0.4}}>›</span></div>)}
        <Tap T={T} t={15.25} x={200} y={238} />
      </div>
      {/* colar */}
      <div style={{position: 'absolute', inset: 0, transform: `translateX(${(1 - bk3) * 100}%)`, background: '#F4F5F7', padding: '90px 28px'}}>
        <div style={{fontWeight: 700, fontSize: 30, marginBottom: 20}}>Pix Copia e Cola</div>
        <div style={{fontWeight: 500, fontSize: 22, opacity: 0.7, marginBottom: 12}}>Cole o código aqui</div>
        <div style={{position: 'relative', borderRadius: 18, background: '#fff', border: `3px solid ${T > 16.35 ? '#2f3a4f' : '#cfd5e2'}`, padding: 18, height: 200, fontFamily: 'monospace', fontSize: 19, lineHeight: 1.35, wordBreak: 'break-all', overflow: 'hidden', color: '#33415c'}}>
          {T > 16.35 ? PIX : null}
          {T > 15.95 && T < 16.45 && <div style={{position: 'absolute', left: 20, top: -6, background: '#1b1f2a', color: '#fff', fontFamily: UI, fontWeight: 600, fontSize: 22, padding: '10px 22px', borderRadius: 12, transform: `scale(${press(T, 16.25)})`}}>Colar</div>}
        </div>
        <div style={{marginTop: 24, height: 86, borderRadius: 43, background: T > 16.35 ? '#2f3a4f' : '#c3c9d6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 26, transform: `scale(${press(T, 16.7)})`}}>Continuar</div>
        <Tap T={T} t={15.85} x={140} y={300} /><Tap T={T} t={16.25} x={70} y={190} /><Tap T={T} t={16.7} x={210} y={520} />
      </div>
      {/* confirmar */}
      <div style={{position: 'absolute', inset: 0, transform: `translateX(${(1 - bk4) * 100}%)`, background: '#F4F5F7', padding: '90px 28px'}}>
        <div style={{fontWeight: 700, fontSize: 30, marginBottom: 22}}>Confirme o Pix</div>
        <div style={{borderRadius: 22, background: '#fff', padding: 26, boxShadow: '0 4px 14px rgba(0,0,0,0.06)'}}>
          <div style={{fontWeight: 500, fontSize: 21, opacity: 0.6}}>Valor</div><div style={{fontFamily: NUM, fontSize: 64, marginBottom: 16}}>R$ 50,00</div>
          <div style={{fontWeight: 500, fontSize: 21, opacity: 0.6}}>Para</div><div style={{fontWeight: 700, fontSize: 25, lineHeight: 1.2}}>Igreja Adventista do Sétimo Dia</div>
          <div style={{fontWeight: 500, fontSize: 20, opacity: 0.6, marginTop: 6}}>Parque Vitória</div>
        </div>
        <div style={{marginTop: 26, height: 90, borderRadius: 45, background: '#2f3a4f', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 28, transform: `scale(${press(T, 17.85)})`}}>Confirmar Pix</div>
        <Tap T={T} t={17.85} x={210} y={560} />
      </div>
      {done > 0 && <div style={{position: 'absolute', inset: 0, background: `rgba(21,26,38,${0.95 * done})`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff'}}>
        <svg width={170} height={170} viewBox="0 0 170 170" style={{transform: `scale(${pa(T, 18.4, 0.5, eb)})`}}><circle cx={85} cy={85} r={76} fill={C.ok} />
          <path d="M50 88 L75 112 L122 62" fill="none" stroke="#fff" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={120} strokeDashoffset={120 * (1 - pa(T, 18.6, 0.4, eio))} /></svg>
        <div style={{fontWeight: 700, fontSize: 40, marginTop: 26, opacity: pa(T, 18.8, 0.4)}}>Pix enviado!</div>
        <div style={{fontWeight: 500, fontSize: 22, opacity: 0.75 * pa(T, 19.0, 0.4), marginTop: 8}}>R$ 50,00 · IASD Parque Vitória</div></div>}
    </div>
  </div>);
};

const STEPS: [number, string, string][] = [[4.3, '01', 'Aponte a câmera para o QR Code'], [8.0, '02', 'Escolha e digite o valor'], [10.7, '03', 'Gere e copie o Pix'], [13.0, '04', 'Cole no app do seu banco']];

export const Doacao: React.FC<{v?: boolean}> = ({v = false}) => {
  loadFonts();
  const f = useCurrentFrame(); const T = f / FPS / SLOW;
  const s1 = win(T, 0, 3.95, 0.3, 0.3);
  const s2 = win(T, 3.8, 21.05, 0.05, 0.3);
  const s3 = win(T, 21.05, 25.9, 0.05, 0.3);
  const s4 = pa(T, 25.85, 0.3);
  // celular: entra de baixo girando, segue a ação
  const pin = pa(T, 3.9, 0.9, eb);
  const pRotY = lerp(-38, -14, pin) + 10 * pa(T, 8.2, 0.8, eio) - 6 * pa(T, 13.5, 0.8, eio) + Math.sin(T * 0.9) * 2;
  const pRotZ = lerp(14, 3, pin) - 3 * pa(T, 8.2, 0.8, eio) + 2 * pa(T, 13.5, 0.8, eio);
  const pY = lerp(900, 0, pin) + Math.sin(T * 1.3) * 6;
  const stepI = STEPS.reduce((a, s, i) => (T >= s[0] ? i : a), -1);
  return (
    <AbsoluteFill style={{background: '#061A3A', overflow: 'hidden'}}>
      <Bg T={T} />
      <Grid k={0.8 * Math.max(win(T, 0, 4.0), s3, s4)} w={v ? 1080 : W} h={v ? 1920 : H} />

      {/* 1 · abertura */}
      {s1 > 0 && <AbsoluteFill style={{opacity: s1}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: v ? 640 : 330, textAlign: 'center', opacity: pa(T, 0.15, 0.4), transform: `translateY(${(1 - pa(T, 0.15, 0.5)) * 16}px)`}}><Pill>VISITANTE,</Pill></div>
        <div style={{position: 'absolute', left: 0, right: 0, top: v ? 720 : 410, textAlign: 'center'}}>{v ? <><Letters T={T} a={0.5} text="QUER" size={190} italic /><br /><Letters T={T} a={0.65} text="CONTRIBUIR?" size={128} italic /></> : <Letters T={T} a={0.5} text="QUER CONTRIBUIR?" size={150} italic />}</div>
        <div style={{position: 'absolute', left: 0, right: 0, top: v ? 1140 : 610, textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 40, color: C.soft, opacity: pa(T, 1.4, 0.5), transform: `translateY(${(1 - pa(T, 1.4, 0.5)) * 14}px)`}}>
          É rápido e seguro: <span style={{color: '#fff'}}>7me + Pix</span>.</div>
      </AbsoluteFill>}

      {/* 2 · demonstração */}
      {s2 > 0 && <AbsoluteFill style={{opacity: s2}}>
        <div style={{position: 'absolute', left: v ? 80 : 1030, top: v ? 150 : 220, width: v ? 920 : 780}}>
          <div style={{opacity: pa(T, 4.1, 0.4)}}><Pill size={28}>COMO CONTRIBUIR</Pill></div>
          <div style={{marginTop: 40, position: 'relative'}}>{STEPS.map(([t, n, l], i) => { const k = pa(T, t, 0.5); const on = i === stepI; if (v && !on) return null;
            return <div key={n} style={{display: 'flex', alignItems: 'center', gap: 28, marginBottom: 30, opacity: k * (on ? 1 : 0.38), transform: `translateX(${(1 - k) * 60}px) scale(${on ? 1 : 0.94})`, transformOrigin: '0 50%'}}>
              <div style={{width: 92, height: 92, borderRadius: 24, flex: 'none', background: on ? '#fff' : 'rgba(255,255,255,0.08)', border: '2px solid rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: NUM, fontSize: 46, color: on ? C.navy : '#fff', boxShadow: on ? '0 0 40px rgba(127,168,255,0.7)' : 'none'}}>{n}</div>
              <div style={{fontFamily: SANS, fontWeight: 800, fontSize: v ? 56 : 46, color: '#fff', lineHeight: 1.05, textShadow: on ? '0 0 30px rgba(127,168,255,0.6)' : 'none'}}>{l}</div></div>; })}</div>
        </div>
        <div style={{position: 'absolute', left: v ? (1080 - PW) / 2 : 340, top: v ? 500 : 60, width: PW, height: PH, perspective: 1800, transform: v ? 'scale(1.32)' : undefined, transformOrigin: '50% 0'}}>
          <div style={{position: 'absolute', inset: 0, transform: `translateY(${pY}px) rotateY(${pRotY}deg) rotateZ(${pRotZ}deg)`, borderRadius: 70, background: '#05070d', padding: 0,
            boxShadow: '0 70px 120px rgba(0,0,0,0.6), 0 0 0 3px #2b3446, 0 0 90px rgba(37,99,235,0.35)'}}>
            <div style={{position: 'absolute', inset: 14}}><Screen T={T} /></div>
            <div style={{position: 'absolute', left: '50%', top: 28, width: 130, height: 36, marginLeft: -65, borderRadius: 20, background: '#000'}} />
          </div>
        </div>
      </AbsoluteFill>}

      {/* 3 · resumo */}
      {s3 > 0 && <AbsoluteFill style={{opacity: s3}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: v ? 300 : 150, textAlign: 'center'}}><Letters T={T} a={21.2} text="SIMPLES ASSIM." size={v ? 104 : 110} italic /></div>
        {[
          ['Aponte a câmera', <svg key="a" width={84} height={84} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.6}><rect x={3} y={3} width={7} height={7} /><rect x={14} y={3} width={7} height={7} /><rect x={3} y={14} width={7} height={7} /><path d="M14 14h3v3h-3zM18 18h3v3M14 21h2" /></svg>],
          ['Digite o valor', <svg key="b" width={84} height={84} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.6}><rect x={3} y={6} width={18} height={12} rx={2} /><path d="M7 12h6M15 12h2" /></svg>],
          ['Copie o Pix', <svg key="c" width={84} height={84} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.6}><rect x={8} y={8} width={12} height={12} rx={2} /><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" /></svg>],
          ['Cole no seu banco', <svg key="d" width={84} height={84} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.6} strokeLinejoin="round"><path d="M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18" /></svg>],
        ].map(([l, ic], i) => { const k = pa(T, 21.7 + i * 0.22, 0.7, eb); const x = v ? 120 + (i % 2) * 440 : 225 + i * 380; const y = v ? 520 + Math.floor(i / 2) * 430 : 380;
          return <div key={i} style={{position: 'absolute', left: x, top: y, width: v ? 400 : 330, height: v ? 390 : 390, borderRadius: 36, background: 'linear-gradient(160deg, rgba(127,168,255,0.22), rgba(255,255,255,0.05))',
            border: '1.5px solid rgba(255,255,255,0.35)', boxShadow: '0 40px 90px rgba(0,0,0,0.45)', transform: `translateY(${(1 - k) * 160}px) rotate(${(1 - k) * (i - 1.5) * 6}deg)`, opacity: clamp(k * 1.5),
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32}}>
            <div style={{fontFamily: NUM, fontSize: 44, color: C.gold}}>0{i + 1}</div>
            <div style={{filter: 'drop-shadow(0 0 14px rgba(127,168,255,0.9))'}}>{ic}</div>
            <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 34, color: '#fff', textAlign: 'center', padding: '0 20px'}}>{l}</div></div>; })}
        {T > 23.0 && <div style={{position: 'absolute', left: v ? 120 : 225, top: v ? 1420 : 830, width: v ? 840 : 1470, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.15)'}}>
          <div style={{width: `${100 * pa(T, 23.0, 1.8, eio)}%`, height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #7FA8FF, #fff)', boxShadow: '0 0 16px rgba(255,255,255,0.8)'}} /></div>}
      </AbsoluteFill>}

      {/* 4 · fechamento */}
      {s4 > 0 && <AbsoluteFill style={{opacity: s4}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: v ? 560 : 250, textAlign: 'center', opacity: pa(T, 26.0, 0.4)}}><Pill>SUA OFERTA FAZ DIFERENÇA</Pill></div>
        <div style={{position: 'absolute', left: 0, right: 0, top: v ? 650 : 330, textAlign: 'center'}}>{v ? <><Letters T={T} a={26.2} text="NÃO DEIXE" size={130} /><br /><Letters T={T} a={26.4} text="DE FAZER" size={130} /><br /><Letters T={T} a={26.7} text="A SUA" size={150} italic color="#F2B51C" /><br /><Letters T={T} a={26.85} text="DOAÇÃO!" size={150} italic color="#F2B51C" /></> : <><Letters T={T} a={26.2} text="NÃO DEIXE DE FAZER" size={104} /><br /><Letters T={T} a={26.7} text="A SUA DOAÇÃO!" size={130} italic color="#F2B51C" /></>}</div>
        <div style={{position: 'absolute', left: 0, right: 0, top: v ? 1330 : 690, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 22, opacity: pa(T, 27.6, 0.5), transform: `translateY(${(1 - pa(T, 27.6, 0.5)) * 20}px)`}}>
          <Img src={staticFile('images/logo_branco.png')} style={{height: 120}} />
          <div style={{width: 3, height: 90, background: 'rgba(255,255,255,0.35)'}} />
          <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 44, color: '#fff', lineHeight: 1}}>IASD<div style={{fontWeight: 700, fontSize: 26, letterSpacing: 6, color: C.soft, marginTop: 8}}>PARQUE VITÓRIA</div></div>
        </div>
      </AbsoluteFill>}

      {[3.9, 21.05, 25.9].map((t) => <Swipe key={t} T={T} t={t} />)}
      <Grain f={f} />
      <AbsoluteFill style={{background: '#030B22', opacity: pa(T, DUR - 0.6, 0.6)}} />
    </AbsoluteFill>
  );
};

export const DoacaoV: React.FC = () => <Doacao v />;
