(function () {
  const encodedParam = atob("P2Rldj0x"); // => "?dev=1"
  const currentQuery = window.location.search;
  const devPassword = "hontoot12292017";

  const isDevMode =
    currentQuery === encodedParam &&
    prompt("Enter Developer Password:") === devPassword;

  function triggerLockdown() {
    // Stuff history to block back navigation permanently
    for (let i = 0; i < 50; i++) {
      history.pushState(null, "", "#");
    }

    // Force forward navigation only
    history.pushState(null, "", location.href);
    window.onpopstate = () => history.go(1);

    // Erase content immediately
    document.body.innerHTML = "";

    // After short delay, replace with about:blank
    setTimeout(() => {
      // Write a dummy state to prevent return with back button
      window.location.replace("about:blank");
    }, 50);
  }

  if (!isDevMode) {
    document.addEventListener("contextmenu", (e) => e.preventDefault());

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

    setInterval(() => {
      const t1 = performance.now();
      debugger;
      const t2 = performance.now();
      if (t2 - t1 > 100) triggerLockdown();
    }, 1000);

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
