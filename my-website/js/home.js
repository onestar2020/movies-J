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

// Keep other parts of home.js code unchanged
