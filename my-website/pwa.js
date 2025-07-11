// ✅ Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(registration => {
        console.log('✅ Service Worker registered:', registration.scope);

        // Optional: Force check for updates
        registration.update();
      })
      .catch(error => {
        console.error('❌ Service Worker registration failed:', error);
      });
  });
}

// ✅ Handle PWA Install Prompt
let deferredPrompt = null;

document.addEventListener('DOMContentLoaded', () => {
  const installBtn = document.getElementById('install-btn');

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // Stop default mini-infobar
    deferredPrompt = e;

    if (installBtn) {
      installBtn.style.display = 'block';
    }
  });

  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;

      deferredPrompt.prompt();

      const { outcome } = await deferredPrompt.userChoice;
      console.log(outcome === 'accepted'
        ? '✅ User accepted the install prompt'
        : '❌ User dismissed the install prompt');

      deferredPrompt = null;
      installBtn.style.display = 'none';
    });
  }

  // ✅ Show fallback ad if running in PWA standalone mode
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const fallbackAd = document.getElementById('pwa-fallback-ad');
  if (isStandalone && fallbackAd) {
    fallbackAd.style.display = 'block';
  }
});

// ✅ Optional: Toggle button visibility for testing
function toggleInstallBtn() {
  const btn = document.getElementById('install-btn');
  if (btn) {
    btn.style.display = (btn.style.display === 'none') ? 'block' : 'none';
  }
}
