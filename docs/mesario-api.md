# API do Mesário — Placar em tempo real

Base URL: `https://seu-dominio.com/internal/matches`

Autenticação: header `X-Api-Key: <MESARIO_API_KEY>`

## Atualizar partida

```http
PATCH /internal/matches/:matchId
Content-Type: application/json
X-Api-Key: sua-chave

{
  "homeScore": 2,
  "awayScore": 1,
  "status": "live",
  "venueId": "cuid-do-ginasio"
}
```

**Status válidos:** `scheduled`, `live`, `finished`, `delayed`, `cancelled`

Mudanças em placar, status ou local disparam alertas automáticos para usuários com opt-in.

## Registrar evento (ex.: gol)

```http
POST /internal/matches/:matchId/events
Content-Type: application/json
X-Api-Key: sua-chave

{
  "type": "goal",
  "team": "home",
  "minute": 23,
  "note": "Gol de falta"
}
```

`type`: `goal`, `card`, `substitution`, etc.  
`team`: `home` ou `away` (incrementa placar quando `type` = `goal`).

## Fluxo recomendado no ginásio

1. Mesário abre app/web simples (pode ser página do painel com API key).
2. Seleciona partida ao vivo.
3. Botões +1 gol casa / +1 gol visitante → PATCH.
4. Bot WhatsApp reflete em segundos via fila `match-alerts`.
