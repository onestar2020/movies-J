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
      document.body.innerHTML = "";
      document.documentElement.innerHTML = "";

      for (let i = 0; i < 100; i++) {
        history.pushState(null, "", "#locked" + i);
      }

      window.onpopstate = () => {
        history.go(1);
      };

      // ✅ Redirect to blank.html (not about:blank)
      setTimeout(() => {
        location.replace("blank.html");
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

      // Detect debugger pause
      setInterval(() => {
        const t1 = performance.now();
        debugger;
        const t2 = performance.now();
        if (t2 - t1 > 100) triggerLockdown();
      }, 1000);

      // Detect DevTools window resize
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

    // Always block back navigation
    window.onpopstate = () => {
      history.go(1);
    };
  });
})();
