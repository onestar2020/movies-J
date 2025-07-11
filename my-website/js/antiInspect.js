(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const encodedParam = atob("P2Rldj0x"); // "?dev=1"
    const currentQuery = window.location.search;
    const devPassword = "hontoot12292017";

    let isDevMode = false;

    if (currentQuery === encodedParam) {
      const pwd = prompt("Enter Developer Password:");
      if (pwd === devPassword) {
        isDevMode = true;
        console.log("✅ Developer Mode Activated");
      } else {
        alert("❌ Wrong password. Protection remains active.");
      }
    }

    function triggerLockdown() {
      // Clear all content immediately
      document.body.innerHTML = "";
      document.documentElement.innerHTML = "";

      // Spam history stack to break back navigation
      for (let i = 0; i < 100; i++) {
        history.pushState(null, "", "#locked" + i);
      }

      // Reinforce back-button lock
      window.onpopstate = () => history.go(1);

      // Replace with about:blank
      setTimeout(() => {
        location.replace("about:blank");
      }, 100);
    }

    if (!isDevMode) {
      // Disable right-click
      document.addEventListener("contextmenu", (e) => e.preventDefault());

      // Disable developer shortcut keys
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

      // Detect pause from debugger
      setInterval(() => {
        const t1 = performance.now();
        debugger;
        const t2 = performance.now();
        if (t2 - t1 > 100) triggerLockdown();
      }, 1000);

      // Detect DevTools resizing
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

    // Always reinforce back-button block
    window.onpopstate = () => history.go(1);
  });
})();
