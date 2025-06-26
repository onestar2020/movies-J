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

// ===== PWA SERVICE WORKER REGISTRATION =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(reg => console.log('✅ Service Worker registered:', reg.scope))
      .catch(err => console.error('❌ Service Worker registration failed:', err));
  });
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

// ===== UPLOADED MOVIES SECTION =====
async function enrichUploads() {
  enrichedUploads = await Promise.all(uploads.map(async (movie) => {
    const details = await fetchMovieDetailsByTitle(movie.title);
    return {
      ...movie,
      poster: details?.poster_path,
      description: details?.overview || 'No description available.',
      rating: details?.vote_average || 'N/A'
    };
  }));
}

function renderUploadedMoviesPage(page) {
  const list = document.getElementById('myupload-list');
  list.innerHTML = '';
  const start = page * itemsPerPage;
  const end = start + itemsPerPage;
  const pageItems = enrichedUploads.slice(start, end);

  pageItems.forEach(item => {
    const img = document.createElement('img');
    img.src = item.poster ? `${IMG_URL}${item.poster}` : 'images/logo.png';
    img.alt = item.title;
    img.onclick = () => openUploadModal(item);
    list.appendChild(img);
  });

  document.getElementById('load-prev-uploaded').onclick = () => {
    if (currentUploadPage > 0) {
      currentUploadPage--;
      renderUploadedMoviesPage(currentUploadPage);
    }
  };

  document.getElementById('load-next-uploaded').onclick = () => {
    if (end < enrichedUploads.length) {
      currentUploadPage++;
      renderUploadedMoviesPage(currentUploadPage);
    }
  };
}

// ===== UPLOADED MOVIE MODAL =====
function openUploadModal(item) {
  document.getElementById('upload-title').textContent = item.title;
  document.getElementById('upload-rating').textContent = `⭐ ${item.rating}`;
  document.getElementById('upload-description').textContent = item.description;
  document.getElementById('upload-image').src = item.poster ? `${IMG_URL}${item.poster}` : 'images/logo.png';
  document.getElementById('upload-video').src = `https://drive.google.com/file/d/${item.id}/preview`;

  document.getElementById('btn-trailer').href = `https://www.youtube.com/results?search_query=${encodeURIComponent(item.title)} trailer`;
  document.getElementById('btn-trailer').style.display = 'inline-block';

  document.getElementById('btn-watch').href = `https://drive.google.com/file/d/${item.id}/preview`;
  document.getElementById('btn-watch').style.display = 'inline-block';

  document.getElementById('btn-download').href = `https://drive.google.com/uc?export=download&id=${item.id}`;
  document.getElementById('btn-download').style.display = 'inline-block';

  document.getElementById('modal-upload').style.display = 'flex';
}

function closeUploadModal() {
  document.getElementById('modal-upload').style.display = 'none';
  document.getElementById('upload-video').src = '';
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
