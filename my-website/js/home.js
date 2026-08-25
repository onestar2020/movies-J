// ✅ js/home.js (FILTER CHIPS + CONTINUE WATCHING + WATCHLIST SYSTEM + FIREBASE PRESENCE)

const BASE_URL = 'https://movies-j-api-proxy.jayjovendinawanao2020.workers.dev';
const TMDB_DIRECT_KEY = '1e86095039d9eb32cbcf1aa445b23d92';
const IMG_URL_W500 = 'https://image.tmdb.org/t/p/w500';
const IMG_URL_ORIGINAL = 'https://image.tmdb.org/t/p/original';

let slideshowInterval;
let featuredItems = [];
let currentFeaturedIndex = 0;
let deferredPrompt;

document.addEventListener("DOMContentLoaded", async () => {
    // --- 1. Initialize Real-Time Active Users Tracker ---
    initFirebasePresence();

    // --- 2. Splash Screen Logic ---
    const splashScreen = document.getElementById('splash-screen');
    if (splashScreen) {
        window.addEventListener('load', () => {
            setTimeout(() => splashScreen.classList.add('hidden'), 500);
        });
    }

    // --- 3. Setup Universal Listeners ---
    setupUniversalEventListeners();
    
    // --- 4. Register Service Worker ---
    registerServiceWorker();

    // --- 5. Homepage Specific Logic ---
    if (document.getElementById('hero-section')) {
        loadFeaturedMovie();
        loadContinueWatching();
        setupFilterChips();
        setupWatchlistModal();
        
        loadDefaultHomepageRows();
        handleWelcomeModal();
    }
});

function loadDefaultHomepageRows() {
    Promise.all([
        fetchTrending('movie').then(items => displayList(items, 'movies-list')),
        fetchTrending('tv').then(items => displayList(items, 'tvshows-list')),
        fetchTrendingAnime().then(items => displayList(items, 'anime-list'))
    ]).then(() => {
        setupHomepageCarousels();
    }).catch(error => console.error("Error loading trending lists:", error));
}

function setupUniversalEventListeners() {
    // --- Navbar Scroll ---
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            navbar.classList.toggle('scrolled', window.scrollY > 50);
        }
    });

    // --- Hamburger Menu ---
    const hamburger = document.querySelector(".hamburger-menu");
    const navLinks = document.querySelector(".nav-links");
    if (hamburger && navLinks) {
        hamburger.addEventListener("click", () => {
            hamburger.classList.toggle("active");
            navLinks.classList.toggle("active");
        });
    }

    // --- Search Icon Click ---
    const searchIcon = document.querySelector(".nav-actions .fa-search");
    if (searchIcon) {
        searchIcon.addEventListener("click", openSearchModal);
    }

    // --- Search Modal Close Button ---
    const searchModal = document.getElementById('search-modal');
    if (searchModal) {
        const closeSearchBtn = searchModal.querySelector('.close');
        if (closeSearchBtn) {
            closeSearchBtn.onclick = closeSearchModal;
        }
        searchModal.addEventListener('click', (event) => {
            if (event.target === searchModal) {
                closeSearchModal();
            }
        });
    }

    // --- Search Input Listener ---
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', debounceSearch);
    }

    // --- Details Modal ---
    const detailsModal = document.getElementById('details-modal');
    if (detailsModal) {
        const closeDetailsBtn = document.getElementById('close-details-modal');
        if (closeDetailsBtn) {
            closeDetailsBtn.onclick = closeDetailsModal;
        }
        detailsModal.addEventListener('click', (event) => {
            if (event.target === detailsModal) closeDetailsModal();
        });
    }

    // --- Donation Modal ---
    const supportModal = document.getElementById("supportModal");
    const supportBtn = document.getElementById("supportBtn");
    if (supportModal && supportBtn) {
        const closeBtnSupport = supportModal.querySelector(".close-btn");
        supportBtn.onclick = function(event) {
            event.preventDefault();
            supportModal.style.display = "block";
        };
        if (closeBtnSupport) {
            closeBtnSupport.onclick = function() {
                supportModal.style.display = "none";
            };
        }
        window.addEventListener("click", function(event) {
            if (event.target === supportModal) {
                supportModal.style.display = "none";
            }
        });
    }

    // --- PWA Setup ---
    setupPWAInstall();
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('js/sw.js')
                .then(registration => console.log('✅ Service Worker registered:', registration.scope))
                .catch(error => console.error('❌ Service Worker failed:', error));
        });
    }
}

function setupPWAInstall() {
    const installBanner = document.getElementById('install-banner');
    const installBtnMobile = document.getElementById('installAppBtnMobile');

    if (installBtnMobile) {
        installBtnMobile.style.display = 'none';
        installBtnMobile.classList.remove('visible');
    }
    if (installBanner) installBanner.classList.remove('visible');

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
    });
}

function handleWelcomeModal() {
    const welcomeModal = document.getElementById('welcome-modal');
    if (!welcomeModal) return;
    const closeBtn = document.getElementById('welcome-modal-close-btn');
    const hasVisited = localStorage.getItem('moviesJVisited');
    if (!hasVisited && closeBtn) {
        welcomeModal.classList.add('active');
        document.body.classList.add('body-no-scroll');
        closeBtn.addEventListener('click', () => {
            welcomeModal.classList.remove('active');
            document.body.classList.remove('body-no-scroll');
            localStorage.setItem('moviesJVisited', 'true');
        });
    }
}

// ================= CONTINUE WATCHING =================
function loadContinueWatching() {
    const continueRow = document.getElementById('continue-watching-row');
    const continueList = document.getElementById('continue-watching-list');
    if (!continueRow || !continueList) return;

    let history = [];
    try {
        history = JSON.parse(localStorage.getItem("watchHistory") || "[]");
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
        card.className = 'movie-card';
        const posterSrc = item.poster_path ? `${IMG_URL_W500}${item.poster_path}` : 'images/logo-192.png';

        card.innerHTML = `
            <img src="${posterSrc}" alt="${item.title || 'Movie'}" loading="lazy">
            <div class="movie-card-details">
                <h3>${item.title || 'Untitled'}</h3>
                <div class="card-meta">
                    <span>${item.type === 'tv' ? 'TV Series' : 'Movie'}</span>
                </div>
                <div class="card-buttons">
                    <button class="play-btn" title="Resume"><i class="fas fa-play"></i></button>
                </div>
            </div>`;

        card.onclick = () => goToMoviePage(item);
        continueList.appendChild(card);
    });
}

// ================= QUICK FILTER CHIPS =================
function setupFilterChips() {
    const chips = document.querySelectorAll('#filter-chips .filter-chip');
    if (!chips.length) return;

    chips.forEach(chip => {
        chip.addEventListener('click', async () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');

            const filter = chip.getAttribute('data-filter');
            applyHomepageFilter(filter);
        });
    });
}

async function applyHomepageFilter(filter) {
    const moviesRow = document.getElementById('movies-row');
    const tvRow = document.getElementById('tvshows-row');
    const animeRow = document.getElementById('anime-row');

    if (filter === 'all') {
        if (moviesRow) { moviesRow.style.display = 'block'; moviesRow.querySelector('h2').textContent = "Trending Movies"; }
        if (tvRow) tvRow.style.display = 'block';
        if (animeRow) animeRow.style.display = 'block';
        loadDefaultHomepageRows();
        return;
    }

    // Hide extra rows when filtered
    if (tvRow) tvRow.style.display = 'none';
    if (animeRow) animeRow.style.display = 'none';
    if (moviesRow) {
        moviesRow.style.display = 'block';
        const titleElem = moviesRow.querySelector('h2');

        if (filter === 'action') {
            if (titleElem) titleElem.textContent = "🔥 Action Movies & Series";
            const items = await fetchDiscover('with_genres=28');
            displayList(items, 'movies-list');
        } else if (filter === 'anime') {
            if (titleElem) titleElem.textContent = "🐉 Popular Anime";
            const items = await fetchTrendingAnime();
            displayList(items, 'movies-list');
        } else if (filter === 'kdrama') {
            if (titleElem) titleElem.textContent = "💖 Korean Dramas";
            const items = await fetchDiscover('with_original_language=ko&sort_by=popularity.desc', 'tv');
            displayList(items, 'movies-list');
        } else if (filter === 'top_rated') {
            if (titleElem) titleElem.textContent = "⭐ Top Rated All Time";
            const items = await fetchTopRated();
            displayList(items, 'movies-list');
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

// ================= WATCHLIST / FAVORITES SYSTEM =================
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
            title: item.title || item.name || 'Untitled',
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
        div.className = 'movie-card';
        const poster = item.poster_path ? `${IMG_URL_W500}${item.poster_path}` : 'images/logo-192.png';

        div.innerHTML = `
            <img src="${poster}" alt="${item.title}" loading="lazy">
            <div class="movie-card-details">
                <h3>${item.title}</h3>
                <div class="card-buttons">
                    <button class="play-btn" title="Watch"><i class="fas fa-play"></i></button>
                    <button class="watchlist-btn bookmarked" title="Remove"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>`;

        const play = div.querySelector('.play-btn');
        const remove = div.querySelector('.watchlist-btn');

        if (play) play.onclick = (e) => { e.stopPropagation(); goToMoviePage(item); };
        if (remove) remove.onclick = (e) => {
            e.stopPropagation();
            toggleWatchlist(item);
            renderWatchlistItems();
        };

        div.onclick = () => goToMoviePage(item);
        container.appendChild(div);
    });
}

// --- FEATURED HERO SECTION ---
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
            console.warn("Proxy featured fetch failed, using direct fallback...");
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
            updateHeroSection();
            clearInterval(slideshowInterval);
            slideshowInterval = setInterval(updateHeroSection, 7000);
        }
    } catch (error) {
        console.error("Failed to load featured items:", error);
    }
}

function updateHeroSection() {
    const heroSection = document.getElementById('hero-section');
    const heroTitle = document.getElementById('hero-title');
    const heroDesc = document.getElementById('hero-description');
    const watchBtn = document.getElementById('hero-watch-btn');
    const infoBtn = document.getElementById('hero-info-btn');
    if (!heroSection || !heroTitle || !heroDesc || !watchBtn || !infoBtn || featuredItems.length === 0) return;

    currentFeaturedIndex = (currentFeaturedIndex >= featuredItems.length) ? 0 : currentFeaturedIndex;
    const item = featuredItems[currentFeaturedIndex];

    if (item && item.backdrop_path) {
        heroSection.style.backgroundImage = `url(${IMG_URL_ORIGINAL}${item.backdrop_path})`;
        heroTitle.textContent = item.title || item.name || "Untitled";
        heroDesc.textContent = item.overview || "";
        watchBtn.onclick = () => goToMoviePage(item);
        infoBtn.onclick = () => showDetailsModal(item);
    }

    currentFeaturedIndex++;
}

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

function displayList(items, containerId) {
    const container = document.getElementById(containerId);
    if (!container || !items) return;
    container.innerHTML = '';

    const watchlist = getWatchlist();

    items.forEach(item => {
        if (item && item.id && item.poster_path && (item.title || item.name)) {
            const movieCard = document.createElement('div');
            movieCard.className = 'movie-card';
            const releaseYear = (item.release_date || item.first_air_date || 'N/A').substring(0, 4);
            const voteAvg = (item.vote_average || 0).toFixed(1);
            const isBookmarked = watchlist.some(w => w.id === item.id);

            movieCard.innerHTML = `
                <img src="${IMG_URL_W500}${item.poster_path}" alt="${item.title || item.name}" loading="lazy">
                <div class="movie-card-details">
                    <h3>${item.title || item.name}</h3>
                    <div class="card-meta">
                        <span>⭐ ${voteAvg}</span>
                        <span>${releaseYear}</span>
                    </div>
                    <div class="card-buttons">
                        <button class="play-btn" title="Watch Now"><i class="fas fa-play"></i></button>
                        <button class="watchlist-btn ${isBookmarked ? 'bookmarked' : ''}" title="Add to Watchlist"><i class="fas fa-bookmark"></i></button>
                        <button class="info-btn" title="More Info"><i class="fas fa-info-circle"></i></button>
                    </div>
                </div>`;

            const playBtn = movieCard.querySelector('.play-btn');
            const infoBtn = movieCard.querySelector('.info-btn');
            const markBtn = movieCard.querySelector('.watchlist-btn');

            if (playBtn) playBtn.onclick = (e) => { e.stopPropagation(); goToMoviePage(item); };
            if (infoBtn) infoBtn.onclick = (e) => { e.stopPropagation(); showDetailsModal(item); };
            if (markBtn) markBtn.onclick = (e) => { e.stopPropagation(); toggleWatchlist(item, markBtn); };
            movieCard.onclick = () => showDetailsModal(item);

            container.appendChild(movieCard);
        }
    });
}

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

function goToMoviePage(item) {
    if (!item || !item.id) return;
    const itemType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
    
    if (typeof saveToWatchHistory === 'function') {
        saveToWatchHistory({
            id: item.id,
            title: item.title || item.name || "Unknown Title",
            poster_path: item.poster_path || "",
            type: itemType
        });
    }
    
    window.location.href = `movie.html?id=${item.id}&type=${itemType}`;
}

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

// --- SEARCH FUNCTIONS ---
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
            console.warn("Proxy search failed, using direct TMDb API...");
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
                div.className = 'movie-card search-result-card';
                div.onclick = () => { closeSearchModal(); goToMoviePage(item); };
                div.innerHTML = `
                    <img src="${IMG_URL_W500}${item.poster_path}" alt="${item.title || item.name || ''}" loading="lazy">
                    <p class="movie-title">${item.title || item.name || 'Untitled'}</p>`;
                container.appendChild(div);
            });
        }
    } catch (error) {
        console.error("Error during searchTMDB:", error);
        if (noResultsMsg) {
            noResultsMsg.textContent = "Search error.";
            noResultsMsg.style.display = 'block';
        }
    }
}
window.searchTMDB = searchTMDB;

const genreMap = { 28:"Action", 12:"Adventure", 16:"Animation", 35:"Comedy", 80:"Crime", 99:"Documentary", 18:"Drama", 10751:"Family", 14:"Fantasy", 36:"History", 27:"Horror", 10402:"Music", 9648:"Mystery", 10749:"Romance", 878:"Science Fiction", 10770:"TV Movie", 53:"Thriller", 10752:"War", 37:"Western", 10759: "Action & Adventure", 10762: "Kids", 10763: "News", 10764: "Reality", 10765: "Sci-Fi & Fantasy", 10766: "Soap", 10767: "Talk", 10768: "War & Politics"};

function showDetailsModal(item) {
    const modal = document.getElementById('details-modal');
    if (!modal || !item) return;

    document.body.classList.add('body-no-scroll');

    const backdrop = modal.querySelector('.modal-backdrop');
    const poster = modal.querySelector('#modal-poster');
    const title = modal.querySelector('#modal-title');
    const rating = modal.querySelector('#modal-rating');
    const release = modal.querySelector('#modal-release');
    const desc = modal.querySelector('#modal-description');
    const genres = modal.querySelector('#modal-genres');
    const watchBtn = modal.querySelector('#modal-watch-btn');

    if (backdrop) backdrop.style.backgroundImage = item.backdrop_path ? `url(${IMG_URL_ORIGINAL}${item.backdrop_path})` : 'none';
    if (poster) poster.src = item.poster_path ? `${IMG_URL_W500}${item.poster_path}` : 'images/logo-192.png';
    if (title) title.textContent = item.title || item.name || 'N/A';
    if (rating) rating.textContent = item.vote_average ? `⭐ ${item.vote_average.toFixed(1)}` : 'N/A';
    if (release) release.textContent = (item.release_date || item.first_air_date || 'N/A').substring(0, 4);
    if (desc) desc.textContent = item.overview || 'No description.';
    
    if (genres) {
        genres.innerHTML = '';
        const genreIds = item.genre_ids || [];
        genreIds.slice(0, 4).forEach(gid => {
            if (genreMap[gid]) {
                const tag = document.createElement('span');
                tag.className = 'genre-tag';
                tag.textContent = genreMap[gid];
                genres.appendChild(tag);
            }
        });
    }

    if (watchBtn) watchBtn.onclick = () => goToMoviePage(item);

    modal.style.display = 'flex';
}

function closeDetailsModal() {
    const modal = document.getElementById('details-modal');
    if (modal) modal.style.display = 'none';
    document.body.classList.remove('body-no-scroll');
}

if (typeof window.saveToWatchHistory === 'undefined') {
    window.saveToWatchHistory = function({ title, id, type = 'movie', poster_path = '' }) {
        try {
            let history = JSON.parse(localStorage.getItem("watchHistory") || "[]");
            history = history.filter(item => !(item.id === id && item.type === type));
            history.unshift({ title, id, type, poster_path, timestamp: Date.now() });
            if (history.length > 20) history = history.slice(0, 20);
            localStorage.setItem("watchHistory", JSON.stringify(history));
        } catch (e) { console.error("History save error:", e); }
    };
}

// ================= OFFICIAL FIREBASE REALTIME PRESENCE SYSTEM =================
function initFirebasePresence() {
    if (typeof firebase === 'undefined') return;

    const firebaseConfig = {
        apiKey: "AIzaSyChLRuEGAVTO3Y-_lGqKYF9YUCVx5i5Feo",
        authDomain: "movies-j-stream.firebaseapp.com",
        databaseURL: "https://movies-j-stream-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "movies-j-stream",
        storageBucket: "movies-j-stream.firebasestorage.app",
        messagingSenderId: "1088305700283",
        appId: "1:1088305700283:web:1b94c89927d4b88240789e",
        measurementId: "G-LMNWJGZ9K4"
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
        const countElem = document.getElementById("online-count");
        if (countElem) {
            countElem.textContent = count;
        }
    });
}