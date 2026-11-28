// Banco Ágape — envia a notificação push (Firebase Cloud Messaging) de uma linha de public.notificacoes.
// É chamada pelo gatilho do banco logo depois que a notificação é criada.
// Enquanto o segredo FIREBASE_SERVICE_ACCOUNT não existir, ela não faz nada (push desligado).
import { createClient } from "npm:@supabase/supabase-js@2";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });

let cache: { token: string; exp: number } | null = null;

function b64url(buf: ArrayBuffer | Uint8Array | string) {
  const bytes = typeof buf === "string" ? new TextEncoder().encode(buf) : new Uint8Array(buf as ArrayBuffer);
  let s = ""; bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function tokenGoogle(sa: { client_email: string; private_key: string }) {
  const agora = Math.floor(Date.now() / 1000);
  if (cache && cache.exp - 60 > agora) return cache.token;
  const cab = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const corpo = b64url(JSON.stringify({
    iss: sa.client_email, scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token", iat: agora, exp: agora + 3600,
  }));
  const pem = sa.private_key.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const chave = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const assinatura = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", chave, new TextEncoder().encode(`${cab}.${corpo}`));
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${cab}.${corpo}.${b64url(assinatura)}` }),
  });
  const d = await r.json();
  if (!d.access_token) throw new Error("OAuth Google falhou: " + JSON.stringify(d));
  cache = { token: d.access_token, exp: agora + (d.expires_in ?? 3600) };
  return cache.token;
}

Deno.serve(async (req) => {
  try {
    const { id } = await req.json();
    const segredo = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
    if (!segredo) return json({ ok: true, push: "desligado (falta FIREBASE_SERVICE_ACCOUNT)" });

    // pega a notificação e marca como enviada (só uma vez)
    const { data: n } = await sb.from("notificacoes").update({ push_enviado: true })
      .eq("id", id).eq("push", true).eq("push_enviado", false).select().maybeSingle();
    if (!n) return json({ ok: true, ignorada: true });

    const { data: aparelhos } = await sb.from("dispositivos").select("fcm_token").eq("conta_id", n.conta_id);
    if (!aparelhos?.length) return json({ ok: true, sem_aparelho: true });

    const sa = JSON.parse(segredo);
    const token = await tokenGoogle(sa);
    let enviados = 0;
    for (const { fcm_token } of aparelhos) {
      const r = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ message: {
          token: fcm_token,
          notification: { title: n.titulo, body: n.corpo ?? "" },
          data: { tipo: n.tipo, id: String(n.id) },
          android: { priority: "HIGH", notification: n.tipo === "alerta_oracao"
            ? { channel_id: "alerta-oracao", color: "#D21F1A", icon: "ic_stat_agape", notification_priority: "PRIORITY_MAX", visibility: "PUBLIC", default_vibrate_timings: false, vibrate_timings: ["0.9s", "0.25s", "0.9s", "0.25s", "0.9s"] }
            : { channel_id: "banco-agape", color: "#F5C23F", icon: "ic_stat_agape" } },
        } }),
      });
      if (r.ok) enviados++;
      else if (r.status === 404 || r.status === 400) {
        // aparelho desinstalou o app ou token inválido: limpa
        await sb.from("dispositivos").delete().eq("fcm_token", fcm_token);
      }
    }
    return json({ ok: true, enviados });
  } catch (e) {
    return json({ ok: false, erro: String(e) }, 500);
  }
});
