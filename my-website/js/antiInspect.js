const allowedDevParam = atob("P2Rldj0x"); // "?dev=1"
const currentQuery = window.location.search;
const devPassword = "masterjay2025";

// ✅ Allow developer mode ONLY with correct URL + password
const isDevMode = currentQuery === allowedDevParam && prompt("Enter Developer Password:") === devPassword;

// 🔐 Lockdown function: wipe site and redirect
function triggerLockdown() {
  document.body.innerHTML = "";
  window.location.href = "about:blank";
}

if (!isDevMode) {
  // 🔒 Block right click
  document.addEventListener("contextmenu", e => e.preventDefault());

  // 🔒 Block ALL known DevTools key combos
  document.addEventListener("keydown", e => {
    const key = e.key.toUpperCase();
    const ctrl = e.ctrlKey;
    const shift = e.shiftKey;
    const meta = e.metaKey; // for MacOS Command key

    const blocked =
      key === "F12" ||
      (ctrl && shift && key === "I") ||
      (ctrl && shift && key === "J") ||
      (ctrl && key === "U") ||
      (ctrl && shift && key === "C") ||
      (ctrl && key === "S") ||
      (meta && key === "S") ||
      (ctrl && key === "P") ||
      (meta && key === "P") ||
      (ctrl && shift && key === "K") ||
      (ctrl && shift && key === "M") ||
      (ctrl && shift && key === "E");

    if (blocked) {
      e.preventDefault();
      triggerLockdown();
    }
  });

  // 🔒 Detect DevTools via debugger pause
  setInterval(() => {
    const t1 = performance.now();
    debugger;
    const t2 = performance.now();
    if (t2 - t1 > 100) {
      triggerLockdown();
    }
  }, 1000);

  // 🔒 Detect window resize difference
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
