# Chaminha — LLM via OpenRouter

A chaminha usa a API da [OpenRouter](https://openrouter.ai/) (formato compatível com OpenAI) para interpretar perguntas com contexto da base de conhecimento.

## Configuração rápida

1. Crie uma chave em https://openrouter.ai/keys  
2. No `apps/api/.env`:

```env
HELP_LLM_ENABLED=true
OPENAI_API_KEY=sk-or-v1-SUA_CHAVE_AQUI
OPENAI_BASE_URL=https://openrouter.ai/api/v1
HELP_LLM_MODEL=meta-llama/llama-3.3-70b-instruct:free
```

3. Reinicie a API (`npm run dev` na pasta `apps/api`).

## Sem pagar

Use modelos com sufixo **`:free`** (custo $0, com limites de taxa):

| Modelo | Uso |
|--------|-----|
| `meta-llama/llama-3.3-70b-instruct:free` | Padrão do projeto — boa qualidade |
| `google/gemma-2-9b-it:free` | Mais leve |
| `openrouter/free` | OpenRouter escolhe um modelo grátis aleatório |

Créditos pagos na OpenRouter só entram em jogo se você trocar para um modelo **sem** `:free`.

## Variáveis opcionais

```env
HELP_LLM_MAX_TOKENS=500
HELP_LLM_TIMEOUT_MS=25000
OPENROUTER_SITE_URL=http://localhost:3001
OPENROUTER_APP_NAME=CHAMA Chaminha
```

## Fallback

Se a OpenRouter falhar ou a chave estiver vazia, a chaminha volta para **busca local** na base de conhecimento (sem IA).

## Segurança

- Não commite `OPENAI_API_KEY` no Git.
- A chave no `.env` é só local.
