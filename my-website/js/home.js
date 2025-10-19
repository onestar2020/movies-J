// ✅ js/home.js (MAJOR CLEANUP & FIX VERSION)

const BASE_URL = 'https://movies-j-api-proxy.jayjovendinawanao2020.workers.dev';
const IMG_URL_W500 = 'https://image.tmdb.org/t/p/w500';
const IMG_URL_ORIGINAL = 'https://image.tmdb.org/t/p/original';

let slideshowInterval;
let featuredItems = [];
let currentFeaturedIndex = 0;
let deferredPrompt; // Single global declaration

document.addEventListener("DOMContentLoaded", async () => {
    console.log("DOM fully loaded and parsed.");

    // --- Splash Screen Logic ---
    const splashScreen = document.getElementById('splash-screen');
    if (splashScreen) {
        window.addEventListener('load', () => { // Wait for all resources (images)
            console.log("Window loaded, hiding splash screen.");
            setTimeout(() => splashScreen.classList.add('hidden'), 500);
        });
    } else {
        console.warn("Splash screen element not found!");
    }

    // --- Setup ALL Event Listeners HERE ---
    setupUniversalEventListeners(); // Includes navbar scroll, modals, hamburger, PWA
    
    // --- Register Service Worker ---
    registerServiceWorker(); // Call after DOM is ready

    // --- Homepage Specific Logic ---
    if (document.getElementById('hero-section')) {
        console.log("Hero section found, loading homepage content...");
        loadFeaturedMovie(); // Start loading featured movies
        // Load trending lists concurrently
        Promise.all([
            fetchTrending('movie').then(items => displayList(items, 'movies-list')),
            fetchTrending('tv').then(items => displayList(items, 'tvshows-list')),
            fetchTrendingAnime().then(items => displayList(items, 'anime-list'))
        ]).then(() => {
            console.log("Trending lists loaded.");
            setupHomepageCarousels(); // Setup carousels after lists are displayed
        }).catch(error => console.error("Error loading trending lists:", error));
        handleWelcomeModal(); // Show welcome modal if needed
    } else {
        console.log("Not on homepage (no hero-section found).");
    }
}); // --- END OF DOMContentLoaded ---


function setupUniversalEventListeners() {
    console.log("Setting up universal listeners...");

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
            console.log("Hamburger clicked!");
            hamburger.classList.toggle("active");
            navLinks.classList.toggle("active");
        });
    } else {
        console.error("Hamburger menu or nav links not found!");
    }

    // --- Search Icon Click ---
    const searchIcon = document.querySelector(".nav-actions .fa-search");
    if (searchIcon) {
        searchIcon.addEventListener("click", openSearchModal); // Attach listener
    } else {
        console.warn("Search icon not found.");
    }

    // --- Search Modal Close Button ---
    const searchModal = document.getElementById('search-modal');
    if (searchModal) {
        const closeSearchBtn = searchModal.querySelector('.close');
        if (closeSearchBtn) {
            closeSearchBtn.onclick = closeSearchModal; // Use onclick or addEventListener
        }
         // Optional: Close on overlay click
         searchModal.addEventListener('click', (event) => {
             if (event.target === searchModal) {
                 closeSearchModal();
             }
         });
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
    if (supportModal && supportBtn) { // Check both exist
        const closeBtnSupport = supportModal.querySelector(".close-btn");
        supportBtn.onclick = function(event) {
            event.preventDefault();
            supportModal.style.display = "block";
        }
        if (closeBtnSupport) {
            closeBtnSupport.onclick = function() {
                supportModal.style.display = "none";
            }
        }
        window.addEventListener("click", function(event) { // Close on overlay click
            if (event.target == supportModal) {
                supportModal.style.display = "none";
            }
        });
    } else {
         console.warn("Support button or modal not found.");
    }

    // --- PWA Install Setup ---
    setupPWAInstall(); // Run PWA setup
}


function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => { // Use load event for SW registration
            // *** FIXED PATH ***
            navigator.serviceWorker.register('js/sw.js') 
                .then(registration => console.log('✅ Service Worker registered successfully: Scope=', registration.scope))
                .catch(error => console.error('❌ Service Worker registration failed:', error));
        });
    } else {
        console.log("Service Worker not supported.");
    }
}


function setupPWAInstall() {
    console.log("PWA Install Setup: Running...");
    const installBanner = document.getElementById('install-banner');
    const installBtnBanner = document.getElementById('install-app-btn');
    const dismissBtnBanner = document.getElementById('dismiss-install-btn');
    const installBtnMobile = document.getElementById('installAppBtnMobile');

    // Hide elements initially
    if (installBtnMobile) {
        installBtnMobile.style.display = 'none'; // Ensure it's hidden via style
        installBtnMobile.classList.remove('visible'); // Ensure class is removed
    } else { console.warn("PWA Install Setup: Mobile install button not found."); }
    if (installBanner) { installBanner.classList.remove('visible'); }
    else { console.warn("PWA Install Setup: Install banner element not found."); }

    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('PWA Install Setup: beforeinstallprompt event fired!');
        e.preventDefault();
        deferredPrompt = e;

        // Show Mobile Button
        if (installBtnMobile) {
            console.log('PWA Install Setup: Showing mobile install button.');
            installBtnMobile.style.display = ''; // Remove inline style to let CSS handle it
            installBtnMobile.classList.add('visible'); // Add class to trigger CSS display

            // Add click listener
            installBtnMobile.onclick = null; // Clear previous
            installBtnMobile.onclick = async () => {
                console.log('PWA Install Setup: Mobile install button clicked.');
                if (!deferredPrompt) { console.warn('PWA Install Setup: deferredPrompt is null.'); return; }
                installBtnMobile.style.display = 'none'; // Hide immediately
                installBtnMobile.classList.remove('visible');
                if(installBanner) installBanner.classList.remove('visible');
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`PWA Install Setup: User response: ${outcome}`);
                deferredPrompt = null;
            };
        } else { console.warn("PWA Install Setup: Mobile button not found when event fired."); }
    });

    // Add Banner Button Listener
    if (installBtnBanner) {
        installBtnBanner.addEventListener('click', async () => { /* ... (keep existing banner logic) ... */ });
    }
    // Add Dismiss Button Listener
    if (dismissBtnBanner && installBanner) {
        dismissBtnBanner.addEventListener('click', () => { /* ... (keep existing dismiss logic) ... */ });
    }
    // App Installed Listener
    window.addEventListener('appinstalled', () => { /* ... (keep existing appinstalled logic) ... */ });
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

// --- HOMEPAGE SPECIFIC FUNCTIONS ---
async function loadFeaturedMovie() {
    if (!document.getElementById('hero-section')) return;
    console.log("Loading featured movie...");
    try {
        // Fetch concurrently
        const [movieRes, tvRes] = await Promise.all([
            fetch(`${BASE_URL}/trending/movie/week`),
            fetch(`${BASE_URL}/trending/tv/week`)
        ]);
        if (!movieRes.ok || !tvRes.ok) throw new Error('Failed to fetch trending data');
        const [movieData, tvData] = await Promise.all([movieRes.json(), tvRes.json()]);

        featuredItems = [...(movieData.results || []).slice(0, 10), ...(tvData.results || []).slice(0, 10)];
        featuredItems = featuredItems.filter(item => item && item.backdrop_path); // Ensure valid items
        featuredItems.sort(() => Math.random() - 0.5); // Shuffle

        if (featuredItems.length > 0) {
            updateHeroSection(); // Initial update
            clearInterval(slideshowInterval); // Clear existing interval if any
            slideshowInterval = setInterval(updateHeroSection, 7000); // Start slideshow (7 seconds)
        } else {
            console.warn("No valid featured items found to display.");
             // Optionally display a default state for the hero section
             const heroTitle = document.getElementById('hero-title');
             if(heroTitle) heroTitle.textContent = "No featured content available.";
        }
    } catch (error) {
        console.error("Failed to load featured items:", error);
        const heroTitle = document.getElementById('hero-title');
        if(heroTitle) heroTitle.textContent = "Error loading content.";
    }
}

function updateHeroSection() {
    const heroSection = document.getElementById('hero-section');
    const heroTitle = document.getElementById('hero-title');
    const heroDesc = document.getElementById('hero-description');
    const watchBtn = document.getElementById('hero-watch-btn');
    const infoBtn = document.getElementById('hero-info-btn');
    if (!heroSection || !heroTitle || !heroDesc || !watchBtn || !infoBtn) return;

    if (featuredItems.length === 0) return; // Don't proceed if no items

    // Ensure index loops correctly
    currentFeaturedIndex = (currentFeaturedIndex >= featuredItems.length) ? 0 : currentFeaturedIndex;

    const item = featuredItems[currentFeaturedIndex];

    if (item && item.backdrop_path) {
        heroSection.style.backgroundImage = `url(${IMG_URL_ORIGINAL}${item.backdrop_path})`;
        heroTitle.textContent = item.title || item.name || "Untitled";
        heroDesc.textContent = item.overview || "";
        // Use addEventListener for buttons if onclick causes issues, but onclick should be fine here
        watchBtn.onclick = () => goToMoviePage(item);
        infoBtn.onclick = () => showDetailsModal(item);
         console.log("Hero updated with:", item.title || item.name);
    } else {
        console.warn(`Skipping invalid item at index ${currentFeaturedIndex}:`, item);
        // Skip to the next item immediately if current one is bad
        currentFeaturedIndex++;
        updateHeroSection(); // Try updating again
        return; // Stop this execution
    }

    currentFeaturedIndex++; // Increment for the *next* interval
}


async function fetchTrending(type) {
    console.log(`Fetching trending ${type}...`);
    try {
        const res = await fetch(`${BASE_URL}/trending/${type}/week`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        return data.results || [];
    } catch (error) {
        console.error(`Failed to fetch trending ${type}:`, error);
        return [];
    }
}

async function fetchTrendingAnime() {
    console.log("Fetching trending anime...");
    try {
        const res = await fetch(`${BASE_URL}/discover/tv?with_keywords=210024|287501&with_genres=16&sort_by=popularity.desc`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        return (data.results || []).map(item => ({ ...item, media_type: 'tv' }));
    } catch (error) {
        console.error("Failed to fetch trending anime:", error);
        return [];
    }
}


function displayList(items, containerId) {
    const container = document.getElementById(containerId);
    if (!container) { console.error(`Container #${containerId} not found.`); return; }
    container.innerHTML = ''; // Clear existing

    if (!items || items.length === 0) {
        // container.innerHTML = "<p>No items to display.</p>"; // Optional message
        return;
    }

    items.forEach(item => {
        // Added more checks for item validity
        if (item && item.id && item.poster_path && (item.title || item.name)) {
            const movieCard = document.createElement('div');
            movieCard.className = 'movie-card';
            const releaseYear = (item.release_date || item.first_air_date || 'N/A').substring(0, 4);
            const voteAvg = (item.vote_average || 0).toFixed(1);

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
                        <button class="info-btn" title="More Info"><i class="fas fa-info-circle"></i></button>
                    </div>
                </div>`;

            const playBtn = movieCard.querySelector('.play-btn');
            const infoBtn = movieCard.querySelector('.info-btn');
            if (playBtn) playBtn.onclick = (e) => { e.stopPropagation(); goToMoviePage(item); };
            if (infoBtn) infoBtn.onclick = (e) => { e.stopPropagation(); showDetailsModal(item); };
            movieCard.onclick = () => showDetailsModal(item); // Click on card shows details

            container.appendChild(movieCard);
        }
    });
}


function setupHomepageCarousels() {
    const listContainers = document.querySelectorAll('.main-container .list-container');
    listContainers.forEach(container => {
        const list = container.querySelector('.list');
        if (list && list.scrollWidth > list.clientWidth + 10) { // Add a small buffer
            // Add left scroll button
            if (!container.querySelector('.scroll-btn.left')) {
                const scrollBtnLeft = document.createElement('button');
                scrollBtnLeft.className = 'scroll-btn left';
                scrollBtnLeft.innerHTML = '&lt;';
                scrollBtnLeft.setAttribute('aria-label', 'Scroll left');
                container.appendChild(scrollBtnLeft);
                scrollBtnLeft.addEventListener('click', () => {
                    list.scrollBy({ left: -list.clientWidth * 0.8, behavior: 'smooth' });
                });
            }
             // Add right scroll button
            if (!container.querySelector('.scroll-btn.right')) {
                const scrollBtnRight = document.createElement('button');
                scrollBtnRight.className = 'scroll-btn right';
                scrollBtnRight.innerHTML = '&gt;';
                scrollBtnRight.setAttribute('aria-label', 'Scroll right');
                container.appendChild(scrollBtnRight);
                scrollBtnRight.addEventListener('click', () => {
                     list.scrollBy({ left: list.clientWidth * 0.8, behavior: 'smooth' });
                });
            }
        } else {
             // Remove buttons if list is not scrollable (optional)
             const leftBtn = container.querySelector('.scroll-btn.left');
             const rightBtn = container.querySelector('.scroll-btn.right');
             if(leftBtn) leftBtn.remove();
             if(rightBtn) rightBtn.remove();
        }
    });
}


// --- UNIVERSAL FUNCTIONS ---
function goToMoviePage(item) {
    if (!item || !item.id) { console.error("goToMoviePage: Invalid item data."); return; }
    const type = item.media_type || (item.first_air_date ? 'tv' : 'movie');
    
    // Ensure saveToWatchHistory is defined before calling
    if (typeof saveToWatchHistory === 'function') {
        saveToWatchHistory({
            id: item.id,
            title: item.title || item.name || "Unknown Title",
            poster_path: item.poster_path || "",
            type: type
        });
    } else {
        console.warn("saveToWatchHistory function not found when trying to navigate.");
    }
    
    window.location.href = `movie.html?id=${item.id}&type=${type}`;
}

function openSearchModal() {
    const modal = document.getElementById('search-modal');
    const searchInput = document.getElementById('search-input');
    if (modal && searchInput) {
        modal.classList.add('active');
        searchInput.value = ''; // Clear input
        searchInput.focus();
        document.body.classList.add('body-no-scroll');
    } else { console.error("Search modal elements not found."); }
}

function closeSearchModal() {
    const modal = document.getElementById('search-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.classList.remove('body-no-scroll');
        const container = document.getElementById('search-results');
        if (container) container.innerHTML = ''; // Clear results
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.value = ''; // Clear input
    }
}


// Debounce search function to avoid too many API calls
let searchTimeout;
function debounceSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        searchTMDB();
    }, 300); // Wait 300ms after user stops typing
}
// Make sure the input calls debounceSearch: oninput="debounceSearch()" in HTML

async function searchTMDB() {
    const searchInput = document.getElementById('search-input');
    const container = document.getElementById('search-results');
    const noResultsMsg = document.getElementById('no-results-message');
    if (!searchInput || !container) return;

    const query = searchInput.value.trim();
    container.innerHTML = ''; // Clear previous

    if (!query) {
        if(noResultsMsg) noResultsMsg.style.display = 'none';
        return;
    }

    if (noResultsMsg) noResultsMsg.style.display = 'none'; // Hide while searching

    try {
        const res = await fetch(`${BASE_URL}/search/multi?query=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error(`Search fetch failed: ${res.status}`);
        const data = await res.json();
        const results = (data.results || [])
            .filter(item => item.poster_path && (item.media_type === 'movie' || item.media_type === 'tv'))
            .slice(0, 18); // Limit results shown

        if (results.length === 0) {
            if (noResultsMsg) noResultsMsg.style.display = 'block';
        } else {
            results.forEach(item => {
                const div = document.createElement('div');
                div.className = 'movie-card search-result-card'; // Add specific class maybe
                // div.style.width = '150px'; // Better to control size via CSS
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
        genres.innerHTML = ''; // Clear previous
        const genreIds = item.genre_ids || [];
        genreIds.slice(0, 4).forEach(id => {
            if (genreMap[id]) {
                const tag = document.createElement('span');
                tag.className = 'genre-tag';
                tag.textContent = genreMap[id];
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

// Define saveToWatchHistory globally IF NOT DEFINED BY watchHistory.js
// This ensures it's available for goToMoviePage
if (typeof window.saveToWatchHistory === 'undefined') {
    window.saveToWatchHistory = function({ title, id, type = 'movie', poster_path = '' }) {
        console.warn("Using fallback saveToWatchHistory in home.js");
        try {
            let history = JSON.parse(localStorage.getItem("watchHistory") || "[]");
            history = history.filter(item => !(item.id === id && item.type === type));
            history.unshift({ title, id, type, poster_path, timestamp: Date.now() });
            if (history.length > 20) history = history.slice(0, 20);
            localStorage.setItem("watchHistory", JSON.stringify(history));
        } catch (e) { console.error("Fallback saveToWatchHistory error:", e); }
    }
}