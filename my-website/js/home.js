// ============================================================
// MOVIES-J PREMIUM — HOME ENGINE (js/home.js)
// Hero crossfade carousel • Top 10 rankings • Continue Watching
// with real progress • Watchlist • Search • Details modal
// Preserved globals used by other pages: BASE_URL, TMDB_DIRECT_KEY,
// IMG_URL_W500, showDetailsModal(), goToMoviePage(), saveToWatchHistory()
// ============================================================

const BASE_URL = 'https://movies-j-api-proxy.jayjovendinawanao2020.workers.dev';
const TMDB_DIRECT_KEY = '1e86095039d9eb32cbcf1aa445b23d92';
const IMG_URL_W500 = 'https://image.tmdb.org/t/p/w500';
const IMG_URL_ORIGINAL = 'https://image.tmdb.org/t/p/original';
const IMG_W780 = 'https://image.tmdb.org/t/p/w780';

let slideshowInterval;
let featuredItems = [];
let currentFeaturedIndex = 0;
let deferredPrompt;

const GENRE_MAP = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance',
  878: 'Sci-Fi', 10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
  10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News', 10764: 'Reality',
  10765: 'Sci-Fi & Fantasy', 10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics'
};
// Legacy alias (older code referenced genreMap)
const genreMap = GENRE_MAP;

/* ============================================================
   SPG / LOGIN GATE HELPERS
   Lahat ng titles na may Romance genre (10749) ay SPG:
   - Guests: makikita pero may 🔒 lock badge; kailangan mag-login
   - Logged-in: may 18+ SPG confirm pa bago ma-open
   Ginagamit din ng browse.js at movie.js (window-level para global)
   ============================================================ */
function isSpgTitle(item) {
  if (!item) return false;
  return Array.isArray(item.genre_ids)
    ? item.genre_ids.includes(10749)
    : Array.isArray(item.genres)
      ? item.genres.some(g => g.id === 10749)
      : false;
}
window.isSpgTitle = isSpgTitle;

// PH-aware title: sa TMDB, ang "name" ng mga PH teleserye ay Ingles na lokal
// (hal. "Brothers" para sa Ang Probinsyano). Ipakita ang original_name kapag
// PH show at magkaiba — iyan ang totoong title na kilala ng mga Pinoy.
window.mjPreferredTitle = function (item) {
  if (!item) return '';
  const n = item.title || item.name || '';
  const on = item.original_name || '';
  const isPh = Array.isArray(item.origin_country) && item.origin_country.includes('PH');
  return (isPh && on && on !== n) ? on : n;
};

// CSS ay JS-injected para gumana sa LAHAT ng pages (kahit movie.html na walang pwa.css)
window.mjEnsureSpgStyles = function () {
  if (document.getElementById('mj-spg-styles')) return;
  const st = document.createElement('style');
  st.id = 'mj-spg-styles';
  st.textContent = `
    .spg-lock-badge{position:absolute;top:6px;left:6px;z-index:3;background:linear-gradient(135deg,#e50914,#7a0509);color:#fff;font-size:10px;font-weight:700;padding:3px 7px;border-radius:5px;letter-spacing:.5px;box-shadow:0 2px 8px rgba(0,0,0,.55);pointer-events:none;display:inline-flex;align-items:center;gap:4px}
    .spg-lock-badge i{font-size:9px}
    #spg-confirm-overlay{position:fixed;inset:0;z-index:3000;background:rgba(5,5,8,.88);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px}
    .spg-confirm-card{background:#16161d;border:1px solid rgba(229,9,20,.35);border-radius:14px;max-width:380px;width:100%;padding:26px 22px;text-align:center;box-shadow:0 18px 60px rgba(0,0,0,.7)}
    .spg-confirm-icon{font-size:42px;margin-bottom:10px}
    .spg-confirm-card h3{margin:0 0 10px;color:#fff;font-size:1.05rem}
    .spg-confirm-card p{margin:0 0 18px;color:#b9b9c4;font-size:.88rem;line-height:1.5}
    .spg-confirm-actions{display:flex;gap:10px;justify-content:center}
    .spg-confirm-actions button{border:none;border-radius:24px;padding:10px 18px;font-weight:700;font-size:.85rem;cursor:pointer;font-family:inherit;transition:opacity .18s ease}
    .spg-confirm-actions button:hover{opacity:.85}
    #spg-cancel{background:#2a2a35;color:#ccc}
    #spg-continue{background:linear-gradient(135deg,#e50914,#b0060f);color:#fff;box-shadow:0 4px 14px rgba(229,9,20,.35)}
  `;
  document.head.appendChild(st);
};

window.mjSpgLockBadge = function () {
  window.mjEnsureSpgStyles();
  return '<span class="spg-lock-badge" title="SPG — Login required"><i class="fas fa-lock"></i> SPG</span>';
};

// Gate bago pumasok sa movie page. Returns true kung pwede na ituloy.
window.mjSpgGate = function (item) {
  if (!isSpgTitle(item)) return true;

  const loggedIn = typeof window.mjIsLoggedIn === 'function' && window.mjIsLoggedIn();
  if (!loggedIn) {
    const handled = typeof window.mjOpenAuthModal === 'function' && window.mjOpenAuthModal();
    if (!handled) {
      // Fallback kung hindi available ang auth module sa page na ito
      window.location.href = 'index.html#mj-login';
    }
    return false;
  }

  // 18+ confirm — once per session para hindi nakakainis
  try {
    if (sessionStorage.getItem('mjSpgConfirmed') === '1') return true;
  } catch (e) { /* ignore */ }

  const overlay = document.createElement('div');
  overlay.id = 'spg-confirm-overlay';
  window.mjEnsureSpgStyles();
  overlay.innerHTML = `
    <div class="spg-confirm-card">
      <div class="spg-confirm-icon">🔞</div>
      <h3>SPG / Reader Discretion Advised</h3>
      <p>Ang title na ito ay may romance/sensitive content na hindi angkop sa mga bata. Ipagpatuloy?</p>
      <div class="spg-confirm-actions">
        <button id="spg-cancel">Hindi</button>
        <button id="spg-continue">Oo, 18+ Ako — Continue</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  overlay.querySelector('#spg-cancel').onclick = () => overlay.remove();
  overlay.querySelector('#spg-continue').onclick = () => {
    try { sessionStorage.setItem('mjSpgConfirmed', '1'); } catch (e) { /* ignore */ }
    overlay.remove();
    window.__mjSpgPass = true;
    goToMoviePage(item);
  };
  return false;
};

document.addEventListener('DOMContentLoaded', async () => {
  initFirebasePresence();
  setupUniversalEventListeners();
  registerServiceWorker();

  // SPG STRICT: guest na na-redirect mula sa isang SPG title — buksan agad ang login modal
  if (window.location.hash === '#mj-login') {
    try { history.replaceState(null, '', window.location.pathname); } catch (e) {}
    // hintayin ang auth module (dynamic import — hindi agad available sa page load)
    let waited = 0;
    while (typeof window.mjIsLoggedIn !== 'function' && waited < 4000) {
      await new Promise(r => setTimeout(r, 100));
      waited += 100;
    }
    if (window.mjAuthReady) { try { await window.mjAuthReady; } catch (e) {} }
    if (typeof window.mjIsLoggedIn !== 'function' || !window.mjIsLoggedIn()) {
      if (typeof window.mjOpenAuthModal === 'function') window.mjOpenAuthModal();
    }
  }

  if (document.getElementById('hero-section')) {
    loadFeaturedMovie();
    loadContinueWatching();
    setupFilterChips();
    setupWatchlistModal();
    loadDefaultHomepageRows();
    handleWelcomeModal();
  }
});

/* ============================================================
   DEFAULT ROWS + VIEW TOGGLE
   ============================================================ */
function loadDefaultHomepageRows() {
  Promise.all([
    fetchTrending('movie').then(items => displayList(items, 'movies-list', true)),
    fetchTrending('tv').then(items => displayList(items, 'tvshows-list', true)),
    fetchTrendingAnime().then(items => displayList(items, 'anime-list', false)),
    fetchDiscover('with_origin_country=PH&sort_by=popularity.desc', 'movie').then(items => displayList(items, 'pinoy-list', false)),
    fetchDiscover('with_origin_country=PH&without_genres=16&sort_by=popularity.desc', 'tv').then(items => displayList(items, 'pinoytv-list', false))
  ]).then(() => {
    setupHomepageCarousels();
  }).catch(error => console.error('Error loading trending lists:', error));
}

function setupViewToggle() {
  const toggle = document.getElementById('view-toggle');
  if (!toggle || toggle.dataset.wired) return;
  toggle.dataset.wired = '1';
  toggle.addEventListener('click', () => {
    const isSpacious = document.body.classList.toggle('view-spacious');
    toggle.innerHTML = isSpacious
      ? '<i class="fas fa-table-cells"></i> Compact'
      : '<i class="fas fa-table-cells-large"></i> Spacious';
  });
}

/* ============================================================
   UNIVERSAL EVENT LISTENERS
   ============================================================ */
function setupUniversalEventListeners() {
  // Navbar scroll (fallback — app.js also handles this)
  window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 50);
  });

  // Hamburger
  const hamburger = document.querySelector('.hamburger-menu');
  const navLinks = document.querySelector('.nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', (e) => {
      e.stopPropagation();
      hamburger.classList.toggle('active');
      navLinks.classList.toggle('active');
    });
  }

  // Search icon
  const searchIcon = document.querySelector('.nav-actions .fa-search');
  if (searchIcon) {
    searchIcon.addEventListener('click', openSearchModal);
  }

  // Search modal
  const searchModal = document.getElementById('search-modal');
  if (searchModal) {
    const closeSearchBtn = searchModal.querySelector('.close');
    if (closeSearchBtn) closeSearchBtn.onclick = closeSearchModal;
    searchModal.addEventListener('click', (event) => {
      if (event.target === searchModal) closeSearchModal();
    });
  }
  const searchInput = document.getElementById('search-input');
  if (searchInput && !searchInput.dataset.wired) {
    searchInput.dataset.wired = '1';
    searchInput.addEventListener('input', debounceSearch);
  }

  // Details modal
  const detailsModal = document.getElementById('details-modal');
  if (detailsModal) {
    const closeDetailsBtn = document.getElementById('close-details-modal');
    if (closeDetailsBtn) closeDetailsBtn.onclick = closeDetailsModal;
    detailsModal.addEventListener('click', (event) => {
      if (event.target === detailsModal) closeDetailsModal();
    });
  }

  setupPWAInstall();
  setupViewToggle();
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js') // root para full-site scope (hindi lang /js/)
        .then(registration => console.log('✅ Service Worker registered:', registration.scope))
        .catch(error => console.error('❌ Service Worker failed:', error));
    });
  }
}

function setupPWAInstall() {
  const installBtnMobile = document.getElementById('installAppBtnMobile');

  // 7-day snooze kapag ni-dismiss ng user
  const DISMISS_KEY = 'moviesJPWADismissed';
  const dismissedAt = parseInt(localStorage.getItem(DISMISS_KEY), 10) || 0;
  if (dismissedAt && (Date.now() - dismissedAt) < 7 * 24 * 60 * 60 * 1000) return;
  if (dismissedAt) localStorage.removeItem(DISMISS_KEY);

  // Dynamic install banner — gumagamit ng .install-banner styles sa css/pwa.css
  // (gagawa lang kapag may pwa.css ang page: index / browse / collection)
  let installBanner = document.getElementById('install-banner');
  if (!installBanner && document.querySelector('link[href*="pwa.css"]')) {
    installBanner = document.createElement('div');
    installBanner.id = 'install-banner';
    installBanner.innerHTML = `
      <div class="install-banner-icon">
        <img src="images/logo-192.png" alt="Movies-J">
      </div>
      <div class="install-banner-text">
        <h3>Install Movies-J</h3>
        <p>Isang tap para buksan, offline-ready — parang totoong app.</p>
      </div>
      <div class="install-banner-actions">
        <button id="install-app-btn">Install</button>
        <button id="dismiss-install-btn" aria-label="Close">&times;</button>
      </div>`;
    document.body.appendChild(installBanner);
  }
  const installAppBtn = installBanner ? installBanner.querySelector('#install-app-btn') : null;
  const dismissBtn = installBanner ? installBanner.querySelector('#dismiss-install-btn') : null;

  if (installBanner) installBanner.classList.remove('visible');

  const showBanner = () => {
    if (!installBanner || !deferredPrompt) return;
    installBanner.classList.add('visible');
    if (installAppBtn) {
      installAppBtn.onclick = async () => {
        if (!deferredPrompt) return;
        installBanner.classList.remove('visible');
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
      };
    }
    if (dismissBtn) {
      dismissBtn.onclick = () => {
        installBanner.classList.remove('visible');
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
      };
    }
  };

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    if (installBtnMobile) {
      installBtnMobile.style.display = '';
      installBtnMobile.classList.add('visible');

      installBtnMobile.onclick = async () => {
        if (!deferredPrompt) return;
        installBtnMobile.style.display = 'none';
        installBtnMobile.classList.remove('visible');
        if (installBanner) installBanner.classList.remove('visible');
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
      };
    }

    // Hintaying muna ma-settle ang page bago lumabas ang banner
    // (desktop: auto-nakatago via pwa.css media query)
    setTimeout(showBanner, 4000);
  });
}

function handleWelcomeModal() {
  const welcomeModal = document.getElementById('welcome-modal');
  if (!welcomeModal) return;
  const closeBtn = document.getElementById('welcome-modal-close-btn');
  const startBtn = document.getElementById('welcome-start-btn');
  const hasVisited = localStorage.getItem('moviesJVisited');
  if (!hasVisited) {
    welcomeModal.classList.add('active');
    document.body.classList.add('body-no-scroll');
    const dismiss = () => {
      welcomeModal.classList.remove('active');
      document.body.classList.remove('body-no-scroll');
      localStorage.setItem('moviesJVisited', 'true');
    };
    if (closeBtn) closeBtn.addEventListener('click', dismiss);
    if (startBtn) startBtn.addEventListener('click', dismiss);
  }
}

/* ============================================================
   CONTINUE WATCHING — real progress from movies_j_progress_*
   ============================================================ */
function getRealProgress(item) {
  try {
    const p = JSON.parse(localStorage.getItem(`movies_j_progress_${item.id}`));
    if (p && typeof p.percent === 'number') return Math.max(3, Math.min(98, Math.round(p.percent)));
  } catch (e) { /* ignore */ }
  return Math.floor(Math.random() * 55) + 30; // fallback (unknown position)
}

function loadContinueWatching() {
  const continueRow = document.getElementById('continue-watching-row');
  const continueList = document.getElementById('continue-watching-list');
  if (!continueRow || !continueList) return;

  let history = [];
  try {
    history = JSON.parse(localStorage.getItem('watchHistory') || '[]');
  } catch (e) {
    history = [];
  }

  if (history.length === 0) {
    continueRow.style.display = 'none';
    return;
  }

  continueRow.style.display = 'block';
  continueList.innerHTML = '';

  history.slice(0, 10).forEach(item => {
    if (!item || !item.id) return;
    const card = document.createElement('div');
    card.className = 'movie-card loading';

    const posterSrc = item.poster_path ? `${IMG_URL_W500}${item.poster_path}` : 'images/logo-192.png';
    const isTv = (item.type === 'tv' || item.seasons || item.season || item.episode);
    const progress = getRealProgress(item);

    let typeLabel = 'Movie';
    if (isTv) {
      typeLabel = `S${item.season || 1} E${item.episode || 1} • TV Series`;
    }

    card.innerHTML = `
      ${isSpgTitle(item) ? window.mjSpgLockBadge() : ''}
      <img src="${posterSrc}" alt="${item.title || 'Movie'}" loading="lazy"
           onload="this.classList.add('loaded'); this.parentElement.classList.remove('loading');">
      <button class="remove-btn" title="Remove from history">
        <i class="fas fa-times"></i>
      </button>
      <div class="card-info">
        <h4>${item.title || 'Untitled'}</h4>
        <p>${typeLabel} • <b>${progress}%</b></p>
      </div>
      <div class="card-progress-container">
        <div class="card-progress-fill" style="width: ${progress}%;"></div>
      </div>
    `;

    const removeBtn = card.querySelector('.remove-btn');
    removeBtn.onclick = (e) => {
      e.stopPropagation();
      history = history.filter(h => h.id !== item.id);
      localStorage.setItem('watchHistory', JSON.stringify(history));
      loadContinueWatching();
    };

    card.onclick = () => goToMoviePage(item);
    continueList.appendChild(card);
  });
}

/* ============================================================
   FILTER CHIPS
   ============================================================ */
function setupFilterChips() {
  const chips = document.querySelectorAll('#filter-chips .filter-chip');
  if (!chips.length) return;

  chips.forEach(chip => {
    chip.addEventListener('click', async () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      applyHomepageFilter(chip.getAttribute('data-filter'));
    });
  });
}

async function applyHomepageFilter(filter) {
  const moviesRow = document.getElementById('movies-row');
  const tvRow = document.getElementById('tvshows-row');
  const animeRow = document.getElementById('anime-row');

  if (filter === 'all') {
    if (moviesRow) {
      moviesRow.style.display = 'block';
      moviesRow.querySelector('h2').innerHTML = 'Trending <b>Now</b>';
    }
    if (tvRow) tvRow.style.display = 'block';
    if (animeRow) animeRow.style.display = 'block';
    const pinoyRowAll = document.getElementById('pinoy-row');
    if (pinoyRowAll) pinoyRowAll.style.display = 'block';
    const pinoyTvRowAll = document.getElementById('pinoytv-row');
    if (pinoyTvRowAll) pinoyTvRowAll.style.display = 'block';
    loadDefaultHomepageRows();
    return;
  }

  const pinoyRow = document.getElementById('pinoy-row');
  if (pinoyRow) pinoyRow.style.display = 'none';
  const pinoyTvRow = document.getElementById('pinoytv-row');
  if (pinoyTvRow) pinoyTvRow.style.display = 'none';
  if (tvRow) tvRow.style.display = 'none';
  if (animeRow) animeRow.style.display = 'none';
  if (moviesRow) {
    moviesRow.style.display = 'block';
    const titleElem = moviesRow.querySelector('h2');

    if (filter === 'action') {
      if (titleElem) titleElem.innerHTML = 'Action <b>Movies & Series</b>';
      const items = await fetchDiscover('with_genres=28');
      displayList(items, 'movies-list', false);
    } else if (filter === 'anime') {
      if (titleElem) titleElem.innerHTML = 'Popular <b>Anime</b>';
      const items = await fetchTrendingAnime();
      displayList(items, 'movies-list', false);
    } else if (filter === 'kdrama') {
      if (titleElem) titleElem.innerHTML = 'Korean <b>Dramas</b>';
      const items = await fetchDiscover('with_original_language=ko&sort_by=popularity.desc', 'tv');
      displayList(items, 'movies-list', false);
    } else if (filter === 'pinoy') {
      if (titleElem) titleElem.innerHTML = '🇵🇭 Pinoy <b>Movies</b>';
      const items = await fetchDiscover('with_origin_country=PH&sort_by=popularity.desc', 'movie');
      displayList(items, 'movies-list', false);
    } else if (filter === 'top_rated') {
      if (titleElem) titleElem.innerHTML = 'Top Rated <b>All Time</b>';
      const items = await fetchTopRated();
      displayList(items, 'movies-list', false);
    }
    setupHomepageCarousels();
  }
}

async function fetchDiscover(params, type = 'movie') {
  try {
    let res = await fetch(`${BASE_URL}/discover/${type}?${params}`);
    if (!res.ok) res = await fetch(`https://api.themoviedb.org/3/discover/${type}?api_key=${TMDB_DIRECT_KEY}&${params}`);
    const data = await res.json();
    return (data.results || []).map(i => ({ ...i, media_type: type }));
  } catch (e) {
    return [];
  }
}

async function fetchTopRated() {
  try {
    let res = await fetch(`${BASE_URL}/movie/top_rated`);
    if (!res.ok) res = await fetch(`https://api.themoviedb.org/3/movie/top_rated?api_key=${TMDB_DIRECT_KEY}`);
    const data = await res.json();
    return data.results || [];
  } catch (e) {
    return [];
  }
}

/* ============================================================
   LIST RENDERING — rating badges, Top 10 numerals, skeletons
   ============================================================ */
function displayList(items, containerId, showRanking = false) {
  const container = document.getElementById(containerId);
  if (!container || !items) return;
  container.innerHTML = '';

  items.forEach((item, index) => {
    if (item && item.id && item.poster_path && (item.title || item.name)) {
      const movieCard = document.createElement('div');
      movieCard.className = 'movie-card loading';
      const releaseYear = (item.release_date || item.first_air_date || 'N/A').substring(0, 4);
      const voteAvg = (item.vote_average || 0).toFixed(1);

      let rankingHtml = '';
      if (showRanking && index < 10) {
        rankingHtml = `<span class="ranking-number">${index + 1}</span>`;
      }

      movieCard.innerHTML = `
        ${rankingHtml}
        ${isSpgTitle(item) ? window.mjSpgLockBadge() : ''}
        <span class="card-rating-badge"><i class="fas fa-star"></i> ${voteAvg}</span>
        <img src="${IMG_URL_W500}${item.poster_path}" alt="${window.mjPreferredTitle(item)}" loading="lazy"
             onload="this.classList.add('loaded'); this.parentElement.classList.remove('loading');">
        <div class="card-info">
          <h4>${window.mjPreferredTitle(item)}</h4>
          <p><b>★ ${voteAvg}</b> • ${releaseYear}</p>
        </div>
      `;

      movieCard.onclick = () => showDetailsModal(item);
      container.appendChild(movieCard);
    }
  });
}

/* ============================================================
   WATCHLIST / FAVORITES
   ============================================================ */
function getWatchlist() {
  try {
    return JSON.parse(localStorage.getItem('moviesJWatchlist') || '[]');
  } catch (e) {
    return [];
  }
}

function toggleWatchlist(item, btnElem) {
  let list = getWatchlist();
  const index = list.findIndex(i => i.id === item.id);

  if (index > -1) {
    list.splice(index, 1);
    if (btnElem) btnElem.classList.remove('bookmarked');
  } else {
    list.unshift({
      id: item.id,
      title: (window.mjPreferredTitle && window.mjPreferredTitle(item)) || item.title || item.name || 'Untitled',
      poster_path: item.poster_path || '',
      type: item.media_type || (item.first_air_date ? 'tv' : 'movie'),
      vote_average: item.vote_average || 0,
      release_date: item.release_date || item.first_air_date || ''
    });
    if (btnElem) btnElem.classList.add('bookmarked');
  }

  localStorage.setItem('moviesJWatchlist', JSON.stringify(list));
}

function setupWatchlistModal() {
  const watchlistBtn = document.getElementById('watchlist-btn');
  const modal = document.getElementById('watchlist-modal');
  const closeBtn = document.getElementById('close-watchlist-modal');

  if (!watchlistBtn || !modal) return;

  watchlistBtn.addEventListener('click', () => {
    renderWatchlistItems();
    modal.style.display = 'flex';
    document.body.classList.add('body-no-scroll');
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
      document.body.classList.remove('body-no-scroll');
    });
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
      document.body.classList.remove('body-no-scroll');
    }
  });
}

function renderWatchlistItems() {
  const container = document.getElementById('watchlist-list');
  if (!container) return;

  const list = getWatchlist();
  container.innerHTML = '';

  if (list.length === 0) {
    container.innerHTML = `<p style="color:#777; text-align:center; grid-column:1/-1; padding:30px;">Your watchlist is currently empty. Click the bookmark icon on any poster to save it here!</p>`;
    return;
  }

  list.forEach(item => {
    const div = document.createElement('div');
    div.className = 'movie-card loading';
    const poster = item.poster_path ? `${IMG_URL_W500}${item.poster_path}` : 'images/logo-192.png';

    div.innerHTML = `
      ${isSpgTitle(item) ? window.mjSpgLockBadge() : ''}
      <img src="${poster}" alt="${item.title}" loading="lazy"
           onload="this.classList.add('loaded'); this.parentElement.classList.remove('loading');">
      <button class="remove-btn" title="Remove from Watchlist">
        <i class="fas fa-trash-alt" style="font-size:12px;"></i>
      </button>
      <div class="card-info">
        <h4>${item.title}</h4>
        <p>${item.type === 'tv' ? 'TV Series' : 'Movie'}</p>
      </div>`;

    const removeBtn = div.querySelector('.remove-btn');
    if (removeBtn) {
      removeBtn.onclick = (e) => {
        e.stopPropagation();
        toggleWatchlist(item);
        renderWatchlistItems();
      };
    }

    div.onclick = () => goToMoviePage(item);
    container.appendChild(div);
  });
}

/* ============================================================
   FEATURED HERO — crossfade carousel + dot navigation
   ============================================================ */
async function loadFeaturedMovie() {
  if (!document.getElementById('hero-section')) return;
  try {
    let movieData = null, tvData = null;
    try {
      const [movieRes, tvRes] = await Promise.all([
        fetch(`${BASE_URL}/trending/movie/week`),
        fetch(`${BASE_URL}/trending/tv/week`)
      ]);
      if (movieRes.ok && tvRes.ok) {
        movieData = await movieRes.json();
        tvData = await tvRes.json();
      }
    } catch (e) {
      console.warn('Proxy featured fetch failed, using direct fallback...');
    }

    if (!movieData || !tvData) {
      const [movieRes, tvRes] = await Promise.all([
        fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_DIRECT_KEY}`),
        fetch(`https://api.themoviedb.org/3/trending/tv/week?api_key=${TMDB_DIRECT_KEY}`)
      ]);
      movieData = await movieRes.json();
      tvData = await tvRes.json();
    }

    featuredItems = [...(movieData.results || []).slice(0, 10), ...(tvData.results || []).slice(0, 10)];
    featuredItems = featuredItems.filter(item => item && item.backdrop_path);
    featuredItems.sort(() => Math.random() - 0.5);

    if (featuredItems.length > 0) {
      buildHeroDots();
      updateHeroSection();
      clearInterval(slideshowInterval);
      slideshowInterval = setInterval(updateHeroSection, 8000);
    }
  } catch (error) {
    console.error('Failed to load featured items:', error);
  }
}

function buildHeroDots() {
  const heroSection = document.getElementById('hero-section');
  if (!heroSection) return;
  let dots = heroSection.querySelector('.hero-dots');
  if (!dots) {
    dots = document.createElement('div');
    dots.className = 'hero-dots';
    heroSection.appendChild(dots);
  }
  dots.innerHTML = featuredItems.slice(0, 5).map((_, i) =>
    `<button class="hero-dot" data-index="${i}" aria-label="Featured ${i + 1}"></button>`
  ).join('');
  dots.querySelectorAll('.hero-dot').forEach(dot => {
    dot.onclick = () => {
      currentFeaturedIndex = parseInt(dot.dataset.index, 10);
      updateHeroSection();
      clearInterval(slideshowInterval);
      slideshowInterval = setInterval(updateHeroSection, 8000);
    };
  });
}

function updateHeroSection() {
  const heroSection = document.getElementById('hero-section');
  const heroTitle = document.getElementById('hero-title');
  const heroDesc = document.getElementById('hero-description');
  const watchBtn = document.getElementById('hero-watch-btn');
  const infoBtn = document.getElementById('hero-info-btn');
  if (!heroSection || !heroTitle || !heroDesc || !watchBtn || !infoBtn || featuredItems.length === 0) return;

  const dots = heroSection.querySelectorAll('.hero-dot');
  if (dots.length) {
    dots.forEach(d => d.classList.remove('active'));
    if (dots[currentFeaturedIndex % dots.length]) {
      dots[currentFeaturedIndex % dots.length].classList.add('active');
    }
  }

  // Restart content slide-in animation
  const content = heroSection.querySelector('.hero-content');
  if (content) {
    content.classList.remove('mj-animating');
    void content.offsetWidth; // force reflow
    content.classList.add('mj-animating');
  }

  currentFeaturedIndex = (currentFeaturedIndex >= featuredItems.length) ? 0 : currentFeaturedIndex;
  const item = featuredItems[currentFeaturedIndex];

  if (item && item.backdrop_path) {
    // Preload backdrop for a seamless crossfade
    const img = new Image();
    img.src = `${IMG_W780}${item.backdrop_path}`;
    img.onload = () => {
      heroSection.classList.add('mj-crossfading');
      setTimeout(() => {
        heroSection.style.backgroundImage = `url(${IMG_URL_ORIGINAL}${item.backdrop_path})`;
        requestAnimationFrame(() => heroSection.classList.remove('mj-crossfading'));
      }, 300);
    };
    img.onerror = () => {
      heroSection.style.backgroundImage = `url(${IMG_URL_ORIGINAL}${item.backdrop_path})`;
    };

    heroTitle.textContent = window.mjPreferredTitle(item) || 'Untitled';
    heroDesc.textContent = item.overview || '';
    watchBtn.onclick = () => goToMoviePage(item);
    infoBtn.onclick = () => showDetailsModal(item);
  }

  currentFeaturedIndex++;
}

/* ============================================================
   FETCH HELPERS
   ============================================================ */
async function fetchTrending(type) {
  try {
    let res = await fetch(`${BASE_URL}/trending/${type}/week`);
    if (!res.ok) {
      res = await fetch(`https://api.themoviedb.org/3/trending/${type}/week?api_key=${TMDB_DIRECT_KEY}`);
    }
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    try {
      const res = await fetch(`https://api.themoviedb.org/3/trending/${type}/week?api_key=${TMDB_DIRECT_KEY}`);
      const data = await res.json();
      return data.results || [];
    } catch (e) {
      return [];
    }
  }
}

async function fetchTrendingAnime() {
  try {
    let res = await fetch(`${BASE_URL}/discover/tv?with_keywords=210024|287501&with_genres=16&sort_by=popularity.desc`);
    if (!res.ok) {
      res = await fetch(`https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_DIRECT_KEY}&with_keywords=210024|287501&with_genres=16&sort_by=popularity.desc`);
    }
    const data = await res.json();
    return (data.results || []).map(item => ({ ...item, media_type: 'tv' }));
  } catch (error) {
    try {
      const res = await fetch(`https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_DIRECT_KEY}&with_keywords=210024|287501&with_genres=16&sort_by=popularity.desc`);
      const data = await res.json();
      return (data.results || []).map(item => ({ ...item, media_type: 'tv' }));
    } catch (e) {
      return [];
    }
  }
}

/* ============================================================
   CAROUSEL SCROLL BUTTONS
   ============================================================ */
function setupHomepageCarousels() {
  const listContainers = document.querySelectorAll('.main-container .list-container');
  listContainers.forEach(container => {
    const list = container.querySelector('.list');
    if (list && list.scrollWidth > list.clientWidth + 10) {
      if (!container.querySelector('.scroll-btn.left')) {
        const scrollBtnLeft = document.createElement('button');
        scrollBtnLeft.className = 'scroll-btn left';
        scrollBtnLeft.innerHTML = '&lt;';
        container.appendChild(scrollBtnLeft);
        scrollBtnLeft.addEventListener('click', () => {
          list.scrollBy({ left: -list.clientWidth * 0.8, behavior: 'smooth' });
        });
      }
      if (!container.querySelector('.scroll-btn.right')) {
        const scrollBtnRight = document.createElement('button');
        scrollBtnRight.className = 'scroll-btn right';
        scrollBtnRight.innerHTML = '&gt;';
        container.appendChild(scrollBtnRight);
        scrollBtnRight.addEventListener('click', () => {
          list.scrollBy({ left: list.clientWidth * 0.8, behavior: 'smooth' });
        });
      }
    }
  });
}

/* ============================================================
   NAVIGATION
   ============================================================ */
function goToMoviePage(item) {
  if (!item || !item.id) return;
  // SPG gate: Romance titles need login + 18+ confirm (tawag muli after confirm via __mjSpgPass)
  if (!window.__mjSpgPass && typeof window.mjSpgGate === 'function' && !window.mjSpgGate(item)) return;
  window.__mjSpgPass = false;
  const itemType = item.type || item.media_type || (item.first_air_date || item.seasons || item.season ? 'tv' : 'movie');

  if (typeof saveToWatchHistory === 'function') {
    saveToWatchHistory({
      id: item.id,
      title: (window.mjPreferredTitle && window.mjPreferredTitle(item)) || item.title || item.name || 'Unknown Title',
      poster_path: item.poster_path || '',
      type: itemType,
      season: item.season || 1,
      episode: item.episode || 1
    });
  }

  let targetUrl = `movie.html?id=${item.id}&type=${itemType}`;
  if (itemType === 'tv') {
    targetUrl += `&season=${item.season || 1}&episode=${item.episode || 1}`;
  }
  window.location.href = targetUrl;
}

/* ============================================================
   SEARCH
   ============================================================ */
function openSearchModal() {
  const modal = document.getElementById('search-modal');
  const searchInput = document.getElementById('search-input');
  if (modal && searchInput) {
    modal.classList.add('active');
    searchInput.value = '';
    searchInput.focus();
    document.body.classList.add('body-no-scroll');
  }
}

function closeSearchModal() {
  const modal = document.getElementById('search-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.classList.remove('body-no-scroll');
    const container = document.getElementById('search-results');
    if (container) container.innerHTML = '';
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
  }
}

let searchTimeout;
function debounceSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    searchTMDB();
  }, 300);
}
window.debounceSearch = debounceSearch;

async function searchTMDB() {
  const searchInput = document.getElementById('search-input');
  const container = document.getElementById('search-results');
  const noResultsMsg = document.getElementById('no-results-message');
  if (!searchInput || !container) return;

  const query = searchInput.value.trim();
  container.innerHTML = '';

  if (!query) {
    if (noResultsMsg) noResultsMsg.style.display = 'none';
    return;
  }

  if (noResultsMsg) noResultsMsg.style.display = 'none';

  try {
    let results = [];
    try {
      const res = await fetch(`${BASE_URL}/search/multi?query=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        results = data.results || [];
      }
    } catch (e) {
      console.warn('Proxy search failed, using direct TMDb API...');
    }

    if (results.length === 0) {
      const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_DIRECT_KEY}&query=${encodeURIComponent(query)}`);
      const data = await res.json();
      results = data.results || [];
    }

    const filtered = results
      .filter(item => item.poster_path && (item.media_type === 'movie' || item.media_type === 'tv'))
      .slice(0, 18);

    if (filtered.length === 0) {
      if (noResultsMsg) noResultsMsg.style.display = 'block';
    } else {
      filtered.forEach(item => {
        const div = document.createElement('div');
        div.className = 'movie-card search-result-card loading';
        const releaseYear = (item.release_date || item.first_air_date || '').substring(0, 4);
        const voteAvg = (item.vote_average || 0).toFixed(1);
        div.onclick = () => { closeSearchModal(); goToMoviePage(item); };
        div.innerHTML = `
          ${isSpgTitle(item) ? window.mjSpgLockBadge() : ''}
          <span class="card-rating-badge"><i class="fas fa-star"></i> ${voteAvg}</span>
          <img src="${IMG_URL_W500}${item.poster_path}" alt="${item.title || item.name || ''}" loading="lazy"
               onload="this.classList.add('loaded'); this.parentElement.classList.remove('loading');">
          <div class="card-info">
            <h4>${window.mjPreferredTitle(item) || 'Untitled'}</h4>
            <p>${releaseYear}</p>
          </div>`;
        container.appendChild(div);
      });
    }
  } catch (error) {
    console.error('Error during searchTMDB:', error);
    if (noResultsMsg) {
      noResultsMsg.textContent = 'Search error.';
      noResultsMsg.style.display = 'block';
    }
  }
}
window.searchTMDB = searchTMDB;

/* ============================================================
   DETAILS MODAL — quick view with ratings, genres, watchlist
   ============================================================ */
async function showDetailsModal(item) {
  const modal = document.getElementById('details-modal');
  if (!modal || !item) return;

  // SPG STRICT: hindi maaaring buksan ng guest kahit ang details modal —
  // login modal agad ang lalabas. Required talaga ang account bago mag-open.
  if (window.isSpgTitle && window.isSpgTitle(item)) {
    if (window.mjAuthReady) { try { await window.mjAuthReady; } catch (e) {} }
    const loggedIn = typeof window.mjIsLoggedIn === 'function' && window.mjIsLoggedIn();
    if (!loggedIn) {
      if (!(typeof window.mjOpenAuthModal === 'function' && window.mjOpenAuthModal())) {
        window.location.href = 'index.html#mj-login';
      }
      return; // HINDI bubuksan ang details modal
    }
  }

  document.body.classList.add('body-no-scroll');

  const backdrop = modal.querySelector('.modal-backdrop');
  const poster = modal.querySelector('#modal-poster');
  const title = modal.querySelector('#modal-title');
  const rating = modal.querySelector('#modal-rating');
  const release = modal.querySelector('#modal-release');
  const desc = modal.querySelector('#modal-description');
  const genres = modal.querySelector('#modal-genres');
  const watchBtn = modal.querySelector('#modal-watch-btn');
  const watchlistBtn = modal.querySelector('#modal-watchlist-btn');
  const watchlistText = modal.querySelector('#modal-watchlist-text');

  if (backdrop) backdrop.style.backgroundImage = item.backdrop_path ? `url(${IMG_W780}${item.backdrop_path})` : 'none';
  if (poster) poster.src = item.poster_path ? `${IMG_URL_W500}${item.poster_path}` : 'images/logo-192.png';
  if (title) title.textContent = window.mjPreferredTitle(item) || 'N/A';
  if (rating) rating.textContent = item.vote_average ? `★ ${item.vote_average.toFixed(1)}` : 'N/A';
  if (release) release.textContent = (item.release_date || item.first_air_date || 'N/A').substring(0, 4);
  if (desc) desc.textContent = item.overview || 'No description.';

  if (genres) {
    genres.innerHTML = '';
    const genreIds = item.genre_ids || [];
    genreIds.slice(0, 4).forEach(gid => {
      if (GENRE_MAP[gid]) {
        const tag = document.createElement('span');
        tag.className = 'genre-tag';
        tag.textContent = GENRE_MAP[gid];
        genres.appendChild(tag);
      }
    });
  }

  if (watchBtn) watchBtn.onclick = () => goToMoviePage(item); // SPG gate nasa goToMoviePage na

  if (watchlistBtn && watchlistText) {
    const updateModalWatchlistState = () => {
      const list = getWatchlist();
      const exists = list.some(w => w.id === item.id);
      if (exists) {
        watchlistBtn.classList.add('wl-active');
        watchlistText.textContent = 'Saved ✓';
      } else {
        watchlistBtn.classList.remove('wl-active');
        watchlistText.textContent = 'Watchlist';
      }
    };

    updateModalWatchlistState();

    watchlistBtn.onclick = (e) => {
      e.stopPropagation();
      toggleWatchlist(item);
      updateModalWatchlistState();
    };
  }

  modal.style.display = 'flex';
}

function closeDetailsModal() {
  const modal = document.getElementById('details-modal');
  if (modal) modal.style.display = 'none';
  document.body.classList.remove('body-no-scroll');
}

/* Legacy saveToWatchHistory fallback (watchHistory.js also defines this) */
if (typeof window.saveToWatchHistory === 'undefined') {
  window.saveToWatchHistory = function ({ title, id, type = 'movie', poster_path = '', season = 1, episode = 1 }) {
    try {
      let history = JSON.parse(localStorage.getItem('watchHistory') || '[]');
      const mediaType = (type === 'tv' || season > 1 || episode > 1) ? 'tv' : type;
      history = history.filter(item => !(String(item.id) === String(id) && item.type === mediaType));
      history.unshift({ title, id, type: mediaType, poster_path, season, episode, timestamp: Date.now() });
      if (history.length > 20) history = history.slice(0, 20);
      localStorage.setItem('watchHistory', JSON.stringify(history));
    } catch (e) { console.error('History save error:', e); }
  };
}

/* ============================================================
   FIREBASE REALTIME PRESENCE (online counter)
   ============================================================ */
function initFirebasePresence() {
  if (typeof firebase === 'undefined') return;

  const firebaseConfig = {
    apiKey: 'AIzaSyDGVvGFJt95ZHTp9Hm349ouyWemFkbtwNY',
    authDomain: 'movies-j-stream.firebaseapp.com',
    databaseURL: 'https://movies-j-stream-default-rtdb.asia-southeast1.firebasedatabase.app',
    projectId: 'movies-j-stream',
    storageBucket: 'movies-j-stream.firebasestorage.app',
    messagingSenderId: '1088305700283',
    appId: '1:1088305700283:web:1b94c85927d4b88240789e',
    measurementId: 'G-LMNWJGZ9K4'
  };

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  const db = firebase.database();
  const onlineUsersRef = db.ref('active_users');
  const connectedRef = db.ref('.info/connected');

  connectedRef.on('value', (snap) => {
    if (snap.val() === true) {
      const userRef = onlineUsersRef.push();
      userRef.onDisconnect().remove();
      userRef.set({
        online: true,
        timestamp: firebase.database.ServerValue.TIMESTAMP
      });
    }
  });

  onlineUsersRef.on('value', (snapshot) => {
    const count = snapshot.numChildren() || 1;
    const countElem = document.getElementById('online-count');
    if (countElem) {
      countElem.textContent = count;
    }
  });
}
