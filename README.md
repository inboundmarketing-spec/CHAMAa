# CHAMA — Guia de Uso (GitHub Pages)

Site estático para ensinar participantes e operadores a **utilizar a plataforma CHAMA** (bot WhatsApp Chaminha + painel web do O'Inter).

Este repositório contém apenas a documentação de uso — **sem instruções de instalação** ou configuração técnica.

**Endereço publicado:** <https://inboundmarketing-spec.github.io/CHAMAa/>

> O painel do CHAMA tem um botão **❓ Ajuda** (fim do menu lateral) que abre esse endereço. Se o repositório for renomeado ou o site mudar de endereço, atualize `GUIDE_URL` em `apps/web/src/lib/guide.ts` no projeto principal, senão o botão leva a uma página inexistente.

## Conteúdo do guia

- O que é o CHAMA e quem usa cada parte
- **WhatsApp:** menus, comandos e fluxos (esportes, festas e Open Ginásio, avisos, ajuda, SOS Lieu…), atalhos de texto (`ingresso`, `open bar`, `lote`, `transporte`, `quais são as modalidades?`, `o que tem no alojamento?`…) e exemplos de perguntas sobre o O'Inter 2026 (festas, esportivo e alojamento)
- **Simulador:** chat de treino no navegador, que espelha os menus do bot (inclui a programação das festas, as respostas sobre ingresso, open bar, lote, transporte, modalidades, mata-mata, divisões, pontuação e alojamento, e a lista das 4 escolas de alojamento no menu Alojamentos)
- **Painel web:** login, botão de ajuda, hierarquia de cargos e permissões por função
- **Funcionalidades:** esportes, festas (programações com início e término), campanhas, Instagram, locais, base de conhecimento e respostas salvas, simulador

## Manter o conteúdo atualizado

Este guia ensina a **usar** a plataforma. Os dados do evento (datas, programação, ingressos) ficam cadastrados no painel e na base de conhecimento do bot, e o guia só dá exemplos deles. Quando algo mudar:

- **Textos do guia:** edite `index.html`.
- **Respostas do simulador** (`assets/js/simulator.js`): ficam fixas no navegador e **não** leem o bot real. Atualize `PROGRAMS`, `ALOJAMENTOS` e `FAQ` quando a programação, o open bar, os ingressos, o esportivo ou os alojamentos mudarem, para o treino continuar fiel. Os atalhos que vão direto para a Ajuda (`isHelpTopic`) copiam `apps/api/src/bot/help/help-topic.util.ts` do projeto principal; se ele mudar, mude aqui também. Quando sair a divisão das delegações entre as escolas, `showCampusResult` deve passar a mostrar o endereço, como o bot real.
- **Dados do bot:** no painel (`/events`, `/knowledge`); veja `docs/dados-o-inter-2026.md` no projeto principal.


## Publicar no GitHub Pages

### Opção 1 — Branch `main` (mais simples)

1. Crie um repositório no GitHub (ex.: `chama-guia` ou `seu-usuario.github.io`).
2. Envie estes arquivos para a branch `main`:
   - `index.html`
   - `assets/` (CSS, JS e imagens)
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
index.html            — página principal (single-page)
assets/css/style.css  — estilos
assets/js/main.js     — menu mobile e abas de cargos
assets/js/simulator.js — simulador do bot (respostas locais, sem servidor)
assets/img/           — favicon e imagem de compartilhamento (OG)
.github/workflows/    — deploy automático (opcional)
```

## Licença

Conteúdo educacional do projeto CHAMA / O'Inter.
