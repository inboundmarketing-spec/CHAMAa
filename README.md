# CHAMA — Bot WhatsApp do Interunesp

Assistente do Interunesp no WhatsApp: menus interativos, placar ao vivo, festas, ingressos QR, alertas com opt-in, atendimento humano (SOS) e promoter do Instagram com aprovação prévia.

**Protótipo:** roda sem API paga (`WHATSAPP_PROVIDER=dev` ou `evolution`). **Produção:** migre com `WHATSAPP_PROVIDER=cloud` — veja [docs/migracao-whatsapp.md](docs/migracao-whatsapp.md).

## Estrutura

```
apps/api     — NestJS (webhook, bot, admin REST, workers)
apps/web     — Next.js (painel da comissão)
packages/shared — enums e IDs dos botões
docs/        — setup Meta e API mesário
```

## Pré-requisitos

- Node.js 20+
- Docker (PostgreSQL + Redis)

## Início rápido

```bash
# Subir banco e Redis
docker compose up -d

# Instalar dependências
npm install

# Configurar ambiente
copy .env.example apps\api\.env

# Banco
npm run db:push
npm run db:seed

# Desenvolvimento (API :3001, Web :3000)
npm run dev
```

**Painel:** http://localhost:3000 — `admin@interunesp.local` / `admin123`

**Demo ao chefe (sem WhatsApp):** http://localhost:3000/simulator — ou `POST /api/dev/simulate-message` com `{ "waId": "5511999999999", "text": "oi" }`.

**WhatsApp real no protótipo:** `WHATSAPP_PROVIDER=evolution` + Evolution API — [migracao-whatsapp.md](docs/migracao-whatsapp.md).

**Produção Meta:** `WHATSAPP_PROVIDER=cloud` + ngrok/webhook em `/webhook/whatsapp`.

## Módulos

| Módulo | Descrição |
|--------|-----------|
| Bot conversacional | Menus Esportes, Festas, Ingresso, Avisos, SOS |
| Mesário | `PATCH /internal/matches/:id` com API key |
| Campanhas | Fila BullMQ, apenas opt-in |
| Ajuda | Dúvidas sobre o Inter (IA opcional + base de conhecimento + dados ao vivo) |
| Handoff | SOS Lieu congela bot; equipe responde no painel |
| Instagram | Poll a cada 5 min → grupo moderação → aprovar → grupos/PV |

## Documentação

- [meta-setup.md](docs/meta-setup.md)
- [mesario-api.md](docs/mesario-api.md)
- [help-llm.md](docs/help-llm.md) — ativar IA na chaminha
- [chaveamento.md](docs/chaveamento.md) — mata-mata, folgas, sorteio e API

## Produção

Defina `PUBLIC_API_URL` (HTTPS) para QR codes de ingresso. Configure todos os secrets Meta e `JWT_SECRET` forte.
