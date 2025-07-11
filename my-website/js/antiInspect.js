(function () {
  const encodedParam = atob("P2Rldj0x"); // "?dev=1"
  const currentQuery = window.location.search;
  const devPassword = "hontoot12292017";

  const isDevMode =
    currentQuery === encodedParam &&
    prompt("Enter Developer Password:") === devPassword;

  // 🔒 Trigger lockdown: redirect to about:blank and prevent going back
  function triggerLockdown() {
    // Push dummy history to block going back
    for (let i = 0; i < 50; i++) {
      history.pushState(null, "", "#");
    }

    // Prevent navigating back
    window.onpopstate = () => {
      history.go(1);
      location.replace("about:blank");
    };

    // Prevent refresh or leave
    window.onbeforeunload = () => {
      return null;
    };

    // Clear body and force replace
    document.body.innerHTML = "";
    setTimeout(() => {
      location.replace("about:blank");
    }, 50);
  }

  if (!isDevMode) {
    // Disable right-click
    document.addEventListener("contextmenu", (e) => e.preventDefault());

    // Disable common shortcuts
    document.addEventListener("keydown", (e) => {
      const key = e.key.toUpperCase();
      const ctrl = e.ctrlKey;
      const shift = e.shiftKey;
      const meta = e.metaKey;

      const blocked =
        key === "F12" ||
        (ctrl && shift && ["I", "J", "C", "K", "M", "E"].includes(key)) ||
        (ctrl && ["U", "S", "P"].includes(key)) ||
        (meta && ["S", "P"].includes(key));

      if (blocked) {
        e.preventDefault();
        triggerLockdown();
      }
    });

    // DevTools detection: debugger delay
    setInterval(() => {
      const t1 = performance.now();
      debugger;
      const t2 = performance.now();
      if (t2 - t1 > 100) triggerLockdown();
    }, 1000);

    // DevTools detection: resize threshold
    setInterval(() => {
      const threshold = 160;
      if (
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold
      ) {
        triggerLockdown();
      }
    }, 1000);
  }

  // 🧠 Global protection: block back even on normal load
  window.onpopstate = () => history.go(1);
})();
