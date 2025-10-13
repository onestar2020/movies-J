// === BAGONG CODE PARA SA js/home.js ===

// TINANGGAL NA DITO ANG API_KEY at BASE_URL
const IMG_URL = 'https://image.tmdb.org/t/p/w500'; // Mas mabilis na image size
const moviesPerPage = 15;
const uploadsPerPage = 12;

let movieItems = [];
let tvItems = [];
let animeItems = [];
let currentUploadPage = 1;
let currentItem = null;
let currentUpload = null;
let bannerItems = [];
let bannerIndex = 0;

async function fetchTrending(type) {
  // BINAGO: Tumatawag na sa ating "Sikretong Taguan"
  const res = await fetch(`/.netlify/functions/tmdb?endpoint=trending/${type}/week`);
  const data = await res.json();
  return data.results;
}

async function fetchTrendingAnime() {
  let allResults = [];
  for (let page = 1; page <= 3; page++) {
    // BINAGO: Tumatawag na sa ating "Sikretong Taguan"
    const res = await fetch(`/.netlify/functions/tmdb?endpoint=trending/tv/week&page=${page}`);
    const data = await res.json();
    const filtered = data.results.filter(item =>
      item.original_language === 'ja' && item.genre_ids.includes(16)
    );
    allResults = allResults.concat(filtered);
  }
  return allResults;
}

async function searchTMDB(query) {
  if (!query) {
    displaySearchResults([]);
    return;
  }
  // BINAGO: Tumatawag na sa ating "Sikretong Taguan"
  const res = await fetch(`/.netlify/functions/tmdb?endpoint=search/multi&query=${query}`);
  const data = await res.json();
  displaySearchResults(data.results);
}

// --- ANG IBA PANG CODE AY PAREHO PA RIN, KOPYAHIN LANG BUO ---

function displayItems(containerId, items) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    items.slice(0, moviesPerPage).forEach(item => {
        const title = item.title || item.name;
        const posterPath = item.poster_path ? `${IMG_URL}${item.poster_path}` : 'images/placeholder.png';
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.innerHTML = `<img src="${posterPath}" alt="${title}" onclick="goToMovie('${item.id}', '${item.media_type || (item.title ? 'movie' : 'tv')}')"><p>${title}</p>`;
        container.appendChild(card);
    });
}

function displaySearchResults(results) {
    const searchResultsDiv = document.getElementById('search-results');
    searchResultsDiv.innerHTML = '';
    results.filter(r => r.media_type !== 'person' && r.poster_path).slice(0, 10).forEach(item => {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'search-result-item';
        resultDiv.innerHTML = `<img src="${IMG_URL}${item.poster_path}" alt="${item.title || item.name}"><div><h3>${item.title || item.name}</h3><p>${item.release_date ? item.release_date.substring(0, 4) : ''} - ${item.media_type.toUpperCase()}</p></div>`;
        resultDiv.onclick = () => goToMovie(item.id, item.media_type);
        searchResultsDiv.appendChild(resultDiv);
    });
}

function goToMovie(id, type) { window.location.href = `movie.html?id=${id}&type=${type}`; }
function openSearchModal() { document.getElementById('search-modal').style.display = 'flex'; }
function closeSearchModal() { document.getElementById('search-modal').style.display = 'none'; }
function openWatchHistoryModal() { document.getElementById('watch-history-modal').style.display = 'flex'; }

async function init() {
    [movieItems, tvItems] = await Promise.all([fetchTrending('movie'), fetchTrending('tv')]);
    animeItems = await fetchTrendingAnime();
    displayItems('trending-movies', movieItems);
    displayItems('trending-tv', tvItems);
    displayItems('trending-anime', animeItems);
    bannerItems = movieItems.slice(0, 5);
    if (bannerItems.length > 0) updateBanner(bannerItems[bannerIndex]);
}

function updateBanner(item) {
    const banner = document.getElementById('banner');
    const bannerTitle = document.getElementById('banner-title');
    if (!banner || !bannerTitle) return;
    banner.style.backgroundImage = `linear-gradient(to right, rgba(17, 17, 17, 1) 0%, rgba(17, 17, 17, 0) 100%), url(https://image.tmdb.org/t/p/original${item.backdrop_path})`;
    bannerTitle.textContent = item.title || item.name;
    const playButton = banner.querySelector('.play-btn');
    if (playButton) { playButton.onclick = () => goToMovie(item.id, item.media_type); }
}

document.addEventListener('DOMContentLoaded', async () => {
    await init();
    const prevBtn = document.getElementById('prev-trailer');
    const nextBtn = document.getElementById('next-trailer');
    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => { bannerIndex = (bannerIndex - 1 + bannerItems.length) % bannerItems.length; updateBanner(bannerItems[bannerIndex]); });
        nextBtn.addEventListener('click', () => { bannerIndex = (bannerIndex + 1) % bannerItems.length; updateBanner(bannerItems[bannerIndex]); });
    }
    if (typeof loadUploadedMovies === 'function') loadUploadedMovies();
    if (typeof initializeWatchHistory === 'function') initializeWatchHistory();
});