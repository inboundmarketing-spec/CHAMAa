# CHAMA — Guia de Uso (GitHub Pages)

Site estático para ensinar participantes e operadores a **utilizar a plataforma CHAMA** (bot WhatsApp Chaminha + painel web do O'Inter).

Este repositório contém apenas a documentação de uso — **sem instruções de instalação** ou configuração técnica.

## Conteúdo do guia

- O que é o CHAMA e quem usa cada parte
- **WhatsApp:** menus, comandos e fluxos (esportes, festas, avisos, ajuda, SOS Lieu…)
- **Painel web:** login, hierarquia de cargos e permissões por função
- **Funcionalidades:** esportes, chaveamento, festas, campanhas, Instagram, locais, simulador

## Publicar no GitHub Pages

### Opção 1 — Branch `main` (mais simples)

1. Crie um repositório no GitHub (ex.: `chama-guia` ou `seu-usuario.github.io`).
2. Envie estes arquivos para a branch `main`:
   - `index.html`
   - `assets/` (CSS e JS)
3. No GitHub: **Settings → Pages**
4. Em **Source**, escolha **Deploy from a branch**
5. Branch: `main` · Folder: **`/ (root)`**
6. Salve. Em alguns minutos o site estará em:
   - `https://SEU-USUARIO.github.io/NOME-DO-REPO/`  
   - ou `https://SEU-USUARIO.github.io/` se o repo se chamar `SEU-USUARIO.github.io`

### Opção 2 — GitHub Actions (já configurado)

O workflow em `.github/workflows/pages.yml` publica automaticamente a cada push na branch `main`.

1. Push do código para `main`
2. **Settings → Pages → Build and deployment → Source:** **GitHub Actions**
3. O deploy roda sozinho após cada commit

## Testar localmente

Abra `index.html` no navegador ou use um servidor simples:

```bash
npx serve .
```

Acesse `http://localhost:3000` (ou a porta indicada).

## Estrutura

```
index.html           — página principal (single-page)
assets/css/style.css — estilos
assets/js/main.js    — menu mobile e abas de cargos
.github/workflows/   — deploy automático (opcional)
```

## Licença

Conteúdo educacional do projeto CHAMA / O'Inter.
