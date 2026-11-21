# GMSL Digital · SIGMSL

Sistema Integrado da Guarda Municipal de São Luís (piloto).

App web instalável (PWA) da Guarda Municipal de São Luís: cadastro com aprovação, escalas, permutas com aprovação em três etapas, mural e comprovantes em PDF.

- **Hospedagem:** Netlify, site `gmsl-permutas` (este ramo `gmsl-permutas` do repositório). Não há etapa de build: os arquivos são publicados como estão.
- **Servidor:** Supabase, projeto `gmsl-permutas` (região São Paulo). Login, banco de dados, fotos e as funções `cadastro` e `redefinir-senha`.
- **Configuração:** `config.js` tem apenas a chave pública (anon). As permissões ficam nas regras do banco (RLS) e nas funções.

## Perfis nesta versão
Guarda, Coordenador de Posto, Chefia do Corpo de Guarda, Escalante e Administrador. Gestor de HE e Rondante entram na segunda versão.

## Regras provisórias
- Limite de 4 permutas por guarda no mês (`LIMITE_MES` em `app.js`).
