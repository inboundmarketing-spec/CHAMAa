(function () {
  "use strict";

  var MOBILE_NAV_QUERY = "(max-width: 768px)";

  function isMobileNav() {
    return window.matchMedia(MOBILE_NAV_QUERY).matches;
  }

  function setNavOpen(toggle, navLinks, open) {
    navLinks.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");

    if (isMobileNav()) {
      if (open) {
        navLinks.removeAttribute("inert");
      } else {
        navLinks.setAttribute("inert", "");
      }
    } else {
      navLinks.removeAttribute("inert");
    }
  }

  // Mobile nav
  var toggle = document.querySelector(".nav-toggle");
  var navLinks = document.querySelector(".nav-links");

  if (toggle && navLinks) {
    setNavOpen(toggle, navLinks, false);

    toggle.addEventListener("click", function () {
      var open = !navLinks.classList.contains("open");
      setNavOpen(toggle, navLinks, open);
    });

    navLinks.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setNavOpen(toggle, navLinks, false);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && navLinks.classList.contains("open")) {
        setNavOpen(toggle, navLinks, false);
        toggle.focus();
      }
    });

    window.matchMedia(MOBILE_NAV_QUERY).addEventListener("change", function () {
      if (!isMobileNav()) {
        navLinks.classList.remove("open");
        navLinks.removeAttribute("inert");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Abrir menu");
      } else if (!navLinks.classList.contains("open")) {
        navLinks.setAttribute("inert", "");
      }
    });
  }

  // Role tabs
  var tablist = document.querySelector(".role-tabs");
  var tabs = document.querySelectorAll(".role-tab");
  var panels = document.querySelectorAll(".role-panel");

  function activateTab(tab) {
    var role = tab.getAttribute("data-role");
    var target = document.getElementById("role-" + role);

    tabs.forEach(function (t) {
      var selected = t === tab;
      t.classList.toggle("active", selected);
      t.setAttribute("aria-selected", String(selected));
      t.tabIndex = selected ? 0 : -1;
    });

    panels.forEach(function (panel) {
      var isTarget = panel === target;
      panel.classList.toggle("active", isTarget);
      panel.toggleAttribute("hidden", !isTarget);
    });
  }

  tabs.forEach(function (tab, index) {
    tab.addEventListener("click", function () {
      activateTab(tab);
    });

    tab.addEventListener("keydown", function (event) {
      var nextIndex = index;
      var lastIndex = tabs.length - 1;

      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        nextIndex = index === lastIndex ? 0 : index + 1;
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        nextIndex = index === 0 ? lastIndex : index - 1;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = lastIndex;
      } else {
        return;
      }

      event.preventDefault();
      tabs[nextIndex].focus();
      activateTab(tabs[nextIndex]);
    });
  });

  if (tablist && tabs.length) {
    activateTab(document.querySelector(".role-tab.active") || tabs[0]);
  }

  // Highlight active nav on scroll
  var sectionNavMap = {
    "visao-geral": "inicio"
  };
  var sections = document.querySelectorAll("section[id]");
  var navAnchors = document.querySelectorAll(".nav-links a");

  if (sections.length && navAnchors.length) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var id = entry.target.getAttribute("id");
            var navId = sectionNavMap[id] || id;
            navAnchors.forEach(function (a) {
              a.classList.toggle("active", a.getAttribute("href") === "#" + navId);
            });
          }
        });
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }
})();
