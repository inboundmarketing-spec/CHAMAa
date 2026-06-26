(function () {
  "use strict";

  // Mobile nav
  const toggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");

  if (toggle && navLinks) {
    toggle.addEventListener("click", function () {
      const open = navLinks.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });

    navLinks.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        navLinks.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Role tabs
  const tabs = document.querySelectorAll(".role-tab");
  const panels = document.querySelectorAll(".role-panel");

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      const role = tab.getAttribute("data-role");

      tabs.forEach(function (t) {
        t.classList.remove("active");
      });
      tab.classList.add("active");

      panels.forEach(function (panel) {
        panel.classList.remove("active");
      });

      const target = document.getElementById("role-" + role);
      if (target) {
        target.classList.add("active");
      }
    });
  });

  // Highlight active nav on scroll
  const sections = document.querySelectorAll("section[id]");
  const navAnchors = document.querySelectorAll(".nav-links a");

  if (sections.length && navAnchors.length) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("id");
            navAnchors.forEach(function (a) {
              a.classList.toggle("active", a.getAttribute("href") === "#" + id);
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
