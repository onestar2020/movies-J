// ✅ home.js (Ibinalik sa simpleng version)

const API_KEY = '22d74813ded3fecbe3ef632b4814ae3a';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL_W500 = 'https://image.tmdb.org/t/p/w500';
const IMG_URL_ORIGINAL = 'https://image.tmdb.org/t/p/original';

// --- MAIN FUNCTION PAGKA-LOAD NG PAGE ---
document.addEventListener("DOMContentLoaded", async () => {
    // Load lahat ng kailangan para sa homepage
    loadFeaturedMovie();
    fetchTrending('movie').then(items => displayList(items, 'movies-list'));
    fetchTrending('tv').then(items => displayList(items, 'tvshows-list'));
    fetchTrendingAnime().then(items => displayList(items, 'anime-list'));
    
    // Add scroll effect sa navbar
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
});

// --- FEATURED MOVIE ---
async function loadFeaturedMovie() {
    const heroSection = document.getElementById('hero-section');
    const heroTitle = document.getElementById('hero-title');
    const heroDesc = document.getElementById('hero-description');
    const watchBtn = document.getElementById('hero-watch-btn');
    const infoBtn = document.getElementById('hero-info-btn');

    try {
        const res = await fetch(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}`);
        const data = await res.json();
        const featuredMovie = data.results[0]; // Kunin ang #1 trending
        
        if (featuredMovie) {
            heroSection.style.backgroundImage = `url(${IMG_URL_ORIGINAL}${featuredMovie.backdrop_path})`;
            heroTitle.textContent = featuredMovie.title;
            heroDesc.textContent = featuredMovie.overview;
            watchBtn.onclick = () => goToMoviePage(featuredMovie);
            infoBtn.onclick = () => goToMoviePage(featuredMovie);
        }
    } catch (error) {
        console.error("Failed to load featured movie:", error);
        if(heroTitle) heroTitle.textContent = "Could not load featured movie.";
    }
}

// --- FETCHING DATA ---
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

// --- DISPLAY LISTS ---
function displayList(items, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    items.forEach(item => {
        if (item.poster_path) {
            const movieCard = document.createElement('div');
            movieCard.className = 'movie-card';
            movieCard.onclick = () => goToMoviePage(item);
            movieCard.innerHTML = `
                <img src="${IMG_URL_W500}${item.poster_path}" alt="${item.title || item.name}" loading="lazy">
                <p class="movie-title">${item.title || item.name}</p>
            `;
            container.appendChild(movieCard);
        }
    });
}

// --- UTILITY FUNCTIONS ---
function goToMoviePage(item) {
    const type = item.media_type || (item.first_air_date ? 'tv' : 'movie');
    saveToWatchHistory({ id: item.id, title: item.title || item.name, poster_path: item.poster_path, type: type });
    window.location.href = `movie.html?id=${item.id}&type=${type}`;
}

// --- SEARCH MODAL ---
function openSearchModal() {
  document.getElementById('search-modal').style.display = 'flex';
  document.getElementById('search-input').focus();
}

function closeSearchModal() {
  document.getElementById('search-modal').style.display = 'none';
}

async function searchTMDB() {
  const query = document.getElementById('search-input').value.trim();
  const container = document.getElementById('search-results');
  container.innerHTML = '';
  if (!query) return;

  const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
  const data = await res.json();
  const results = data.results.filter(item => item.poster_path && (item.media_type === 'movie' || item.media_type === 'tv'));

  results.forEach(item => {
    const div = document.createElement('div');
    div.className = 'movie-card';
    div.style.width = '150px';
    div.onclick = () => { closeSearchModal(); goToMoviePage(item); };
    div.innerHTML = `<img src="${IMG_URL_W500}${item.poster_path}" alt="${item.title || item.name}"><p class="movie-title">${item.title || item.name}</p>`;
    container.appendChild(div);
  });
}

// --- WATCH HISTORY (nasa watchHistory.js na, pero kailangan ang open function) ---
function openWatchHistoryModal() {
  loadWatchHistory();
  document.getElementById('watch-history-modal').style.display = 'flex';
  document.getElementById('close-history-modal')?.addEventListener('click', () => {
      document.getElementById('watch-history-modal').style.display = 'none';
  });
}