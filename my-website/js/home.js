// ✅ js/home.js (FINAL: With Slideshow, Modern Search, and Hamburger Menu)

const API_KEY = '22d74813ded3fecbe3ef632b4814ae3a';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL_W500 = 'https://image.tmdb.org/t/p/w500';
const IMG_URL_ORIGINAL = 'https://image.tmdb.org/t/p/original';

// --- Variables para sa slideshow ---
let slideshowInterval;
let featuredItems = [];
let currentFeaturedIndex = 0;

// --- MAIN FUNCTION PAGKA-LOAD NG PAGE ---
document.addEventListener("DOMContentLoaded", async () => {

    // Safety check para ang homepage-specific code ay sa index.html lang gagana.
    if (document.getElementById('hero-section')) {
        loadFeaturedMovie();
        fetchTrending('movie').then(items => displayList(items, 'movies-list'));
        fetchTrending('tv').then(items => displayList(items, 'tvshows-list'));
        fetchTrendingAnime().then(items => displayList(items, 'anime-list'));
    }
    
    // Itong mga functions na ito ay para sa lahat ng page
    setupUniversalEventListeners();
});


// BAGO: Function para sa lahat ng event listeners na kailangan sa bawat page
function setupUniversalEventListeners() {
    // Scroll effect para sa navbar
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
    });

    // Event listener para sa Details Modal
    const detailsModal = document.getElementById('details-modal');
    if(detailsModal) {
        document.getElementById('close-details-modal').onclick = closeDetailsModal;
        detailsModal.addEventListener('click', (event) => {
            if (event.target === detailsModal) {
                closeDetailsModal();
            }
        });
    }

    // BAGO: Logic para sa Hamburger Menu
    const hamburger = document.querySelector('.hamburger-menu');
    const navLinks = document.querySelector('.nav-links');
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }
}


// --- HOMEPAGE-ONLY FUNCTIONS ---

async function loadFeaturedMovie() {
    try {
        const movieRes = await fetch(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}`);
        const movieData = await movieRes.json();
        
        const tvRes = await fetch(`${BASE_URL}/trending/tv/week?api_key=${API_KEY}`);
        const tvData = await tvRes.json();

        featuredItems = [...movieData.results.slice(0, 10), ...tvData.results.slice(0, 10)];
        featuredItems.sort(() => Math.random() - 0.5);

        if (featuredItems.length > 0) {
            updateHeroSection(); 
            clearInterval(slideshowInterval); 
            slideshowInterval = setInterval(updateHeroSection, 5000);
        }
    } catch (error) {
        console.error("Failed to load featured items:", error);
        const heroTitle = document.getElementById('hero-title');
        if(heroTitle) heroTitle.textContent = "Could not load featured content.";
    }
}

function updateHeroSection() {
    const heroSection = document.getElementById('hero-section');
    const heroTitle = document.getElementById('hero-title');
    const heroDesc = document.getElementById('hero-description');
    const watchBtn = document.getElementById('hero-watch-btn');
    const infoBtn = document.getElementById('hero-info-btn');

    if (!heroSection || !heroTitle || !heroDesc || !watchBtn || !infoBtn) return;

    const item = featuredItems[currentFeaturedIndex];
    
    if (item) {
        heroSection.style.backgroundImage = `url(${IMG_URL_ORIGINAL}${item.backdrop_path})`;
        heroTitle.textContent = item.title || item.name;
        heroDesc.textContent = item.overview;
        watchBtn.onclick = () => goToMoviePage(item);
        infoBtn.onclick = () => showDetailsModal(item);
    }
    
    currentFeaturedIndex++;
    if (currentFeaturedIndex >= featuredItems.length) {
        currentFeaturedIndex = 0;
    }
}

async function fetchTrending(type) {
    try {
        const res = await fetch(`${BASE_URL}/trending/${type}/week?api_key=${API_KEY}`);
        const data = await res.json();
        return data.results;
    } catch { return []; }
}

async function fetchTrendingAnime() {
    try {
        const res = await fetch(`${BASE_URL}/discover/tv?api_key=${API_KEY}&with_keywords=210024|287501&with_genres=16`);
        const data = await res.json();
        return data.results.map(item => ({ ...item, media_type: 'tv' }));
    } catch { return []; }
}

function displayList(items, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    items.forEach(item => {
        if (item.poster_path) {
            const movieCard = document.createElement('div');
            movieCard.className = 'movie-card';
            movieCard.onclick = () => showDetailsModal(item);
            movieCard.innerHTML = `
                <img src="${IMG_URL_W500}${item.poster_path}" alt="${item.title || item.name}" loading="lazy">
                <p class="movie-title">${item.title || item.name}</p>
            `;
            container.appendChild(movieCard);
        }
    });
}


// --- UNIVERSAL FUNCTIONS (Gagana sa lahat ng page) ---

function goToMoviePage(item) {
    const type = item.media_type || (item.first_air_date ? 'tv' : 'movie');
    if (typeof saveToWatchHistory === 'function') {
        saveToWatchHistory({ id: item.id, title: item.title || item.name, poster_path: item.poster_path, type: type });
    }
    window.location.href = `movie.html?id=${item.id}&type=${type}`;
}

function openSearchModal() {
  const modal = document.getElementById('search-modal');
  modal.classList.add('active');
  document.getElementById('search-input').focus();
  document.body.classList.add('body-no-scroll');
}

function closeSearchModal() {
  const modal = document.getElementById('search-modal');
  modal.classList.remove('active');
  document.body.classList.remove('body-no-scroll');
}

async function searchTMDB() {
    const query = document.getElementById('search-input').value.trim();
    const container = document.getElementById('search-results');
    const noResultsMsg = document.getElementById('no-results-message');
    
    if (!container) return;
    container.innerHTML = '';
    
    if (!query) {
        if(noResultsMsg) noResultsMsg.style.display = 'none';
        return;
    }

    const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
    const data = await res.json();
    const results = data.results.filter(item => item.poster_path && (item.media_type === 'movie' || item.media_type === 'tv'));

    if (noResultsMsg) {
        if (results.length === 0) {
            noResultsMsg.style.display = 'block';
        } else {
            noResultsMsg.style.display = 'none';
        }
    }

    results.forEach(item => {
        const div = document.createElement('div');
        div.className = 'movie-card';
        div.style.width = '150px';
        div.onclick = () => { closeSearchModal(); goToMoviePage(item); };
        div.innerHTML = `<img src="${IMG_URL_W500}${item.poster_path}" alt="${item.title || item.name}"><p class="movie-title">${item.title || item.name}</p>`;
        container.appendChild(div);
    });
}

function openWatchHistoryModal() {
  const modal = document.getElementById('watch-history-modal');
  if (modal) {
      modal.style.display = 'flex';
      if (typeof loadWatchHistory === 'function') {
          loadWatchHistory();
      }
  }
}

const genreMap = { 28:"Action", 12:"Adventure", 16:"Animation", 35:"Comedy", 80:"Crime", 99:"Documentary", 18:"Drama", 10751:"Family", 14:"Fantasy", 36:"History", 27:"Horror", 10402:"Music", 9648:"Mystery", 10749:"Romance", 878:"Science Fiction", 10770:"TV Movie", 53:"Thriller", 10752:"War", 37:"Western" };

function showDetailsModal(item) {
  const modal = document.getElementById('details-modal');
  if (!modal) return;
  document.body.classList.add('body-no-scroll');
  
  document.querySelector('#details-modal .modal-backdrop').style.backgroundImage = `url(${IMG_URL_ORIGINAL}${item.backdrop_path})`;
  document.getElementById('modal-poster').src = `${IMG_URL_W500}${item.poster_path}`;
  document.getElementById('modal-title').textContent = item.title || item.name;
  document.getElementById('modal-rating').textContent = `⭐ ${item.vote_average.toFixed(1)}`;
  document.getElementById('modal-release').textContent = (item.release_date || item.first_air_date || 'N/A').substring(0, 4);
  document.getElementById('modal-description').textContent = item.overview;
  
  const genresContainer = document.getElementById('modal-genres');
  genresContainer.innerHTML = '';
  if (item.genre_ids) {
    item.genre_ids.slice(0, 4).forEach(id => {
      const genreTag = document.createElement('span');
      genreTag.className = 'genre-tag';
      genreTag.textContent = genreMap[id] || 'Unknown';
      genresContainer.appendChild(genreTag);
    });
  }
  
  const watchBtn = document.getElementById('modal-watch-btn');
  watchBtn.onclick = () => goToMoviePage(item);
  
  modal.style.display = 'flex';
}

function closeDetailsModal() {
  const modal = document.getElementById('details-modal');
  if (modal) modal.style.display = 'none';
  document.body.classList.remove('body-no-scroll');
}