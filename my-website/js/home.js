// ===== CONFIG =====
const API_KEY = '22d74813ded3fecbe3ef632b4814ae3a';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';
let currentItem;
let bannerItems = [];
let bannerIndex = 0;
let currentServer = 'vidsrc.cc';

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
  };

  btnWatch.onclick = (e) => {
    e.preventDefault();
    document.getElementById('upload-video').src = movie.driveLink;
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
  let videoUrl = '';

  if (currentServer === 'vidsrc.cc') {
    videoUrl = `https://vidsrc.cc/embed/${mediaType}/${id}`;
  } else if (currentServer === 'vidsrc.me') {
    videoUrl = `https://vidsrc.me/embed/${mediaType}/${id}`;
  } else if (currentServer === 'player.videasy.net') {
    videoUrl = `https://player.videasy.net/embed/${mediaType}/${id}`;
  } else if (currentServer === 'multiembed') {
    videoUrl = `https://multiembed.com/api/v1/movies/${id}`;
  } else if (currentServer === '2embed') {
    videoUrl = `https://2embed.org/embed/${mediaType}/${id}`;
  } else {
    videoUrl = `https://vidsrc.cc/embed/${mediaType}/${id}`;
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

// ===== LOAD CUSTOM UPLOADS =====
const uploads = [
  { title: "ARQ", id: "1KJ_R_RGVGwgpypYNEf-_2gJ6mDfCvLYH" },
  { title: "The Hunger Games", id: "1Agy9Z6IlEPwVqUK2VSDpBvpUFklBDOvp" },
  { title: "The Hunger Games: The Ballad of Songbirds and Snakes", id: "1XVaQPU0WOJiLWG23whj9jHMsCCCWpw4S" },
  { title: "Kill Command", id: "1wfsA6vF6Xyy10qR5EeOQHf7HEj1VtyOt" },
  { title: "Maze Runner: The Death Cure", id: "1kKzOIMcEq76IqmI4Z8AnV2gAkrDhAd15" },
  { title: "Morbius", id: "15ue4p4e14u7l_Bxhf5I2KH8BFAbAvi2C" },
  { title: "Shaun of the Dead", id: "1gqZ_IawXvSj-iQJB6L64kGFkbBg95lGO" },
  { title: "Smile 2", id: "1c4YOkoSiIKvM3ruYXRR2auFrT6hRmAKz" },
  { title: "Smile", id: "1DDijEmLwM7tqjaQdrpwGzgtjSW0Sws8F" },
  { title: "Sting", id: "1IKJK2TM13u64knIpX749GIbkxiQxxbzT" },
  { title: "The Dark Tower", id: "1RSaJWvJM4QjNG99iTDI4nhuqTHIO1GMz" },
  { title: "The Mist", id: "1RIBLkQ6QpsUvIeCBZXq9cBG-pIkn5_h-" },
  { title: "A Working Man", id: "1SzBfgO_0lRYF9IYWFdUWWfARdwNrdUKX" },
  { title: "Final Destination Bloodlines", id: "1WW5wVra8gjiEaKzVy54SOwxLiRWq2zGs" },
  { title: "Kraken", id: "10plK6C0pCWeITPOtII_nLfZCYrRAhRdB" },
  { title: "Echo Valley", id: "1LG2tPchnG6K8nwCIKAiafkIw2WxUGQLR" },
  { title: "How to Train Your Dragon", id: "1piyv0TgMOghCPGVE2Wq3KLKoUrIKv0Z2" },
  { title: "Predator: Killer of Killers", id: "1TtTXWUWA7Q2DUSNIa2vzTI-Ko9xevg0B" },
  { title: "Sneaks", id: "1JXM98DsuYU3Sp8I7PWQB2DKxCfvRjrIm" },
  { title: "Warfare", id: "1MMVOlPB6hSM7YWaVdZH8ZaphgBcuNjxb" },
  { title: "", id: "" },
  { title: "", id: "" },
  { title: "", id: "" },
  { title: "", id: "" },
  { title: "", id: "" },
  { title: "", id: "" },
  { title: "", id: "" },
  { title: "", id: "" },
  { title: "", id: "" },
];

async function loadUploadedMovies() {
  const container = document.getElementById('myupload-list');
  container.innerHTML = '';

  for (const movie of uploads) {
    const tmdb = await fetchMovieDetailsByTitle(movie.title);
    if (!tmdb || !tmdb.poster_path) {
      console.warn(`TMDB not found or incomplete for: ${movie.title}`);
      continue;
    }

    const trailer = await fetchTrailer(tmdb.id, 'movie');

    movie.poster = `${IMG_URL}${tmdb.poster_path}`;
    movie.description = tmdb.overview;
    movie.rating = tmdb.vote_average / 2;
    movie.trailer = trailer;
    movie.driveLink = `https://drive.google.com/file/d/${movie.id}/preview`;
    movie.download = `https://drive.google.com/uc?id=${movie.id}&export=download`;

    const img = document.createElement('img');
    img.src = movie.poster;
    img.alt = movie.title;
    img.style.cursor = 'pointer';
    img.onclick = () => showUploadedMovie(movie);
    container.appendChild(img);
  }
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
  await loadUploadedMovies();
}

init();
