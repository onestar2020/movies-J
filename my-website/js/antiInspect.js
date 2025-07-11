(function () {
  const encodedParam = atob("P2Rldj0x"); // "?dev=1"
  const currentQuery = window.location.search;
  const devPassword = "hontoot12292017";

  const isDevMode =
    currentQuery === encodedParam &&
    prompt("Enter Developer Password:") === devPassword;

  function triggerLockdown() {
    // Clear content early
    document.body.innerHTML = "";
    document.documentElement.innerHTML = "";

    // Spam history to disable back navigation
    for (let i = 0; i < 100; i++) {
      history.pushState(null, "", "#locked" + i);
    }

    // Prevent user from using back button
    window.onpopstate = () => {
      history.go(1);
    };

    // Replace to about:blank (no history added)
    setTimeout(() => {
      location.replace("about:blank");
    }, 100);
  }

  if (!isDevMode) {
    // Disable right-click
    document.addEventListener("contextmenu", (e) => e.preventDefault());

    // Disable shortcuts
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

    // Debugger detection
    setInterval(() => {
      const t1 = performance.now();
      debugger;
      const t2 = performance.now();
      if (t2 - t1 > 100) triggerLockdown();
    }, 1000);

    // DevTools resize detection
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

  // Always block back button
  window.onpopstate = () => {
    history.go(1);
  };
})();
