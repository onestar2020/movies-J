const API_KEY = '22d74813ded3fecbe3ef632b4814ae3a';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';
let currentItem;
let currentUpload = null;
let bannerItems = [];
let bannerIndex = 0;

async function fetchTrending(type) {
  const response = await fetch(`${BASE_URL}/trending/${type}/week?api_key=${API_KEY}`);
  const data = await response.json();
  return data.results;
}

function createCard(item, type = 'tmdb') {
  const card = document.createElement('div');
  card.classList.add('card');

  const image = document.createElement('img');
  image.src = type === 'tmdb' ? `${IMG_URL}${item.poster_path}` : `https://drive.google.com/thumbnail?id=${item.id}`;
  image.alt = item.title || item.name;
  card.appendChild(image);

  card.addEventListener('click', () => {
    if (type === 'tmdb') openModal(item);
    else openUploadModal(item);
  });

  return card;
}

function populateSection(items, containerId, type = 'tmdb') {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  items.forEach(item => {
    const card = createCard(item, type);
    container.appendChild(card);
  });
}

function openModal(item) {
  currentItem = item;
  document.getElementById('modal-title').innerText = item.title || item.name;
  document.getElementById('modal-image').src = `${IMG_URL}${item.poster_path}`;
  document.getElementById('modal-description').innerText = item.overview || 'No description available.';
  document.getElementById('modal-rating').innerText = `⭐ ${item.vote_average}`;

  changeServer();
  document.getElementById('modal').style.display = 'block';
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
  document.getElementById('modal-video').src = '';
}

function changeServer() {
  if (!currentItem) return;
  const selected = document.getElementById('server').value;
  const titleSlug = encodeURIComponent((currentItem.title || currentItem.name).replace(/\s+/g, '-'));
  document.getElementById('modal-video').src = `https://${selected}/embed/${titleSlug}`;
}

function openUploadModal(item) {
  currentUpload = item;
  document.getElementById('upload-title').innerText = item.title;
  document.getElementById('upload-description').innerText = `Watch ${item.title} in high quality.`;
  document.getElementById('upload-rating').innerText = '⭐ 8.5';
  document.getElementById('upload-video').src = `https://drive.google.com/file/d/${item.id}/preview`;

  document.getElementById('upload-download-btn').href = `https://drive.google.com/uc?id=${item.id}&export=download`;
  document.getElementById('upload-modal').style.display = 'block';
}

function closeUploadModal() {
  document.getElementById('upload-modal').style.display = 'none';
  document.getElementById('upload-video').src = '';
}

function watchCurrentBanner() {
  if (bannerItems.length > 0) openModal(bannerItems[bannerIndex]);
}

function nextBannerTrailer() {
  if (bannerItems.length === 0) return;
  bannerIndex = (bannerIndex + 1) % bannerItems.length;
  setBanner(bannerItems[bannerIndex]);
}

function setBanner(item) {
  document.getElementById('banner-title').innerText = item.title || item.name;
  document.getElementById('trailer').src = `https://www.youtube.com/embed/${item.trailer || 'dQw4w9WgXcQ'}?autoplay=1&mute=1`;
}

async function init() {
  const movies = await fetchTrending('movie');
  const tvshows = await fetchTrending('tv');
  const anime = await fetchTrending('all');

  populateSection(movies, 'movies-list');
  populateSection(tvshows, 'tvshows-list');
  populateSection(anime, 'anime-list');

  if (movies.length) {
    bannerItems = movies.slice(0, 5);
    setBanner(bannerItems[0]);
  }

  if (typeof uploads !== 'undefined') {
    populateSection(uploads, 'uploaded-movies-list', 'upload');
  }
}

function openSearchModal() {
  document.getElementById('search-modal').style.display = 'block';
}

function closeSearchModal() {
  document.getElementById('search-modal').style.display = 'none';
}

function searchTMDB() {
  const query = document.getElementById('search-input').value;
  if (query.length < 2) return;

  fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`)
    .then(response => response.json())
    .then(data => {
      const results = data.results || [];
      const container = document.getElementById('search-results');
      container.innerHTML = '';
      results.forEach(item => {
        const card = createCard(item);
        container.appendChild(card);
      });
    });
}

init();
