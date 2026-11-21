# Notificações do Banco Ágape

## Já funcionando (app aberto)
Sino no topo das telas do cliente e do gerente, com contador de não lidas. Quando chega algo novo
com o app aberto, aparece um aviso no alto da tela (e o celular vibra). O app confere a cada 10 s.

| Quem recebe | Quando | Vai para o celular com o app fechado? |
|---|---|---|
| Cliente | Gerente enviou Agapix (gincana, pontualidade…) | Sim |
| Cliente | Gerente retirou Agapix (ex.: leilão) | Sim |
| Cliente | Outro participante transferiu Agapix | Sim |
| Cliente | Aviso do gerente (para todos ou uma equipe) | Sim |
| Cliente | Alguém errou o PIN dele 5 vezes | Sim |
| Cliente | Gerente trocou o PIN dele / boas-vindas | Não (só no sino) |
| Gerente | Toda transferência entre participantes | Sim |
| Gerente | Conta bloqueada por PIN errado | Sim |

## Como funciona com o app fechado (push)
```
evento no banco (crédito, transferência, aviso…)
   → linha nova em public.notificacoes  (push = true)
   → gatilho notificacao_push (pg_net)
   → Edge Function "enviar-push" no Supabase
   → Firebase Cloud Messaging (FCM)
   → notificação no celular, mesmo com o app fechado
```
O celular se cadastra sozinho: depois do login, o app pede permissão de notificação,
recebe um código do Firebase e salva em public.dispositivos.

## O que falta para ligar o push (uma vez só, ~10 minutos)
1. Criar um projeto grátis em https://console.firebase.google.com (nome: Banco Ágape).
2. Adicionar um app **Android** com o pacote `br.com.casadoja.bancoagape` e baixar o
   **google-services.json**.
3. Em Configurações do projeto → Contas de serviço → **Gerar nova chave privada** (baixa um .json).
4. Mandar esses dois arquivos para o Claude, que:
   - coloca o google-services.json no app (liga o push e gera um APK novo);
   - salva a chave como segredo `FIREBASE_SERVICE_ACCOUNT` no Supabase.

Enquanto isso não for feito, o app funciona normalmente e as notificações aparecem no sino.
