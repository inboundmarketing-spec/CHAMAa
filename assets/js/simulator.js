(function () {
  "use strict";

  var messagesEl = document.getElementById("botsim-messages");
  var optionsEl = document.getElementById("botsim-options");
  var formEl = document.getElementById("botsim-form");
  var inputEl = document.getElementById("botsim-input");
  var resetBtn = document.getElementById("botsim-reset");

  if (!messagesEl || !optionsEl || !formEl || !inputEl) {
    return;
  }

  var STATE = { mode: "menu", busy: false };

  var ATLETICAS = ["Atlética Leão", "Atlética Fênix", "Atlética Tigre", "Atlética Coruja"];
  var CAMPUSES = ["Campus Central", "Campus Norte", "Campus Sul"];

  var NEARBY = {
    marmita: "🍱 *Marmita perto de você*\n\nMarmita da Dona Rosa — 180m\nSabor Caseiro — 300m",
    farmacia: "💊 *Farmácia perto de você*\n\nFarmácia Popular — 250m",
    hospital: "🏥 *Hospital/UPA perto de você*\n\nUPA Central — 1,2 km",
    fastfood: "🍔 *Fast-food perto de você*\n\nBurger's da Praça — 400m"
  };

  // Escolas de alojamento do O'Inter 2026 (a divisão das delegações ainda não saiu)
  var ALOJAMENTOS = [
    "E.M. Professora Vilma Gianotti Martinez",
    "E.M. Professora Ederle Marangoni Dias",
    "E.M. Deputado Carlos Castilho Cabral",
    "E.M. José Soares Marcondes"
  ];

  var FAQ = [
    { test: /pontua|pontos|classificacao geral|quanto vale|campea|vencedor|desempate|\bw\.?o\b/, answer: "Em cada modalidade a colocação final vale pontos na classificação geral: 1º 16, 2º 13, 3º 11, 4º 10, 5º 8, 6º 7, 7º 6, 8º 5, 9º 4, 10º 3, 11º 2, 12º 1. Vence o Inter a atlética com mais pontos; no empate, ganha quem tiver mais 1ºs lugares, depois mais 2ºs, e assim por diante. A atlética que leva W.O. perde 16 pontos (32 no atletismo, na natação e no judô quando a atlética não faz o balizamento ou a pesagem)." },
    { test: /xadrez|suico/, answer: "O xadrez é misto e disputado em sistema suíço de 5 rodadas (todos contra todos se houver menos de 8 equipes). Cada rodada tem 3 tabuleiros: vitória vale 1 ponto, empate 0,5 e derrota 0. Vence a atlética com mais pontos, em etapa única, em 1 dia." },
    { test: /mata.?mata|chaveamento|eliminatori|etapa unica|como funciona o (esportivo|campeonato|torneio|competicao)|modelo de disputa/, answer: "O esportivo do O'Inter 2026 tem 13 modalidades, 2 divisões e 3 dias de jogos. As modalidades são disputadas em eliminatória simples (mata-mata), sem empate, com o chaveamento sorteado antes do Inter. Atletismo, natação e xadrez são por pontuação; o xadrez, em sistema suíço de 5 rodadas. No judô as lutas são por categoria de peso, com chave montada no dia, e vence a atlética com mais pontos. Atletismo, natação, judô, xadrez e tênis de mesa têm etapa única, em 1 dia do evento." },
    { test: /modalidade|quais esportes/, answer: "O O'Inter 2026 tem 13 modalidades, disputadas no feminino e no masculino: atletismo, basquete, futebol de campo, futebol 7 (futebol de 7), futsal, handebol, judô, natação, tênis de campo, tênis de mesa, vôlei, vôlei de praia e xadrez. O xadrez é disputado em equipe mista. Cada divisão disputa 12 delas: futebol de campo só na 1ª divisão e futebol 7 só na 2ª." },
    { test: /divis|sobe|desce|rebaix|acesso/, answer: "O esportivo do O'Inter 2026 tem 2 divisões. Primeira divisão (10 atléticas): Araraquara, Bauru, Botucatu, Franca, Guaratinguetá, Jaboticabal, Presidente Prudente, Rio Claro, São José do Rio Preto e São Vicente. Segunda divisão (12 atléticas): Araçatuba, Assis, Dracena, Ilha Solteira, Itapeva, Marília, Registro, Rosana, São João da Boa Vista, São José dos Campos, Sorocaba e Tupã. Ao fim do Inter, os 3 primeiros da 2ª divisão sobem e os 3 últimos da 1ª descem." },
    { test: /(estrutura|banheiro|chuveiro|banho|pia|espelho|colch|barraca|seguranca|limpeza|manutencao|o que tem).*alojamento|alojamento.*(estrutura|banheiro|chuveiro|banho|pia|espelho|colch|barraca|seguranca|limpeza|manutencao)|horarios? de (entrada|saida)/, answer: "Os alojamentos do O'Inter 2026 têm espaços amplos, com áreas cobertas e abertas: salas para colchões e 1 quadra coberta para as barracas. Os banheiros são completos, com cabines, chuveiros, pias e espelhos. Há segurança 24 horas, limpeza diária dos espaços em comum e suporte para manutenção hidráulica e elétrica. Os horários de entrada e saída serão divulgados em breve." },
    { test: /(onde|quais) (vao ser|serao|sao|vai ser) (os )?alojamentos|escolas? (do|de|dos) alojamento/, answer: "Os alojamentos do O'Inter 2026 serão em 4 escolas municipais de Presidente Prudente: " + ALOJAMENTOS.slice(0, -1).join(", ") + " e " + ALOJAMENTOS[ALOJAMENTOS.length - 1] + ". As delegações serão divididas entre elas. Quando a divisão sair, digite *alojamento* para ver o da sua atlética." },
    { test: /ingresso|passaporte|blacktag|black tag/, answer: "Há 3 opções de ingresso para as festas: Passaporte Completo (acesso às 5 festas e ao open bar do Inter), Passaporte Open Ginásio (3 dias de Open Ginásio no P.U.M.) e ingressos avulsos, em que você escolhe a festa." },
    { test: /lote|virada/, answer: "A virada de lote dos ingressos é no dia 15/10. O Passaporte Open Ginásio se mantém no lote fixo." },
    { test: /open ?bar|bebida|cerveja|vodka/, answer: "O open bar é diferente em cada espaço. Open Ginásio: cerveja, água e coquetel alcoólico. Festas noturnas: cerveja, vodka, energético, água, refrigerante e coquetel alcoólico. São 38 horas de open bar no total." },
    { test: /transporte|onibus|locomocao/, answer: "Cada atlética tem um sistema próprio de transporte dentro da cidade. Para saber como funciona, consulte a sua atlética." },
    { test: /delegac/, answer: "O O'Inter 2026 tem 22 delegações: 10 atléticas na 1ª divisão e 12 na 2ª." },
    { test: /(compr|pag|reserv|link|venda).*alojamento|alojamento.*(compr|pag|reserv|link|venda)/, answer: "Para comprar o alojamento, você pode comprar direto com a sua atlética ou online pelo link da sua atlética na BlackTag. As vendas do alojamento começaram em 11 de agosto de 2026." },
    { test: /quando|data|que dia|dias/, answer: "O O'Inter 2026 acontece de 20 a 22 de novembro, em Presidente Prudente: 3 dias de jogos, 13 modalidades em 2 divisões, 2 festas noturnas (20 e 21/11) e 3 dias de Open Ginásio (20, 21 e 22/11)." },
    { test: /open gin|festa|show|tenda|line ?up|dj|atrac/, answer: "São 2 festas noturnas (20 e 21/11, das 20h às 6h) e 3 dias de Open Ginásio (20, 21 e 22/11, das 12h às 18h, no P.U.M.). Veja a programação completa no menu 🎉 Festas." },
    { test: /jogo|placar|futsal|v[oô]lei|basquete|gin[aá]sio|hor[aá]rio/, answer: "O placar ao vivo e a agenda completa estão no menu ⚽ Esportes — os dados vêm direto do painel, atualizados pelos mesários em tempo real." },
    { test: /alojamento|hospedagem|onde fico|onde ficar/, answer: "O endereço do alojamento da sua atlética e os serviços por perto (marmita, farmácia, hospital) aparecem no menu 🏠 Alojamentos assim que a divisão das delegações sair." },
    { test: /atl[eé]tica/, answer: "Você escolhe sua atlética no menu 🏛 Atlética e vê os jogos e desafios do seu campus." },
    { test: /sos|humano|atendente|socorro|pessoa de verdade/, answer: "Se quiser falar com alguém da equipe, toque em \"🆘 Atendimento humano\" aqui na Ajuda." },
    { test: /obrigad|valeu|show de bola/, answer: "De nada! 🔥 Qualquer coisa, estou por aqui." }
  ];

  // Mesmos assuntos que o bot real manda direto para a Ajuda, sem abrir o menu
  // (apps/api/src/bot/help/help-topic.util.ts no projeto principal)
  var HELP_TOPIC = /ingresso|passaporte|blacktag|black tag|open ?bar|open ?gin|\blotes?\b|virada de lote|transporte|delegac|(compr|pag|reserv|link|vendas?).*alojamento|alojamento.*(compr|pag|reserv|link|vendas?)/;
  // Alojamento em geral; "meu/minha/nosso" fica no menu Alojamentos
  var LODGING_TOPIC = /(estrutura|banheiro|chuveiro|banho|\bpias?\b|espelho|colchao|colchoes|barraca|seguranca|limpeza|manutencao).*alojamento|alojamento.*(estrutura|banheiro|chuveiro|banho|\bpias?\b|espelho|colchao|colchoes|barraca|seguranca|limpeza|manutencao)|o que tem n[oa]s? alojamento|horarios? de (entrada|saida|check-?in)|(onde|quais) (vao ser|serao|sao|vai ser) (os )?alojamentos/;
  var OWN_LODGING = /\b(meu|minha|nosso|nossa)\b/;
  // Formato do esportivo; classificação, placar e chave ficam no menu Esportes
  var SPORTS_FORMAT_TOPIC = /\b(quais|quantas) (sao )?(as )?(modalidades|divisoes)\b|como funciona o (esportivo|campeonato|torneio|competicao|chaveamento)|mata.?mata|eliminatoria simples|etapa unica/;
  var SPORTS_MENU_WORDS = /classifica|ranking|tabela|pontua|placar|resultado|\bjogos?\b|\bchaves?\b|chaveamento d[oa]/;

  function isHelpTopic(normalized) {
    if (HELP_TOPIC.test(normalized)) return true;
    if (!OWN_LODGING.test(normalized) && LODGING_TOPIC.test(normalized)) return true;
    return !SPORTS_MENU_WORDS.test(normalized) && SPORTS_FORMAT_TOPIC.test(normalized);
  }

  function stripAccents(text) {
    return text.normalize ? text.normalize("NFD").replace(/[̀-ͯ]/g, "") : text;
  }

  function normalize(text) {
    return stripAccents(String(text).toLowerCase().trim());
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function formatMsg(text) {
    var out = escapeHtml(text);
    out = out.replace(/\*(.+?)\*/g, "<strong>$1</strong>");
    out = out.replace(/_(.+?)_/g, "<em>$1</em>");
    out = out.replace(/\n/g, "<br>");
    return out;
  }

  function scrollDown() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function addMessage(text, who) {
    var div = document.createElement("div");
    div.className = "botsim-msg " + who;
    div.innerHTML = formatMsg(text);
    messagesEl.appendChild(div);
    scrollDown();
  }

  function showTypingBubble() {
    var div = document.createElement("div");
    div.className = "botsim-msg bot typing";
    div.id = "botsim-typing";
    div.innerHTML = "<span></span><span></span><span></span>";
    messagesEl.appendChild(div);
    scrollDown();
  }

  function removeTypingBubble() {
    var typing = document.getElementById("botsim-typing");
    if (typing) typing.remove();
  }

  function withTyping(cb) {
    STATE.busy = true;
    inputEl.disabled = true;
    showTypingBubble();
    setTimeout(function () {
      removeTypingBubble();
      STATE.busy = false;
      inputEl.disabled = false;
      cb();
    }, 450 + Math.random() * 300);
  }

  function renderOptions(options) {
    optionsEl.innerHTML = "";
    (options || []).forEach(function (opt) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "botsim-option" + (opt.danger ? " danger" : "");
      btn.textContent = opt.label;
      btn.addEventListener("click", function () {
        if (STATE.busy) return;
        handleOption(opt);
      });
      optionsEl.appendChild(btn);
    });
  }

  function respond(message, options) {
    addMessage(message, "bot");
    renderOptions(options || []);
  }

  function handleOption(opt) {
    addMessage(opt.label, "user");
    withTyping(function () {
      if (typeof opt.action === "function") {
        opt.action();
      } else if (opt.next) {
        goTo(opt.next);
      }
    });
  }

  function goTo(key) {
    var node = NODES[key];
    if (!node) return;
    respond(node.message, node.options);
  }

  // Shared option lists (reused across leaf nodes so the same shortcuts stay visible)
  var rootOptions = [
    { label: "⚽ Esportes", next: "sports" },
    { label: "🎉 Festas", next: "festas" },
    { label: "🔔 Avisos", next: "avisos" },
    { label: "🎯 Desafios", next: "desafios" },
    { label: "🏛 Atlética", action: startAtletica },
    { label: "🏠 Alojamentos", action: startAlojamentos },
    { label: "💬 Ajuda", action: startHelp }
  ];

  var sportsOptions = [
    { label: "📊 Placar ao vivo", next: "sports_live" },
    { label: "📅 Próximos jogos", next: "sports_upcoming" },
    { label: "📋 Classificação", next: "sports_standings" },
    { label: "🏟 Praças", next: "sports_venues" },
    { label: "🏠 Menu principal", next: "root" }
  ];

  var festasOptions = [
    { label: "📅 Hoje", next: "festas_today" },
    { label: "🎤 Programação", next: "festas_lineup" },
    { label: "📍 Local", next: "festas_local" },
    { label: "📍 Serviços perto", next: "festas_nearby" },
    { label: "🏠 Menu principal", next: "root" }
  ];

  // Programações (festa noturna ou Open Ginásio): uma opção por programação, como no bot real
  var PROGRAMS = [
    { key: "festas_day_1", short: "Open Ginásio — Sexta", icon: "🏟️", kind: "Open Ginásio", date: "sexta-feira, 20/11/2026", when: "12:00 → 18:00 · 6h", artists: [] },
    { key: "festas_day_2", short: "Festa — Sexta", icon: "🎉", kind: "Festa noturna", date: "sexta-feira, 20/11/2026", when: "20:00 → 06:00 (dia seguinte) · 10h", artists: ["Tília", "Melody", "DJ GBR", "Dedão", "Fifonha"] },
    { key: "festas_day_3", short: "Open Ginásio — Sábado", icon: "🏟️", kind: "Open Ginásio", date: "sábado, 21/11/2026", when: "12:00 → 18:00 · 6h", artists: [] },
    { key: "festas_day_4", short: "Festa — Sábado", icon: "🎉", kind: "Festa noturna", date: "sábado, 21/11/2026", when: "20:00 → 06:00 (dia seguinte) · 10h", artists: ["Harel", "Dayeh", "Turma do Pagode", "GP da ZL", "Basan"] },
    { key: "festas_day_5", short: "Open Ginásio — Domingo", icon: "🏟️", kind: "Open Ginásio", date: "domingo, 22/11/2026", when: "12:00 → 18:00 · 6h", artists: [] }
  ];

  var lineupOptions = PROGRAMS.map(function (p) {
    return { label: p.icon + " " + p.short, next: p.key };
  }).concat([
    { label: "🎉 Menu Festas", next: "festas" },
    { label: "🏠 Menu principal", next: "root" }
  ]);

  function programDetail(p) {
    var text = p.icon + " *" + p.short + "*\n🏷️ " + p.kind + "\n📅 " + p.date + "\n🕐 " + p.when;
    if (p.artists.length) {
      text += "\n\n🎵 *Line-up:*\n" + p.artists.map(function (a) { return "• " + a; }).join("\n");
    }
    return text;
  }

  var avisosOptions = [
    { label: "✅ Quero receber", next: "avisos_optin" },
    { label: "🚫 Não quero", next: "avisos_optout" },
    { label: "🏛 Escolher atléticas", next: "avisos_atleticas" },
    { label: "🏠 Menu principal", next: "root" }
  ];

  var NODES = {
    root: {
      message:
        "🔥 Oi! Sou a *Chaminha*, assistente do *O'Inter*.\n\nTe ajudo com *jogos*, *festas* e dúvidas do evento.\n\nAbra o menu e escolha:",
      options: rootOptions
    },
    sports: {
      message: "⚽ *Esportes*\nO que você quer consultar?",
      options: sportsOptions
    },
    sports_live: {
      message:
        "📊 *Placar ao vivo*\n\n*Futsal Masculino — 1ª divisão*\n🟢 Atlética Leão 2 x 1 Atlética Fênix\n⏱ 2º tempo · 14:32\n📍 Ginásio Central\n\n*Vôlei Feminino — 2ª divisão*\n🟢 Atlética Coruja 1 x 1 Atlética Águia\n⏱ 1º set · 18:20\n📍 Quadra 2\n\n_(exemplo — no app real vem ao vivo do painel dos mesários)_",
      options: sportsOptions
    },
    sports_upcoming: {
      message:
        "📅 *Próximos jogos*\n\n*Basquete Masculino*\nAtlética Tigre x Atlética Lobo\n🕐 Hoje, 20:00 · 📍 Ginásio 2\n\n*Handebol Feminino*\nAtlética Fênix x Atlética Coruja\n🕐 Amanhã, 16:30 · 📍 Quadra 3",
      options: sportsOptions
    },
    sports_standings: {
      message:
        "📋 *Classificação — 1ª divisão (exemplo)*\n\n1º Atlética Leão — 32 pts\n2º Atlética Tigre — 26 pts\n3º Atlética Fênix — 21 pts\n4º Atlética Coruja — 18 pts\n\n_Pontos por colocação em cada modalidade: 1º = 16, 2º = 13, 3º = 11, 4º = 10…_",
      options: sportsOptions
    },
    sports_venues: {
      message:
        "🏟 *Praças esportivas*\n\n*Ginásio Central*\n📍 Av. dos Esportes, 100\n\n*Quadra 2*\n📍 Rua das Atléticas, 45",
      options: sportsOptions
    },
    festas: {
      message: "🎉 *O'Inter 2026*\n\nProgramação, local e ingressos das festas e do Open Ginásio. Escolha:",
      options: festasOptions
    },
    festas_today: {
      message:
        "📅 *Hoje (exemplo: sexta, 20/11)*\n\nO bot mostra tudo que está em andamento ou começa hoje — aqui, o Open Ginásio e a festa da noite:\n\n" +
        programDetail(PROGRAMS[0]) +
        "\n\n" +
        programDetail(PROGRAMS[1]),
      options: festasOptions
    },
    festas_lineup: {
      message:
        "🎤 *O'Inter 2026 — programação*\n\n" +
        PROGRAMS.map(function (p) {
          var short = p.date.split(", ")[1].slice(0, 5) + " · " + p.when.split(" · ")[0].replace(" → ", "–").replace(/ \(.*\)/, "");
          return p.icon + " *" + p.short + "*\n📅 " + short + (p.artists.length ? "\n🎵 " + p.artists.join(", ") : "");
        }).join("\n\n") +
        "\n\n_Toque em uma programação para ver os detalhes._",
      options: lineupOptions
    },
    festas_local: {
      message: "📍 *Local — O'Inter 2026*\nOpen Ginásio: Parque de Uso Múltiplo (P.U.M.) — Presidente Prudente\nFestas noturnas: local em breve\n🗺 _(quando houver, o link do mapa aparece aqui)_",
      options: festasOptions
    },
    festas_nearby: {
      message: "📍 *Perto da festa*\n\n🍱 Marmita da Dona Rosa — 200m\n💊 Farmácia Popular — 350m",
      options: festasOptions
    },
    avisos: {
      message: "🔔 *Avisos*\n\nQuer receber notificações do Inter (jogos e novidades)?",
      options: avisosOptions
    },
    avisos_optin: {
      message: "✅ Prontinho! Você vai receber avisos gerais do Inter. Pode cancelar quando quiser.",
      options: avisosOptions
    },
    avisos_optout: {
      message: "🚫 Ok, você não vai mais receber avisos gerais.",
      options: avisosOptions
    },
    avisos_atleticas: {
      message:
        "🏛 Escolha as atléticas para receber alertas de jogos.\n\n_(no app real apareceria a lista com todas as atléticas participantes)_",
      options: avisosOptions
    },
    desafios: {
      message:
        "🎯 *Desafios do Inter*\n\n🏆 Cabo de guerra — Atlética Leão x Atlética Tigre\n🕐 Hoje, 17h · 📍 Gramado central\n\n🏆 Queimada mista — Atlética Fênix x Atlética Coruja\n🕐 Amanhã, 15h · 📍 Quadra 1",
      options: [{ label: "🏠 Menu principal", next: "root" }]
    }
  };

  PROGRAMS.forEach(function (p) {
    NODES[p.key] = { message: programDetail(p), options: lineupOptions };
  });

  // Atlética: escolher uma atlética e ver seus jogos/desafios (nome é dinâmico)
  function startAtletica() {
    respond(
      "🏛 Escolha sua atlética:",
      ATLETICAS.map(function (name) {
        return { label: name, action: function () { showAtleticaResult(name); } };
      }).concat([{ label: "🏠 Menu principal", next: "root" }])
    );
  }

  function showAtleticaResult(name) {
    respond(
      "🏛 *" + name + "*\n\nSeus próximos jogos:\n⚽ Futsal — hoje, 19h\n🎯 Desafio — amanhã, 17h\n\n_(exemplo — os jogos reais da sua atlética apareceriam aqui)_",
      [
        { label: "🏛 Trocar atlética", action: startAtletica },
        { label: "🏠 Menu principal", next: "root" }
      ]
    );
  }

  // Alojamentos: escolher campus. Hoje nenhuma atlética tem escola vinculada,
  // então o bot real lista as escolas; depois da divisão, mostra endereço e serviços.
  function startAlojamentos() {
    respond(
      "🏠 De qual campus você é?",
      CAMPUSES.map(function (name) {
        return { label: name, action: function () { showCampusResult(name); } };
      }).concat([
        { label: "👀 Depois da divisão", action: function () { showAssignedExample(CAMPUSES[0]); } },
        { label: "🏠 Menu principal", next: "root" }
      ])
    );
  }

  function nearbyOptions(campus) {
    return [
      { label: "🍱 Marmita", action: function () { showNearby(campus, "marmita"); } },
      { label: "💊 Farmácia", action: function () { showNearby(campus, "farmacia"); } },
      { label: "🏥 Hospital", action: function () { showNearby(campus, "hospital"); } },
      { label: "🍔 Fast-food", action: function () { showNearby(campus, "fastfood"); } },
      { label: "🏠 Menu principal", next: "root" }
    ];
  }

  function showCampusResult() {
    respond(
      "🏠 *Alojamentos do Inter*\n\n" +
        ALOJAMENTOS.map(function (name) { return "• " + name; }).join("\n") +
        "\n\nAinda não saiu em qual deles fica a sua atlética. Assim que for divulgado, ele aparece aqui.",
      [
        { label: "💬 Ajuda", action: startHelp },
        { label: "🏠 Menu", next: "root" }
      ]
    );
  }

  function showAssignedExample(campus) {
    respond(
      "🏠 *" + ALOJAMENTOS[0] + "*\n_" + campus + "_\n📍 Rua das Flores, 123\n\n_(exemplo fictício de como fica depois da divisão das delegações)_\n\nServiços por perto:",
      nearbyOptions(campus)
    );
  }

  function showNearby(campus, type) {
    respond(NEARBY[type], nearbyOptions(campus));
  }

  // Ajuda: pergunta livre (FAQ simulado) + SOS Lieu
  var helpButtons = [
    { label: "✅ Encerrar", action: endHelp },
    { label: "🆘 Atendimento humano", action: triggerSos, danger: true },
    { label: "🏠 Menu principal", action: function () { STATE.mode = "menu"; goTo("root"); } }
  ];

  function startHelp() {
    STATE.mode = "help";
    respond(
      "💬 *Ajuda*\n\nEscreva sua dúvida sobre o O'Inter — jogos, modalidades, festas, ingressos, alojamento, horários…\n\n_Respondo com base na base de conhecimento do evento. Toque em Encerrar quando terminar._",
      helpButtons
    );
  }

  function answerFaq(question) {
    var normalized = normalize(question);
    var match = FAQ.filter(function (item) { return item.test.test(normalized); })[0];
    var answer = match
      ? match.answer
      : "Essa é uma simulação simplificada 🙂 No CHAMA real, eu respondo com base na base de conhecimento do evento e em dados ao vivo. Tente perguntar sobre modalidades, mata-mata, festas, ingresso, open bar ou alojamento!";
    respond(answer, helpButtons);
  }

  function endHelp() {
    STATE.mode = "feedback";
    respond("✨ *Antes de ir*\n\nConsegui te ajudar com sua dúvida?", [
      { label: "✅ Deu certo", action: function () {
          STATE.mode = "menu";
          respond("Que ótimo! Fico feliz em ajudar 🔥", rootOptions);
        } },
      { label: "❌ Ainda não", action: function () {
          STATE.mode = "suggestion";
          respond("Sem problemas! Quer deixar uma sugestão pra eu melhorar? Pode escrever, ou pular.", [
            { label: "⏭ Pular", action: function () {
                STATE.mode = "menu";
                respond("Tudo bem, obrigada! 🙌", rootOptions);
              } }
          ]);
        } }
    ]);
  }

  function triggerSos() {
    STATE.mode = "menu";
    respond(
      "🆘 *Atendimento Lieu*\n\nEm instantes alguém da equipe assume este chat.\n\nEnquanto isso, conte o que aconteceu — local, atlética e o que você precisa.\n\n_(simulação: no CHAMA real o bot pausa de verdade e um humano responde pelo painel)_",
      [{ label: "🏠 Menu principal", next: "root" }]
    );
  }

  // Roteamento por texto livre — espelha as palavras-chave do bot real
  function processUserText(rawText) {
    if (STATE.mode === "help") {
      return answerFaq(rawText);
    }

    if (STATE.mode === "suggestion") {
      STATE.mode = "menu";
      return respond("🙏 Obrigada pela sugestão! Ela é registrada para a comissão revisar.", rootOptions);
    }

    var normalized = normalize(rawText);

    // Ingresso, open bar, lote, esportivo, alojamento…: vai direto para a Ajuda, antes até da saudação
    if (isHelpTopic(normalized)) {
      STATE.mode = "help";
      return answerFaq(rawText);
    }

    if (/\b(oi|ola|hey|hi|menu|inicio)\b/.test(normalized)) return goTo("root");
    if (/jogo|placar|classifica|ranking|futsal|v[oô]lei|basquete|gin[aá]sio/.test(normalized)) return goTo("sports");
    if (/tenda|festa|show|lineup|line-up|dj|headliner/.test(normalized)) return goTo("festas");
    if (/atletica/.test(normalized)) return startAtletica();
    if (/alojamento|hospedagem|onde ficar|onde fico/.test(normalized)) return startAlojamentos();
    if (/desafio/.test(normalized)) return goTo("desafios");
    if (/aviso|alerta|notifica/.test(normalized)) return goTo("avisos");
    if (/ajuda|duvida|pergunta|help/.test(normalized)) return startHelp();

    respond("Não entendi 🤔 Aqui vão alguns atalhos:", [
      { label: "⚽ Esportes", next: "sports" },
      { label: "💬 Ajuda", action: startHelp },
      { label: "🏠 Menu principal", next: "root" }
    ]);
  }

  formEl.addEventListener("submit", function (event) {
    event.preventDefault();
    if (STATE.busy) return;
    var value = inputEl.value.trim();
    if (!value) return;
    inputEl.value = "";
    addMessage(value, "user");
    withTyping(function () {
      processUserText(value);
    });
  });

  function init() {
    STATE.mode = "menu";
    STATE.busy = false;
    messagesEl.innerHTML = "";
    optionsEl.innerHTML = "";
    inputEl.disabled = false;
    goTo("root");
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", init);
  }

  init();
})();
