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

// ===== DISPLAY =====
function displayBanner(movie) {
  document.getElementById("banner-title").textContent = movie.title || movie.name || movie.original_name;
  fetchTrailer(movie.id, movie.media_type || 'movie').then(trailerUrl => {
    document.getElementById("modal-video").src = trailerUrl || "";
  });
}

function displayList(movies, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  movies.forEach(movie => {
    const div = document.createElement('div');
    div.classList.add('movie-box');
    div.innerHTML = `
      <img src="${IMG_URL + movie.poster_path}" alt="${movie.title || movie.name}" onclick="showTMDBModal(${movie.id}, '${movie.media_type || 'movie'}')" style="width:100%; border-radius:8px; cursor:pointer;" />
    `;
    container.appendChild(div);
  });
}

async function showTMDBModal(id, mediaType) {
  const res = await fetch(`${BASE_URL}/${mediaType}/${id}?api_key=${API_KEY}`);
  const data = await res.json();
  document.getElementById('modal-title').textContent = data.title || data.name;
  document.getElementById('modal-description').textContent = data.overview;
  document.getElementById('modal-image').src = IMG_URL + data.poster_path;
  document.getElementById('modal-rating').innerHTML = '★'.repeat(Math.round(data.vote_average / 2));

  fetchTrailer(id, mediaType).then(trailerUrl => {
    document.getElementById("modal-video").src = trailerUrl || "";
  });
  document.getElementById("modal-tmdb").style.display = "flex";
}

function closeModal() {
  document.getElementById("modal-tmdb").style.display = "none";
  document.getElementById("modal-video").src = "";
}

function closeUploadModal() {
  document.getElementById("modal-upload").style.display = "none";
  document.getElementById("upload-video").src = "";
}

// ===== MODALS =====
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

function loadAdScript() {
  const adScriptURL = '//pl26963581.profitableratecpm.com/26/64/7c/26647c341d28af2d8f282b38a2fe6881.js';
  if (!window.adScriptLoaded) {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = adScriptURL;
    document.body.appendChild(script);
    window.adScriptLoaded = true;
  }
}

// ===== UPLOADED MOVIES =====
async function enrichUploads() {
  enrichedUploads = await Promise.all(
    uploads.map(async (upload) => {
      const details = await fetchMovieDetailsByTitle(upload.title);
      return {
        ...upload,
        poster: details?.poster_path ? IMG_URL + details.poster_path : 'images/logo.png',
        description: details?.overview || 'No description available.',
        rating: details?.vote_average ? details.vote_average / 2 : 3,
        trailer: await fetchTrailer(details?.id || '', 'movie'),
      };
    })
  );
}

function renderUploadedMoviesPage(page) {
  const start = page * itemsPerPage;
  const end = start + itemsPerPage;
  const container = document.getElementById('myupload-list');
  container.innerHTML = '';
  enrichedUploads.slice(start, end).forEach(movie => {
    const box = document.createElement('div');
    box.classList.add('movie-box');
    box.innerHTML = `
      <img src="${movie.poster}" alt="${movie.title}" style="width:100%; border-radius:8px; cursor:pointer;" onclick='showUploadedMovie(${JSON.stringify(movie)})' />
    `;
    container.appendChild(box);
  });
}

document.getElementById('load-next-uploaded').addEventListener('click', () => {
  if ((currentUploadPage + 1) * itemsPerPage < enrichedUploads.length) {
    currentUploadPage++;
    renderUploadedMoviesPage(currentUploadPage);
  }
});

document.getElementById('load-prev-uploaded').addEventListener('click', () => {
  if (currentUploadPage > 0) {
    currentUploadPage--;
    renderUploadedMoviesPage(currentUploadPage);
  }
});

function handleQuotaWarningCheck() {
  document.querySelector('#modal-upload .warning-text').style.display = 'block';
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
