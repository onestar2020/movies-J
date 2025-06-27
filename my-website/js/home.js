// ===== CONFIG =====
const API_KEY = '22d74813ded3fecbe3ef632b4814ae3a';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';
let currentItem;
let bannerItems = [];
let bannerIndex = 0;
let currentServer = 'vidsrc.cc';

let currentUploadPage = 0;
const itemsPerPage = 12;
let enrichedUploads = [];

// ===== ADS =====
function loadAdScript() {
  const existing = document.querySelector('script[src*="profitableratecpm"]');
  if (!existing) {
    const script = document.createElement('script');
    script.src = "//pl26963581.profitableratecpm.com/26/64/7c/26647c341d28af2d8f282b38a2fe6881.js";
    script.type = "text/javascript";
    document.body.appendChild(script);
  }
}

// ===== FETCHERS =====
async function fetchTrending(type) {
  try {
    let allResults = [];
    for (let page = 1; page <= 5; page++) {
      const res = await fetch(`${BASE_URL}/trending/${type}/week?api_key=${API_KEY}&page=${page}`);
      const data = await res.json();
      if (data.results) allResults = allResults.concat(data.results);
    }
    return allResults;
  } catch (error) {
    console.error(`Failed to fetch trending ${type}:`, error);
    return [];
  }
}

async function fetchTrendingAnime() {
  try {
    let allResults = [];
    for (let page = 1; page <= 5; page++) {
      const res = await fetch(`${BASE_URL}/trending/tv/week?api_key=${API_KEY}&page=${page}`);
      const data = await res.json();
      const filtered = data.results.filter(item => item.original_language === 'ja' && item.genre_ids.includes(16));
      allResults = allResults.concat(filtered);
    }
    return allResults;
  } catch (error) {
    console.error('Failed to fetch trending anime:', error);
    return [];
  }
}

async function fetchTrailer(id, mediaType) {
  try {
    const res = await fetch(`${BASE_URL}/${mediaType}/${id}/videos?api_key=${API_KEY}`);
    const data = await res.json();
    const trailer = data.results.find(video => video.type === "Trailer" && video.site === "YouTube");
    return trailer ? `https://www.youtube.com/embed/${trailer.key}` : null;
  } catch (error) {
    console.error(`Failed to fetch trailer for ${mediaType} ID ${id}:`, error);
    return null;
  }
}

async function fetchMovieDetailsByTitle(title) {
  try {
    const res = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(title)}`);
    const data = await res.json();
    return data.results.length ? data.results[0] : null;
  } catch (error) {
    console.error(`Failed to fetch movie details for title: ${title}`, error);
    return null;
  }
}

// ===== SEARCH ALL (TMDB + UPLOADED) =====
async function searchAll() {
  const query = document.getElementById('search-input').value.toLowerCase();
  const container = document.getElementById('search-results');
  container.innerHTML = '';

  if (!query.trim()) return;

  try {
    const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
    const data = await res.json();

    data.results.forEach(item => {
      if (!item.poster_path) return;
      const img = document.createElement('img');
      img.src = `${IMG_URL}${item.poster_path}`;
      img.alt = item.title || item.name;
      img.onclick = () => {
        closeSearchModal();
        showDetails(item);
      };
      container.appendChild(img);
    });
  } catch (error) {
    console.error('TMDB search failed:', error);
  }

  const matchedUploads = enrichedUploads.filter(movie =>
    movie.title.toLowerCase().includes(query)
  );

  matchedUploads.forEach(movie => {
    const img = document.createElement('img');
    img.src = movie.poster;
    img.alt = movie.title;
    img.onclick = () => {
      closeSearchModal();
      showUploadedMovie(movie);
    };
    container.appendChild(img);
  });
}

// === INIT ===
async function init() {
  const movies = await fetchTrending('movie');
  const tvShows = await fetchTrending('tv');
  const anime = await fetchTrendingAnime();

  bannerItems = movies;
  bannerIndex = Math.floor(Math.random() * bannerItems.length);
  displayBanner(bannerItems[bannerIndex]);

  displayList(movies, 'movies-list');
  displayList(tvShows, 'tvshows-list');
  displayList(anime, 'anime-list');

  await enrichUploads();
  renderUploadedMoviesPage(currentUploadPage);
}

init();

const searchInput = document.getElementById('search-input');
if (searchInput) {
  searchInput.addEventListener('input', searchAll);
} else {
  console.warn('Search input not found');
}
