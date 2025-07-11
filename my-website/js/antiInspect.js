// ⛔ Default: Protection is ON unless dev mode is activated
let isDevMode = false;

// ⌨️ SECRET COMBO TO ACTIVATE DEV MODE: Shift + M + J
let keyBuffer = [];

document.addEventListener("keydown", (e) => {
  keyBuffer.push(e.key.toUpperCase());
  if (keyBuffer.length > 3) keyBuffer.shift();

  if (
    keyBuffer.includes("SHIFT") &&
    keyBuffer.includes("M") &&
    keyBuffer.includes("J")
  ) {
    isDevMode = true;
    alert("🛠️ Developer Mode Activated");
  }
});

function enableProtection() {
  // 🔒 Disable Right Click
  document.addEventListener("contextmenu", e => e.preventDefault());

  // 🔒 Disable Key Combos (F12, Ctrl+U, etc.)
  document.addEventListener("keydown", e => {
    if (
      e.key === "F12" ||
      (e.ctrlKey && e.shiftKey && e.key.toUpperCase() === "I") ||
      (e.ctrlKey && e.shiftKey && e.key.toUpperCase() === "J") ||
      (e.ctrlKey && e.key.toUpperCase() === "U")
    ) {
      e.preventDefault();
      alert("Inspect Element is disabled.");
    }
  });

  // 🔒 Detect DevTools via debugger timing
  setInterval(() => {
    const t1 = performance.now();
    debugger;
    const t2 = performance.now();
    if (t2 - t1 > 100) {
      document.body.innerHTML = '';
      window.location.href = 'about:blank';
    }
  }, 1000);

  // 🔒 Detect DevTools by window resize difference
  setInterval(() => {
    const threshold = 160;
    if (
      window.outerWidth - window.innerWidth > threshold ||
      window.outerHeight - window.innerHeight > threshold
    ) {
      document.body.innerHTML = '';
      window.location.href = 'about:blank';
    }
  }, 1000);
}

// ✅ Run only when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    if (!isDevMode) enableProtection();
  }, 300); // Slight delay to stabilize
});
