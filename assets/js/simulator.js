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

  var FAQ = [
    { test: /festa|show|tenda|line ?up|dj/, answer: "As festas duram 3 dias, com programação, local e vídeo no menu 🎉 Festas. Cada dia dura cerca de 12 horas!" },
    { test: /jogo|placar|futsal|v[oô]lei|basquete|gin[aá]sio|hor[aá]rio/, answer: "O placar ao vivo e a agenda completa estão no menu ⚽ Esportes — os dados vêm direto do painel, atualizados pelos mesários em tempo real." },
    { test: /alojamento|hospedagem|onde fico|onde ficar/, answer: "O endereço do seu alojamento e os serviços por perto (marmita, farmácia, hospital) estão no menu 🏠 Alojamentos." },
    { test: /atl[eé]tica/, answer: "Você escolhe sua atlética no menu 🏛 Atlética e vê os jogos e desafios do seu campus." },
    { test: /sos|humano|atendente|socorro|pessoa de verdade/, answer: "Se quiser falar com alguém da equipe, toque em \"🆘 Atendimento humano\" aqui na Ajuda." },
    { test: /obrigad|valeu|show de bola/, answer: "De nada! 🔥 Qualquer coisa, estou por aqui." }
  ];

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
    { label: "🎤 Os 3 dias", next: "festas_lineup" },
    { label: "📍 Local", next: "festas_local" },
    { label: "📍 Serviços perto", next: "festas_nearby" },
    { label: "🏠 Menu principal", next: "root" }
  ];

  var avisosOptions = [
    { label: "✅ Quero receber", next: "avisos_optin" },
    { label: "🚫 Não quero", next: "avisos_optout" },
    { label: "🏛 Escolher atléticas", next: "avisos_atleticas" },
    { label: "🏠 Menu principal", next: "root" }
  ];

  var NODES = {
    root: {
      message:
        "🔥 Oi! Sou a *Chaminha*, assistente do Interunesp.\n\nTe ajudo com *jogos*, *festas* e dúvidas do evento.\n\nAbra o menu e escolha:",
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
        "📋 *Classificação — 1ª divisão (exemplo)*\n\n1º Atlética Leão — 12 pts\n2º Atlética Tigre — 10 pts\n3º Atlética Fênix — 7 pts\n4º Atlética Coruja — 4 pts",
      options: sportsOptions
    },
    sports_venues: {
      message:
        "🏟 *Praças esportivas*\n\n*Ginásio Central*\n📍 Av. dos Esportes, 100\n\n*Quadra 2*\n📍 Rua das Atléticas, 45",
      options: sportsOptions
    },
    festas: {
      message: "🎉 *Festas do Inter*\n\nCada dia dura cerca de *12 horas*. Escolha:",
      options: festasOptions
    },
    festas_today: {
      message:
        "📅 *Hoje*\n\n🎤 20h — Abertura com bateria da atlética\n🎶 21h30 — Banda de pagode\n🔥 23h — Show principal\n🎧 01h — Pista aberta com DJ",
      options: festasOptions
    },
    festas_lineup: {
      message:
        "🎤 *3 dias de festa (exemplo)*\n\n*Dia 1* — Pagode + show principal\n*Dia 2* — Sertanejo + DJ\n*Dia 3* — Funk + encerramento",
      options: festasOptions
    },
    festas_local: {
      message: "📍 *Local*\n\nArena do Inter — Av. Central, 500\n🗺 _(o link do mapa apareceria aqui)_",
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

  // Alojamentos: escolher campus e ver endereço + serviços perto
  function startAlojamentos() {
    respond(
      "🏠 De qual campus você é?",
      CAMPUSES.map(function (name) {
        return { label: name, action: function () { showCampusResult(name); } };
      }).concat([{ label: "🏠 Menu principal", next: "root" }])
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

  function showCampusResult(campus) {
    respond("🏠 *Alojamento — " + campus + "*\n\n📍 Rua das Flores, 123\n\nServiços por perto:", nearbyOptions(campus));
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
      "💬 *Ajuda*\n\nEscreva sua dúvida sobre o Interunesp — jogos, festas, horários…\n\n_Respondo com base na base de conhecimento do evento. Toque em Encerrar quando terminar._",
      helpButtons
    );
  }

  function answerFaq(question) {
    var normalized = normalize(question);
    var match = FAQ.filter(function (item) { return item.test.test(normalized); })[0];
    var answer = match
      ? match.answer
      : "Essa é uma simulação simplificada 🙂 No CHAMA real, eu respondo com base na base de conhecimento do evento e em dados ao vivo. Tente perguntar sobre jogos, festas ou alojamento!";
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

    if (/\b(oi|ola|hey|hi|menu|inicio)\b/.test(normalized)) return goTo("root");
    if (/jogo|placar|futsal|v[oô]lei|basquete|gin[aá]sio/.test(normalized)) return goTo("sports");
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
