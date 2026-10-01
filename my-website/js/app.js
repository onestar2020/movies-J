/* ============================================================
   MOVIES-J PREMIUM — APP SHELL (js/app.js)
   Navbar state, mobile tab bar, search overlay, scroll UI
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Site-wide anti-inspect guards (LAHAT ng pages) ---------- */
  // Right-click + devtools shortcut blocking
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  document.addEventListener('keydown', (e) => {
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) ||
      (e.ctrlKey && ['U', 'u', 'S', 's'].includes(e.key))
    ) {
      e.preventDefault();
      return false;
    }
  });

  // DevTools size heuristic: blur shield kapag may nakabukas na panel
  // SKIP sa mobile/touch devices — ang browser chrome ng mobile (URL bar, bottom
  // toolbar) ay laging gumagawa ng malaking outer/inner gap = false positive!
  // Desktop lang (pointer: fine) ang magpa-patak nito.
  let _shield = null;
  setInterval(function () {
    try {
      // Bulletproof mobile check: touch device = HUWAG magpakita ng shield kahit anong mangyari
      var isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
      if (isTouch || !window.matchMedia || !window.matchMedia('(pointer: fine)').matches) {
        // Touch device: siguraduhing WALANG shield, hindi lang i-skip
        if (_shield) { _shield.remove(); _shield = null; }
        return;
      }
      var gapW = window.outerWidth - window.innerWidth;
      var gapH = window.outerHeight - window.innerHeight;
      var open = gapW > 160 || gapH > 160;
      if (open && !_shield) {
        _shield = document.createElement('div');
        _shield.id = 'devtools-shield';
        _shield.innerHTML =
          '<div style="text-align:center;color:#fff;font-family:inherit;">' +
          '<i class="fas fa-shield-halved" style="font-size:42px;color:#e50914;margin-bottom:14px;"></i>' +
          '<h2 style="margin:0 0 8px;">Content Protected</h2>' +
          '<p style="margin:0;color:#aaa;font-size:13px;">Please close Developer Tools to continue.</p>' +
          '</div>';
        _shield.style.cssText =
          'position:fixed;inset:0;z-index:2147483647;background:rgba(5,5,8,0.985);backdrop-filter:blur(18px);display:flex;align-items:center;justify-content:center;';
        document.body.appendChild(_shield);
        try { console.clear(); } catch (e) {}
      } else if (!open && _shield) {
        _shield.remove();
        _shield = null;
      }
    } catch (e) { /* ignore */ }
  }, 1200);

  /* ---------- Visit & Activity Tracking (para sa Admin Dashboard) ---------- */
  // Lightweight: 1 fetch kada visit. Aggregate lang — walang personal data na naka-save.
  (function trackVisit() {
    try {
      var FIREBASE_RTDB = 'https://movies-j-stream-default-rtdb.asia-southeast1.firebasedatabase.app';
      var today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      var dayKey = 'stats/' + today;

      fetch(FIREBASE_RTDB + '/' + dayKey + '.json', { method: 'GET' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (day) {
          day = day || {};
          var body = {
            views: ((day.views || 0) + 1),
            lastUpdated: Date.now()
          };
          // Unique visitor: random ID sa localStorage (walang PII)
          try {
            var vid = localStorage.getItem('mj_vid');
            if (!vid) {
              vid = 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
              localStorage.setItem('mj_vid', vid);
            }
            body['visitors/' + vid] = true;
          } catch (e) {}
          return fetch(FIREBASE_RTDB + '/' + dayKey + '.json', {
            method: 'PATCH',
            body: JSON.stringify(body)
          });
        })
        .catch(function () {});
    } catch (e) { /* tracking failure = hindi kritikal */ }
  })();

  /* ---------- Guest Presence Heartbeat (para sa Admin Dashboard) ---------- */
  // Kahit hindi naka-login, may "Guest XXXX" entry na may green/red dot sa dashboard.
  // Gumagamit ng mj_vid (localStorage) — walang PII, random ID lang.
  (function trackGuestPresence() {
    try {
      var RTDB = 'https://movies-j-stream-default-rtdb.asia-southeast1.firebasedatabase.app';
      var vid = null;
      try { vid = localStorage.getItem('mj_vid'); } catch (e) {}
      if (!vid) return; // strict browsers na block localStorage — skip
      var key = 'presence/guests/' + vid.replace(/[^a-zA-Z0-9_-]/g, '');

      var beat = function () {
        if (document.hidden) return; // tipid kapag naka-background ang tab
        try {
          fetch(RTDB + '/' + key + '.json', {
            method: 'PUT',
            body: JSON.stringify(Date.now())
          }).catch(function () {});
        } catch (e) {}
      };
      beat();
      setInterval(beat, 60000);
      window.addEventListener('beforeunload', function () {
        try { fetch(RTDB + '/' + key + '.json', { method: 'PUT', body: 'null', keepalive: true }); } catch (e) {}
      });
    } catch (e) { /* ignore */ }
  })();

  const IMG_W500 = 'https://image.tmdb.org/t/p/w500';

  /* ---------- Scroll progress bar + back-to-top ---------- */
  const progress = document.createElement('div');
  progress.className = 'mj-scroll-progress';
  document.body.appendChild(progress);

  const backtop = document.createElement('button');
  backtop.className = 'mj-backtop';
  backtop.title = 'Back to top';
  backtop.innerHTML = '<i class="fas fa-arrow-up"></i>';
  backtop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  document.body.appendChild(backtop);

  function onScrollUI() {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    progress.style.width = `${(window.scrollY / max) * 100}%`;
    backtop.classList.toggle('visible', window.scrollY > 550);
    const navbar = document.querySelector('.navbar');
    if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', onScrollUI, { passive: true });
  window.addEventListener('load', onScrollUI);

  /* ---------- Mobile bottom tab bar ---------- */
  const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

  function tabActive(href) {
    const file = (href.split('?')[0] || '').toLowerCase();
    if (file === 'index.html') return page === 'index.html';
    if (file === 'browse.html') {
      if (page !== 'browse.html') return false;
      const q = new URLSearchParams(location.search);
      const t = (q.get('type') || 'movie').toLowerCase();
      const want = (href.split('type=')[1] || 'movie').split('&')[0].toLowerCase();
      return t === want;
    }
    return page === file;
  }

  function buildTabbar() {
    if (document.querySelector('.mj-tabbar')) return;
    const bar = document.createElement('nav');
    bar.className = 'mj-tabbar';
    bar.innerHTML = `
      <div class="mj-tabbar-inner">
        <a class="mj-tab ${tabActive('index.html') ? 'active' : ''}" href="index.html"><i class="fas fa-house"></i>Home</a>
        <a class="mj-tab ${tabActive('browse.html?type=movie') ? 'active' : ''}" href="browse.html?type=movie"><i class="fas fa-film"></i>Movies</a>
        <a class="mj-tab ${tabActive('browse.html?type=tv') ? 'active' : ''}" href="browse.html?type=tv"><i class="fas fa-tv"></i>TV Shows</a>
        <a class="mj-tab ${tabActive('browse.html?type=anime') ? 'active' : ''}" href="browse.html?type=anime"><i class="fas fa-dragon"></i>Anime</a>
        <a class="mj-tab ${tabActive('browse.html?type=pinoytv') ? 'active' : ''}" href="browse.html?type=pinoytv"><i class="fas fa-flag"></i>Pinoy</a>
      </div>`;
    document.body.appendChild(bar);
  }

  /* ---------- Global search overlay ---------- */
  function buildSearchOverlay() {
    if (document.getElementById('search-modal')) return; // page already has one
    const modal = document.createElement('div');
    modal.id = 'search-modal';
    modal.className = 'search-modal';
    modal.innerHTML = `
      <div class="search-content">
        <button class="close" id="mj-search-close">&times;</button>
        <div class="search-input-container">
          <i class="fas fa-magnifying-glass"></i>
          <input type="text" id="search-input" placeholder="Search movies, TV shows, anime…" autocomplete="off" />
        </div>
        <div id="search-results"></div>
        <div id="no-results-message" style="display:none;">No results found. Try a different keyword.</div>
      </div>`;
    document.body.appendChild(modal);
  }

  function wireSearch() {
    const modal = document.getElementById('search-modal');
    const input = document.getElementById('search-input');
    const results = document.getElementById('search-results');
    const noRes = document.getElementById('no-results-message');
    if (!modal || !input) return;

    const openSearch = () => window.openSearchModal();
    const closeSearch = () => window.closeSearchModal();
    const closeBtn = document.getElementById('mj-search-close') || modal.querySelector('.close');
    if (closeBtn) closeBtn.onclick = closeSearch;

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeSearch();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeSearch();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) {
        e.preventDefault();
        openSearch();
      }
    });

    let t;
    input.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(runSearch, 280);
    });

    async function runSearch() {
      const q = input.value.trim();
      results.innerHTML = '';
      if (!q) {
        if (noRes) noRes.style.display = 'none';
        return;
      }
      if (noRes) noRes.style.display = 'none';
      try {
        let list = [];
        try {
          const r = await fetch(`https://movies-j-api-proxy.jayjovendinawanao2020.workers.dev/search/multi?query=${encodeURIComponent(q)}`);
          if (r.ok) list = (await r.json()).results || [];
        } catch (_) { /* fall through to direct TMDB */ }
        if (!list.length) {
          const r = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=1e86095039d9eb32cbcf1aa445b23d92&query=${encodeURIComponent(q)}`);
          list = (await r.json()).results || [];
        }
        const filtered = list
          .filter(i => i.poster_path && (i.media_type === 'movie' || i.media_type === 'tv'))
          .slice(0, 18);
        if (!filtered.length) {
          if (noRes) noRes.style.display = 'block';
          return;
        }
        filtered.forEach(item => {
          const card = document.createElement('div');
          card.className = 'movie-card loading search-result-card';
          card.onclick = () => { closeSearch(); mjGo(item); };
          card.innerHTML = `
            <img src="${IMG_W500}${item.poster_path}" alt="" loading="lazy"
                 onload="this.classList.add('loaded'); this.parentElement.classList.remove('loading');">
            <div class="card-info"><h4>${item.title || item.name || 'Untitled'}</h4></div>`;
          results.appendChild(card);
        });
      } catch (err) {
        console.error('Search error:', err);
        if (noRes) noRes.style.display = 'block';
      }
    }
  }

  /* ---------- Shared navigation helper ---------- */
  window.mjGo = function (item) {
    if (!item || !item.id) return;
    const type = item.media_type === 'person' ? 'movie'
      : (item.type || item.media_type || (item.first_air_date || item.seasons || item.season ? 'tv' : 'movie'));
    const vp = window.visualViewport;
    const isSmall = vp ? vp.width <= 900 : window.innerWidth <= 900;
    if (isSmall && typeof window.saveToWatchHistory === 'function' && item.poster_path) {
      window.saveToWatchHistory({
        id: item.id,
        title: item.title || item.name || 'Untitled',
        type,
        poster_path: item.poster_path
      });
    }
    let url = `movie.html?id=${item.id}&type=${type}`;
    if (type === 'tv') url += `&season=${item.season || 1}&episode=${item.episode || 1}`;
    window.location.href = url;
  };

  /* ---------- Splash screen ---------- */
  const splash = document.getElementById('splash-screen');
  if (splash) {
    const hideSplash = () => setTimeout(() => splash.classList.add('hidden'), 350);
    if (document.readyState === 'complete') hideSplash();
    else window.addEventListener('load', hideSplash);
    // Safety: never trap the user behind the splash
    setTimeout(() => splash.classList.add('hidden'), 4000);
  }

  /* ---------- Boot ---------- */
  function boot() {
    buildTabbar();
    buildSearchOverlay();
    wireSearch();
    initAuthIfAvailable();
    buildBraveToast();
  }

  /* ---------- Brave Browser ad-block toast (all pages) ---------- */
  function buildBraveToast() {
    if (document.getElementById('braveFloatingToast')) return; // page already has one
    if (sessionStorage.getItem('movies_j_brave_toast_dismissed') === 'true') return;
    // Skip kapag nasa Brave na ang user - hindi na kailangan ng promo
    try { if (navigator.brave && typeof navigator.brave.isBrave === 'function') return; } catch (e) {}
    const toast = document.createElement('div');
    toast.id = 'braveFloatingToast';
    toast.className = 'brave-floating-toast';
    toast.innerHTML = `
      <i class="fas fa-shield-halved brave-toast-icon"></i>
      <div class="brave-toast-text">
        <span>Tired of server pop-up ads? Use <strong>Brave Browser</strong> for ad-free streaming!</span><br>
        <a href="https://brave.com/" target="_blank" rel="noopener noreferrer" class="brave-toast-link">Get Brave Browser &rarr;</a>
      </div>
      <button class="brave-toast-close" title="Close">&times;</button>`;
    document.body.appendChild(toast);
    toast.querySelector('.brave-toast-close').addEventListener('click', () => {
      toast.style.display = 'none';
      sessionStorage.setItem('movies_j_brave_toast_dismissed', 'true');
    });
  }

  /* ---------- Auth observer bootstrap ---------- */
  async function initAuthIfAvailable() {
    if (!document.getElementById('auth-nav-container')) return;
    try {
      const mod = await import('./auth.js?v=12');
      if (typeof mod.initAuthObserver === 'function') {
        mod.initAuthObserver();
      }
    } catch (err) {
      console.warn('Auth module not loaded:', err);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Exposed for pages with inline onclick handlers (browse.html, collection.html)
  window.openSearchModal = function () {
    const m = document.getElementById('search-modal');
    if (!m) return;
    m.classList.add('active');
    document.body.classList.add('body-no-scroll');
    const i = document.getElementById('search-input');
    if (i) { i.value = ''; i.focus(); }
  };
  window.closeSearchModal = function () {
    const m = document.getElementById('search-modal');
    if (!m) return;
    m.classList.remove('active');
    document.body.classList.remove('body-no-scroll');
    const r = document.getElementById('search-results');
    const i = document.getElementById('search-input');
    if (r) r.innerHTML = '';
    if (i) i.value = '';
  };

  /* ---------- Hamburger (mobile drawer) ---------- */
  document.addEventListener('click', (e) => {
    const burger = e.target.closest('.hamburger-menu');
    if (burger) {
      burger.classList.toggle('active');
      const links = document.querySelector('.nav-links');
      if (links) links.classList.toggle('active');
      return;
    }
    // Close drawer when tapping outside
    const links = document.querySelector('.nav-links.active');
    if (links && !e.target.closest('.nav-links')) {
      links.classList.remove('active');
      const b = document.querySelector('.hamburger-menu.active');
      if (b) b.classList.remove('active');
    }
  });
})();
