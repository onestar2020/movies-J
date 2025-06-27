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
    loadAdScript(); // Load ad when Watch Full Movie is clicked
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

// ===== SEARCH =====
function openSearchModal() {
  document.getElementById('search-modal').style.display = 'flex';
  document.getElementById('search-input').focus();
}

function closeSearchModal() {
  document.getElementById('search-modal').style.display = 'none';
  document.getElementById('search-results').innerHTML = '';
}

async function searchTMDB() {
  const query = document.getElementById('search-input').value;
  if (!query.trim()) {
    document.getElementById('search-results').innerHTML = '';
    return;
  }
  const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
  const data = await res.json();
  const container = document.getElementById('search-results');
  container.innerHTML = '';
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
}

// ===== PAGINATED UPLOADS =====
function renderUploadedMoviesPage(page) {
  const container = document.getElementById('myupload-list');
  container.innerHTML = '';

  const start = page * itemsPerPage;
  const end = start + itemsPerPage;
  const currentItems = enrichedUploads.slice(start, end);

  currentItems.forEach(movie => {
    const img = document.createElement('img');
    img.src = movie.poster;
    img.alt = movie.title;
    img.style.cursor = 'pointer';
    img.onclick = () => showUploadedMovie(movie);
    container.appendChild(img);
  });

  document.getElementById('upload-pagination').innerHTML = `
    <button id="load-prev-uploaded" ${page === 0 ? 'disabled' : ''}>Previous</button>
    <button id="load-next-uploaded" ${(end >= enrichedUploads.length) ? 'disabled' : ''}>Next</button>
  `;

  document.getElementById('load-prev-uploaded').onclick = () => {
    if (currentUploadPage > 0) {
      currentUploadPage--;
      renderUploadedMoviesPage(currentUploadPage);
    }
  };

  document.getElementById('load-next-uploaded').onclick = () => {
    if ((page + 1) * itemsPerPage < enrichedUploads.length) {
      currentUploadPage++;
      renderUploadedMoviesPage(currentUploadPage);
    }
  };
}

async function enrichUploads() {
  enrichedUploads = [];
  for (const movie of uploads) {
    if (!movie.title || !movie.id) continue;
    const tmdb = await fetchMovieDetailsByTitle(movie.title);
    if (!tmdb || !tmdb.poster_path) continue;

    const trailer = await fetchTrailer(tmdb.id, 'movie');

    enrichedUploads.push({
      ...movie,
      poster: `${IMG_URL}${tmdb.poster_path}`,
      description: tmdb.overview,
      rating: tmdb.vote_average / 2,
      trailer,
      driveLink: `https://drive.google.com/file/d/${movie.id}/preview`,
      download: `https://drive.google.com/uc?id=${movie.id}&export=download`
    });
  }
}

function handleQuotaWarningCheck() {
  const warning = document.querySelector('#modal-upload .warning-text');
  const iframe = document.getElementById('upload-video');
  if (warning) warning.style.display = 'none';
  setTimeout(() => {
    const isLoaded = iframe?.contentWindow?.length !== 0;
    if (!isLoaded && warning) warning.style.display = 'block';
  }, 2000);
}

// ===== INIT =====
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
