# E-mails autorizados (primeiro acesso)

A lista principal fica no banco (`allowed_emails`), gerenciada pela aba **Autorizações** no painel (Mesa, Criativa, Diretor e C.O. Praça podem adicionar e-mails para cargos abaixo do deles).

O arquivo `allowed-emails.json` é usado apenas no **seed** inicial (`npm run db:seed` na API). Para o dia a dia, use a aba Autorizações.

| Chave no JSON | Papel no sistema | Role |
|---------------|------------------|------|
| `mesa` | Mesa da Lieu | `mesa_lieu` |
| `diretor` | Diretor C.O. | `co_director` |
| `co_praca` | C.O. Praça | `venue_coordinator` |
| `neutro` | Neutro | `neutral` |
| `criativa` | Criativa | `criativa` |

## Formato

- **mesa**, **diretor**, **neutro**, **criativa**: lista de strings com o e-mail.
- **co_praca**: strings ou objetos com `email`, `name` (opcional) e `venueId` (ID da praça no banco).

Exemplo:

```json
{
  "mesa": ["mesa@exemplo.com"],
  "diretor": ["diretor@exemplo.com"],
  "co_praca": [
    {
      "email": "ginasio@exemplo.com",
      "name": "C.O. Ginásio",
      "venueId": "id-da-praca-no-banco"
    }
  ],
  "neutro": ["neutro1@exemplo.com"],
  "criativa": ["criativa@exemplo.com"]
}
```

O usuário só consegue criar senha se o e-mail estiver na lista **e** ainda não tiver senha cadastrada (primeiro acesso).

Variável opcional: `ALLOWED_EMAILS_PATH` — caminho absoluto para outro arquivo JSON.
