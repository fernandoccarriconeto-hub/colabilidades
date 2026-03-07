# Colabilidades

Aplicação full stack (React + Express + SQLite + Gemini) para colaboração e ideação em equipe.

## Rodar localmente

Pré-requisitos:
- Node.js 22+

Passos:
1. Copie `.env.example` para `.env` e ajuste as variáveis.
2. Instale dependências:
   ```bash
   npm install
   ```
3. Execute:
   ```bash
   npm run dev
   ```

## Publicar na internet (Render)

Este repositório já inclui `Dockerfile` e `render.yaml` para deploy.

1. Abra o deploy em 1 clique:
   [Deploy no Render](https://render.com/deploy?repo=https://github.com/fernandoccarriconeto-hub/colabilidades)
2. Confirme o serviço web.
3. Defina `GEMINI_API_KEY` nas variáveis de ambiente.
4. Aguarde o build finalizar.

Após o deploy, o app ficará disponível na URL pública do Render.

## Variáveis de ambiente

- `PORT`: porta HTTP do servidor (default `3000` localmente).
- `NODE_ENV`: `development` ou `production`.
- `DB_PATH`: caminho do arquivo SQLite (em produção Render: `/var/data/colabilidades.db`).
- `GEMINI_API_KEY`: chave da API Gemini para endpoints de IA.
