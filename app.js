(function () {
  "use strict";

  var ACCESS_PIN = "__ACCESS_PIN__";
  var UNLOCK_KEY = "streambox-unlocked";

  function vibrate(ms) {
    if (navigator.vibrate) {
      navigator.vibrate(ms);
    }
  }

  (function initRefreshButton() {
    var btn = document.getElementById("refresh-btn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      btn.classList.add("spinning");
      vibrate(15);
      window.location.reload();
    });
  })();

  (function initLock() {
    var lockScreen = document.getElementById("lock-screen");
    var page = document.getElementById("page");
    var input = document.getElementById("lock-input");
    var error = document.getElementById("lock-error");

    function unlock() {
      localStorage.setItem(UNLOCK_KEY, "1");
      lockScreen.style.display = "none";
      page.hidden = false;
    }

    if (localStorage.getItem(UNLOCK_KEY) === "1") {
      unlock();
      return;
    }

    input.addEventListener("input", function () {
      error.textContent = "";
      if (input.value.length === 6) {
        if (input.value === ACCESS_PIN) {
          unlock();
        } else {
          error.textContent = "Code incorrect";
          vibrate(20);
          input.value = "";
        }
      }
    });

    setTimeout(function () {
      input.focus();
    }, 50);
  })();

  var toastEl = document.getElementById("toast");
  var toastTimer = null;

  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove("show");
    }, 1600);
  }

  function copyText(text) {
    // navigator.clipboard.writeText() est évité volontairement : sur Safari
    // iOS en mode "app installée sur l'écran d'accueil", elle a été observée
    // copier l'URL de la page elle-même au lieu du texte demandé quand le
    // geste n'est pas reconnu comme pleinement "de confiance". execCommand
    // sur un textarea est la méthode classique, fiable dans ce contexte.
    var el = document.createElement("textarea");
    el.value = text;
    el.style.p
