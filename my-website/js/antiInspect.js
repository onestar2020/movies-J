// FINAL LOCKED-DOWN VERSION
(function () {
  document.addEventListener("DOMContentLoaded", () => {
    
    // Ang function na nagla-lock ng page
    function triggerLockdown() {
      document.body.innerHTML = "";
      document.documentElement.innerHTML = "";

      for (let i = 0; i < 100; i++) {
        history.pushState(null, "", "#locked" + i);
      }

      window.onpopstate = () => {
        history.go(1);
      };

      setTimeout(() => {
        location.replace("blank.html");
      }, 100);
    }

    // --- LAHAT NG PROTEKSYON AY LAGING NAKA-ON ---

    // 1. I-disable ang right-click
    document.addEventListener("contextmenu", (e) => e.preventDefault());

    // 2. I-disable ang developer shortcut keys
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

    // 3. I-detect ang debugger pause
    setInterval(() => {
      const t1 = performance.now();
      debugger;
      const t2 = performance.now();
      if (t2 - t1 > 100) triggerLockdown();
    }, 1000);

    // 4. I-detect ang DevTools window resize
    setInterval(() => {
      const threshold = 160;
      if (
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold
      ) {
        triggerLockdown();
      }
    }, 1000);

    // 5. Palaging i-block ang back navigation
    window.onpopstate = () => {
      history.go(1);
    };
  });
})();