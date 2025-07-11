// ✅ Encrypted Dev Mode Param (?dev=1)
const allowedDevParam = atob("P2Rldj0x"); // => "?dev=1"
const currentQuery = window.location.search;

// ✅ Updated Developer Password
const devPassword = "hontoot12292017";

// ✅ Allow developer mode ONLY if URL is correct AND password is entered correctly
const isDevMode = currentQuery === allowedDevParam && prompt("Enter Developer Password:") === devPassword;

// 🔒 Lockdown function: Wipe and redirect to about:blank, disable back button
function triggerLockdown() {
  history.pushState(null, '', location.href);
  window.onpopstate = () => history.go(1); // Disable browser back
  document.body.innerHTML = "";
  location.replace("about:blank");
}

if (!isDevMode) {
  // 🔒 Disable right-click
  document.addEventListener("contextmenu", e => e.preventDefault());

  // 🔒 Block DevTools & View Source key combos
  document.addEventListener("keydown", e => {
    const key = e.key.toUpperCase();
    const ctrl = e.ctrlKey;
    const shift = e.shiftKey;
    const meta = e.metaKey;

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

  // 🔒 Detect DevTools via debugger pause timing
  setInterval(() => {
    const t1 = performance.now();
    debugger;
    const t2 = performance.now();
    if (t2 - t1 > 100) triggerLockdown();
  }, 1000);

  // 🔒 Detect via suspicious window size (DevTools resize)
  setInterval(() => {
    const threshold = 160;
    if (
      window.outerWidth - window.innerWidth > threshold ||
      window.outerHeight - window.innerHeight > threshold
    ) triggerLockdown();
  }, 1000);

  // 🔒 Redetect on history back (from about:blank)
  const devToolDetector = setInterval(() => {
    const widthThreshold = window.outerWidth - window.innerWidth > 160;
    const heightThreshold = window.outerHeight - window.innerHeight > 160;
    if (widthThreshold || heightThreshold) {
      clearInterval(devToolDetector);
      triggerLockdown();
    }
  }, 500);
}
