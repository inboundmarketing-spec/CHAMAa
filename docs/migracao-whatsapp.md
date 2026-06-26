# Migração WhatsApp: protótipo → API oficial Meta

O CHAMA usa **um único contrato** (`IWhatsAppProvider`). O restante do sistema (bot, filas, painel, mesário) **não muda** na migração.

## Modos disponíveis

| `WHATSAPP_PROVIDER` | Uso | Custo |
|---------------------|-----|-------|
| `dev` | Apresentação ao chefe, testes locais | Grátis |
| `evolution` | Protótipo com WhatsApp real (QR) | Grátis* |
| `cloud` | Produção Interunesp | Pago Meta |

\* Evolution é não-oficial; use só em protótipo. Na produção, migre para `cloud`.

## 1. Protótipo agora (`dev`)

```env
WHATSAPP_PROVIDER=dev
```

- Envie mensagens fake: `POST http://localhost:3001/api/dev/simulate-message`
  ```json
  { "waId": "5511999999999", "text": "oi" }
  ```
- Veja respostas do bot: `GET http://localhost:3001/api/dev/chat-log`
- Painel: página **Simulador** em http://localhost:3000/simulator

## 2. Protótipo com celular real (`evolution`)

1. Suba [Evolution API](https://github.com/EvolutionAPI/evolution-api) (Docker).
2. Crie instância `chama` e escaneie o QR.
3. Configure webhook da Evolution → `https://seu-tunnel/webhook/evolution`
4. `.env`:
   ```env
   WHATSAPP_PROVIDER=evolution
   EVOLUTION_API_URL=http://localhost:8080
   EVOLUTION_INSTANCE=chama
   EVOLUTION_API_KEY=sua-api-key
   ```

Botões podem cair em menu numerado se a instância não suportar `sendButtons` — comportamento aceitável em protótipo.

## 3. Produção (`cloud`)

1. Contrate WhatsApp Business / Cloud API na Meta.
2. Aprove templates de mensagem.
3. Altere **apenas** o `.env`:
   ```env
   WHATSAPP_PROVIDER=cloud
   META_ACCESS_TOKEN=...
   META_PHONE_NUMBER_ID=...
   META_APP_SECRET=...
   WEBHOOK_VERIFY_TOKEN=...
   ```
4. Webhook Meta → `https://seu-dominio/webhook/whatsapp`

**Nenhum arquivo TypeScript do bot precisa ser reescrito** — só variáveis de ambiente e configuração no Business Manager.

## O que já está preparado

- `CloudApiWhatsAppProvider` — botões, listas e templates nativos Meta
- `EvolutionApiWhatsAppProvider` — envio real + webhook separado
- `DevWhatsAppProvider` — log + simulador HTTP
- `WhatsappService` — fachada que escolhe o provedor por env
- Webhooks separados: `/webhook/whatsapp` (Meta) e `/webhook/evolution`

## Checklist na migração

- [ ] `WHATSAPP_PROVIDER=cloud`
- [ ] Templates aprovados para campanhas fora da janela 24h
- [ ] `PUBLIC_API_URL` HTTPS (QR de ingressos)
- [ ] Testar opt-in e broadcasts em número de homologação
- [ ] Desligar Evolution em produção
