const API_KEY = '22d74813ded3fecbe3ef632b4814ae3a';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';

let currentItem;
let bannerItems = [];
let bannerIndex = 0;

// ===== SEARCH FUNCTION =====
async function handleNewSearch() {
  const input = document.getElementById('new-search-input');
  const query = input.value.trim();
  const resultBox = document.getElementById('new-search-results');
  const resultList = document.getElementById('new-search-list');
  resultList.innerHTML = '';

  if (!query) {
    resultBox.style.display = 'none';
    return;
  }

  try {
    const response = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
    const data = await response.json();

    if (!data.results.length) {
      resultList.innerHTML = `<p style="color: white;">No results found.</p>`;
    }

    data.results.forEach(item => {
      if (!item.poster_path) return;

      const img = document.createElement('img');
      img.src = `${IMG_URL}${item.poster_path}`;
      img.alt = item.title || item.name;
      img.onclick = () => showDetails(item);
      resultList.appendChild(img);
    });

    resultBox.style.display = 'block';
  } catch (err) {
    console.error('❌ Search error:', err);
    resultBox.style.display = 'block';
    resultList.innerHTML = `<p style="color:red;">Failed to load results. Please try again later.</p>`;
  }
}

// ===== SHOW DETAILS MODAL =====
async function showDetails(item) {
  currentItem = item;
  const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');

  document.getElementById('modal-title').textContent = item.title || item.name;
  document.getElementById('modal-description').textContent = item.overview || '';
  document.getElementById('modal-image').src = `${IMG_URL}${item.poster_path}`;
  document.getElementById('modal-rating').innerHTML = '★'.repeat(Math.round((item.vote_average || 0) / 2));

  const trailerUrl = await fetchTrailer(item.id, mediaType);
  document.getElementById('modal-video').src = trailerUrl || '';
  document.getElementById('modal-tmdb').style.display = 'flex';
}

function closeModal() {
  document.getElementById('modal-tmdb').style.display = 'none';
  document.getElementById('modal-video').src = '';
}

// ===== TRAILER FETCH =====
async function fetchTrailer(id, mediaType) {
  try {
    const res = await fetch(`${BASE_URL}/${mediaType}/${id}/videos?api_key=${API_KEY}`);
    const data = await res.json();
    const trailer = data.results.find(v => v.type === "Trailer" && v.site === "YouTube");
    return trailer ? `https://www.youtube.com/embed/${trailer.key}` : null;
  } catch {
    return null;
  }
}

// ===== INIT MOVIE DATA =====
async function fetchTrending(type) {
  const response = await fetch(`${BASE_URL}/trending/${type}/week?api_key=${API_KEY}`);
  const data = await response.json();
  return data.results || [];
}

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
    if (!item.poster_path) return;
    const img = document.createElement('img');
    img.src = `${IMG_URL}${item.poster_path}`;
    img.alt = item.title || item.name;
    img.onclick = () => showDetails(item);
    container.appendChild(img);
  });
}

// ===== INIT =====
async function init() {
  const movies = await fetchTrending('movie');
  const tvShows = await fetchTrending('tv');

  bannerItems = movies;
  bannerIndex = Math.floor(Math.random() * bannerItems.length);
  displayBanner(bannerItems[bannerIndex]);

  displayList(movies, 'movies-list');
  displayList(tvShows, 'tvshows-list');
}

init();
