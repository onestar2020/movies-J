// ⛔ Default: Protection is ON unless dev mode is activated
let isDevMode = false;

// ⌨️ SECRET COMBO TO ACTIVATE DEV MODE: Shift + M + J
let keySeq = [];

document.addEventListener("keydown", (e) => {
  const key = e.key.toUpperCase();

  // Track only alphabet keys
  if (/^[A-Z]$/.test(key)) {
    keySeq.push(key);
    if (keySeq.length > 2) keySeq.shift(); // Keep last 2 letters
  }

  // Detect: Shift + M + J sequence
  if (e.shiftKey && keySeq.join('') === 'MJ') {
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

// ✅ Run protection if not in dev mode
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    if (!isDevMode) enableProtection();
  }, 300); // Slight delay to stabilize
});
