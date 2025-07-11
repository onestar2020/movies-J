(function () {
  const encodedParam = atob("P2Rldj0x"); // "?dev=1"
  const currentQuery = window.location.search;
  const devPassword = "hontoot12292017";

  const isDevMode =
    currentQuery === encodedParam &&
    prompt("Enter Developer Password:") === devPassword;

  // 🔒 Trigger full lockdown: block back button + redirect
  function triggerLockdown() {
    // Stuff history to prevent going back
    for (let i = 0; i < 30; i++) {
      history.pushState(null, "", "#");
    }

    // Force forward loop
    history.pushState(null, "", location.href);
    window.onpopstate = () => history.go(1);

    // Clear content and redirect
    document.body.innerHTML = "";
    setTimeout(() => {
      location.href = "about:blank";
    }, 10);
  }

  if (!isDevMode) {
    // 🔒 Disable Right Click
    document.addEventListener("contextmenu", (e) => e.preventDefault());

    // 🔒 Block DevTools & View Source shortcuts
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

    // 🔒 Detect DevTools open via debugger delay
    setInterval(() => {
      const t1 = performance.now();
      debugger;
      const t2 = performance.now();
      if (t2 - t1 > 100) triggerLockdown();
    }, 1000);

    // 🔒 Detect DevTools via resize threshold
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
})();
