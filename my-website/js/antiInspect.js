// Disable Right Click
document.addEventListener("contextmenu", e => e.preventDefault());

// Disable Key Combos (F12, Ctrl+U, etc.)
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

// Detect DevTools via debugger timing
setInterval(() => {
  const t1 = performance.now();
  debugger;
  const t2 = performance.now();
  if (t2 - t1 > 100) {
    document.body.innerHTML = '';
    window.location.href = 'about:blank';
  }
}, 1000);

// Detect DevTools by resize difference
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
