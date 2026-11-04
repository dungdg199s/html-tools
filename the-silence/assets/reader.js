(function () {
  "use strict";
  var KEY = "silence-reader";
  var THEMES = ["", "light", "sepia", "dark"]; // "" = theo hệ thống
  var root = document.documentElement;

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { return {}; }
  }
  function save(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
  }

  var state = load();

  function apply() {
    if (state.theme) root.dataset.theme = state.theme; else delete root.dataset.theme;
    if (state.size) root.style.setProperty("--reader-size", state.size + "px");
  }

  document.addEventListener("click", function (ev) {
    var btn = ev.target.closest && ev.target.closest("[data-action]");
    if (!btn) return;
    var size = state.size || 19;
    switch (btn.dataset.action) {
      case "smaller": state.size = Math.max(15, size - 1); break;
      case "larger": state.size = Math.min(28, size + 1); break;
      case "theme":
        var i = THEMES.indexOf(state.theme || "");
        state.theme = THEMES[(i + 1) % THEMES.length];
        break;
    }
    apply(); save(state);
  });

  // ----- Trang đọc: nhớ chương, nhớ vị trí, thanh tiến độ, phím tắt -----
  var chapter = document.querySelector("main.chapter");
  if (chapter) {
    var code = chapter.dataset.code;
    var ed = chapter.dataset.edition || "";
    if (ed) { state.lastBy = state.lastBy || {}; state.lastBy[ed] = code; }
    else state.last = code;
    state.read = state.read || {};
    state.pos = state.pos || {};
    save(state);

    var bar = document.createElement("div");
    bar.className = "progress";
    document.body.appendChild(bar);

    var saved = state.pos[code];
    if (saved && !location.hash) {
      window.addEventListener("load", function () {
        window.scrollTo(0, saved * (document.documentElement.scrollHeight - innerHeight));
      });
    }

    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var max = document.documentElement.scrollHeight - innerHeight;
        var p = max > 0 ? Math.min(1, scrollY / max) : 1;
        bar.style.width = (p * 100) + "%";
        state.pos[code] = Math.round(p * 1000) / 1000;
        if (p > 0.92) state.read[code] = true;
        save(state);
      });
    }, { passive: true });

    document.addEventListener("keydown", function (ev) {
      if (ev.altKey || ev.ctrlKey || ev.metaKey) return;
      var rel = ev.key === "ArrowLeft" ? "prev" : ev.key === "ArrowRight" ? "next" : null;
      var link = rel && document.querySelector('a[rel="' + rel + '"]');
      if (link) location.href = link.href;
    });
  }

  // ----- Trang mục lục: đánh dấu đã đọc, nút "Đọc tiếp" -----
  var list = window.SILENCE_CHAPTERS;
  if (list) {
    var read = state.read || {};
    var edition = window.SILENCE_EDITION || "";
    var last = edition ? (state.lastBy || {})[edition] : state.last;
    var lastLink = null;
    document.querySelectorAll(".toc a[data-code]").forEach(function (a) {
      if (read[a.dataset.code]) a.classList.add("read");
      if (a.dataset.code === last) { a.classList.add("current"); lastLink = a; }
    });
    var cont = document.getElementById("continue");
    if (cont && lastLink) {
      cont.href = lastLink.getAttribute("href");
      cont.hidden = false;
    }
  }
})();
