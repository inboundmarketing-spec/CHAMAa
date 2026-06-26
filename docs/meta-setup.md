# Configuração Meta — WhatsApp Cloud API

> **Protótipo:** use `WHATSAPP_PROVIDER=dev` ou `evolution` — veja [migracao-whatsapp.md](migracao-whatsapp.md).  
> Este guia é para quando a comissão contratar a API oficial (`WHATSAPP_PROVIDER=cloud`).

## 1. Conta Business

1. Crie ou use uma conta em [business.facebook.com](https://business.facebook.com).
2. Adicione o app em [developers.facebook.com](https://developers.facebook.com).
3. Ative o produto **WhatsApp** e obtenha um número de teste ou produção.

## 2. Variáveis de ambiente

Copie `.env.example` para `apps/api/.env` (ou raiz) e preencha:

| Variável | Descrição |
|----------|-----------|
| `META_ACCESS_TOKEN` | Token permanente do System User |
| `META_PHONE_NUMBER_ID` | ID do número no Graph API |
| `META_WABA_ID` | WhatsApp Business Account ID |
| `META_APP_SECRET` | App Secret (validação webhook) |
| `WEBHOOK_VERIFY_TOKEN` | Token escolhido por você na verificação GET |

## 3. Webhook

1. URL pública HTTPS: `https://seu-dominio.com/webhook/whatsapp`
2. Campos: `messages`
3. Verify token = mesmo valor de `WEBHOOK_VERIFY_TOKEN`

## 4. Templates de mensagem

Fora da janela de 24h, use templates aprovados. Exemplos para submeter:

- `inter_alerta_jogo` — utility — "Mudança no jogo {{1}}"
- `inter_aviso_geral` — marketing — apenas para quem fez opt-in no bot

## 5. Botões interativos

O CHAMA usa reply buttons (máx. 3) e list messages (máx. 10 itens). Teste com o número de desenvolvimento antes do evento.

## 6. Instagram (promoter)

1. Converta o perfil do Inter para **Profissional**.
2. Vincule à mesma Business Manager.
3. Preencha `INSTAGRAM_ACCOUNT_ID` e `INSTAGRAM_ACCESS_TOKEN`.
4. Configure `MODERATION_GROUP_WA_ID` com o ID do grupo de admins (número business deve estar no grupo).

## 7. Grupos para broadcast

- **Campanhas:** no painel, use *Atualizar grupos* (sincroniza via Evolution em protótipo). Só aparecem grupos em que o bot pode enviar.
- **Instagram aprovado:** usa os mesmos alvos `broadcast_targets` com `canSend=true`.
- Cadastro manual: `POST /api/admin/broadcast-targets` ou `POST /api/admin/whatsapp/groups/sync`.
