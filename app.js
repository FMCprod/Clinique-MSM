(function () {
  "use strict";

  var LONG_PRESS_MS = 550;
  var MOVE_TOLERANCE = 12;
  var ACCESS_PIN = "__ACCESS_PIN__";
  var UNLOCK_KEY = "streambox-unlocked";

  function vibrate(ms) {
    if (navigator.vibrate) {
      navigator.vibrate(ms);
    }
  }

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

  function legacyCopy(text) {
    var el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.focus();
    el.select();
    try {
      document.execCommand("copy");
    } finally {
      document.body.removeChild(el);
    }
    return Promise.resolve();
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () {
        return legacyCopy(text);
      });
    }
    return legacyCopy(text);
  }

  function setupCard(card) {
    var url = card.getAttribute("data-url");
    var copyValue = card.getAttribute("data-copy") || url;
    var pressTimer = null;
    var longPressFired = false;
    var startX = 0;
    var startY = 0;

    function clearPressTimer() {
      clearTimeout(pressTimer);
      pressTimer = null;
    }

    function onPointerDown(e) {
      longPressFired = false;
      startX = e.clientX;
      startY = e.clientY;
      card.classList.add("is-pressed");
      pressTimer = setTimeout(function () {
        longPressFired = true;
        card.classList.remove("is-pressed");
        vibrate(15);
      }, LONG_PRESS_MS);
    }

    function onPointerMove(e) {
      if (!pressTimer) return;
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;
      if (Math.sqrt(dx * dx + dy * dy) > MOVE_TOLERANCE) {
        clearPressTimer();
        card.classList.remove("is-pressed");
      }
    }

    function onPointerUp() {
      card.classList.remove("is-pressed");
      var wasLongPress = longPressFired;
      clearPressTimer();
      if (wasLongPress) {
        // Doit rester synchrone dans ce gestionnaire : Safari iOS refuse
        // silencieusement clipboard/execCommand si l'appel est différé
        // (ex: dans le setTimeout du long press) hors du geste utilisateur.
        copyText(copyValue).then(function () {
          showToast("Lien copié");
        });
      } else {
        window.open(url, "_blank", "noopener");
      }
    }

    function onPointerCancel() {
      card.classList.remove("is-pressed");
      clearPressTimer();
    }

    card.addEventListener("pointerdown", onPointerDown);
    card.addEventListener("pointermove", onPointerMove);
    card.addEventListener("pointerup", onPointerUp);
    card.addEventListener("pointercancel", onPointerCancel);
    card.addEventListener("pointerleave", onPointerCancel);
    card.addEventListener("contextmenu", function (e) {
      e.preventDefault();
    });
  }

  document.querySelectorAll(".card").forEach(setupCard);

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("service-worker.js").catch(function () {});
    });
  }
})();
