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
  let allResults = [];
  for (let page = 1; page <= 5; page++) {
    const res = await fetch(`${BASE_URL}/trending/${type}/week?api_key=${API_KEY}&page=${page}`);
    const data = await res.json();
    allResults = allResults.concat(data.results);
  }
  return allResults;
}

async function fetchTrendingAnime() {
  let allResults = [];
  for (let page = 1; page <= 5; page++) {
    const res = await fetch(`${BASE_URL}/trending/tv/week?api_key=${API_KEY}&page=${page}`);
    const data = await res.json();
    const filtered = data.results.filter(item => item.original_language === 'ja' && item.genre_ids.includes(16));
    allResults = allResults.concat(filtered);
  }
  return allResults;
}

async function fetchTrailer(id, mediaType) {
  const res = await fetch(`${BASE_URL}/${mediaType}/${id}/videos?api_key=${API_KEY}`);
  const data = await res.json();
  const trailer = data.results.find(video => video.type === "Trailer" && video.site === "YouTube");
  return trailer ? `https://www.youtube.com/embed/${trailer.key}` : null;
}

async function fetchMovieDetailsByTitle(title) {
  const res = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(title)}`);
  const data = await res.json();
  return data.results.length ? data.results[0] : null;
}

// ===== BANNER =====
async function displayBanner(item) {
  const banner = document.getElementById('banner');
  const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
  const trailerUrl = await fetchTrailer(item.id, mediaType);

  if (trailerUrl) {
    banner.innerHTML = `
      <iframe width="100%" height="100%" src="${trailerUrl}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailerUrl.split("/").pop()}"
        frameborder="0" allow="autoplay; encrypted-media" allowfullscreen style="border-radius: 8px; filter: brightness(0.7);"></iframe>
      <div class="banner-buttons">
        <button class="btn-outline" onclick="nextBannerTrailer()">
          <i class="fas fa-random"></i> Next Trailer
        </button>
        <button class="btn-solid" onclick="watchBannerMovie()">
          <i class="fas fa-play"></i> Watch Full Movie
        </button>
      </div>
    `;
  } else {
    banner.style.backgroundImage = `url(${IMG_URL}${item.backdrop_path})`;
    banner.innerHTML = `<h1 id="banner-title">${item.title || item.name}</h1>`;
  }
}

function nextBannerTrailer() {
  bannerIndex = (bannerIndex + 1) % bannerItems.length;
  displayBanner(bannerItems[bannerIndex]);
}

function watchBannerMovie() {
  showDetails(bannerItems[bannerIndex]);
}

function displayList(items, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  items.forEach(item => {
    const img = document.createElement('img');
    img.src = `${IMG_URL}${item.poster_path}`;
    img.alt = item.title || item.name;
    img.onclick = () => showDetails(item);
    container.appendChild(img);
  });
}

// ===== MODALS =====
async function showDetails(item) {
  currentItem = item;
  const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
  const trailerUrl = await fetchTrailer(item.id, mediaType);

  document.getElementById('modal-title').textContent = item.title || item.name;
  document.getElementById('modal-description').textContent = item.overview || '';
  document.getElementById('modal-image').src = `${IMG_URL}${item.poster_path}`;
  document.getElementById('modal-rating').innerHTML = '★'.repeat(Math.round(item.vote_average / 2));
  document.getElementById('modal-video').src = trailerUrl || '';
  document.getElementById('modal-tmdb').style.display = 'flex';

  const serverSelect = document.getElementById('server');
  if (serverSelect) serverSelect.value = currentServer;
}

function showUploadedMovie(movie) {
  currentItem = movie;

  document.getElementById('upload-title').textContent = movie.title;
  document.getElementById('upload-description').textContent = movie.description;
  document.getElementById('upload-image').src = movie.poster;
  document.getElementById('upload-rating').innerHTML = '★'.repeat(Math.round(movie.rating));
  document.getElementById('upload-video').src = movie.trailer;
  document.getElementById('modal-upload').style.display = 'flex';

  const btnTrailer = document.getElementById('btn-trailer');
  const btnWatch = document.getElementById('btn-watch');
  const btnDownload = document.getElementById('btn-download');

  btnTrailer.style.display = 'inline-block';
  btnWatch.style.display = 'inline-block';
  btnDownload.style.display = movie.download ? 'inline-block' : 'none';

  btnTrailer.onclick = (e) => {
    e.preventDefault();
    document.getElementById('upload-video').src = movie.trailer;
    handleQuotaWarningCheck();
  };

  btnWatch.onclick = (e) => {
    e.preventDefault();
    loadAdScript();
    document.getElementById('upload-video').src = movie.driveLink;
    handleQuotaWarningCheck();
  };

  if (movie.download) {
    btnDownload.href = movie.download;
    btnDownload.setAttribute('target', '_blank');
  }
}

function closeModal() {
  document.getElementById('modal-tmdb').style.display = 'none';
  document.getElementById('modal-video').src = '';
}

function closeUploadModal() {
  document.getElementById('modal-upload').style.display = 'none';
  document.getElementById('upload-video').src = '';
}

function openSearchModal() {
  document.getElementById('search-modal').style.display = 'flex';
  document.getElementById('search-input').focus();
}

function closeSearchModal() {
  document.getElementById('search-modal').style.display = 'none';
  document.getElementById('search-input').value = '';
  document.getElementById('search-results').innerHTML = '';
}

// ===== SERVER CHANGE HANDLER =====
function changeServer() {
  const select = document.getElementById('server');
  currentServer = select.value;

  if (!currentItem || document.getElementById('modal-tmdb').style.display !== 'flex') return;

  const mediaType = currentItem.media_type || (currentItem.first_air_date ? 'tv' : 'movie');
  const id = currentItem.id;
  let videoUrl = `https://vidsrc.cc/embed/${mediaType}/${id}`;

  if (currentServer === 'vidsrc.me') {
    videoUrl = `https://vidsrc.me/embed/${mediaType}/${id}`;
  } else if (currentServer === 'player.videasy.net') {
    videoUrl = `https://player.videasy.net/embed/${mediaType}/${id}`;
  } else if (currentServer === 'multiembed') {
    videoUrl = `https://multiembed.com/api/v1/movies/${id}`;
  } else if (currentServer === '2embed') {
    videoUrl = `https://2embed.org/embed/${mediaType}/${id}`;
  }

  document.getElementById('modal-video').src = videoUrl;
}

// ===== SEARCH ALL (TMDB + UPLOADED) =====
async function searchAll() {
  const query = document.getElementById('search-input').value.toLowerCase();