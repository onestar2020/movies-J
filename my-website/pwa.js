// ✅ Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(reg => {
        console.log('✅ Service Worker registered:', reg.scope);
      })
      .catch(err => {
        console.error('❌ Service Worker failed:', err);
      });
  });
}

// ✅ Handle PWA Install Prompt
let deferredPrompt;

document.addEventListener('DOMContentLoaded', () => {
  const installBtn = document.getElementById('install-btn');

  // Listen for install prompt availability
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // Prevent default banner
    deferredPrompt = e;

    // ✅ Show install button
    if (installBtn) {
      installBtn.style.display = 'block';
    }
  });

  // On install button click
  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt(); // Show native prompt
        const result = await deferredPrompt.userChoice;

        if (result.outcome === 'accepted') {
          console.log('✅ User accepted the install prompt');
        } else {
          console.log('❌ User dismissed the install prompt');
        }

        deferredPrompt = null;
        installBtn.style.display = 'none'; // Hide after decision
      }
    });
  }
});

// ✅ Optional: Manually toggle install button for testing
function toggleInstallBtn() {
  const btn = document.getElementById('install-btn');
  if (btn) {
    btn.style.display = (btn.style.display === 'none') ? 'block' : 'none';
  }
}
