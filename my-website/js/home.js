// Movies-J Home.js Clean Version

const API_KEY = '22d74813ded3fecbe3ef632b4814ae3a';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';
const moviesPerPage = 15;
const uploadsPerPage = 12;

let movieItems = [];
let tvItems = [];
let animeItems = [];
let currentUploadPage = 1;
let currentItem = null;
let currentUpload = null;

// Banner/trailer state
let bannerItems = [];
let bannerIndex = 0;

async function fetchTrending(type) {
  const res = await fetch(`${BASE_URL}/trending/${type}/week?api_key=${API_KEY}`);
  const data = await res.json();
  return data.results;
}

async function fetchTrendingAnime() {
  let allResults = [];
  for (let page = 1; page <= 3; page++) {
    const res = await fetch(`${BASE_URL}/trending/tv/week?api_key=${API_KEY}&page=${page}`);
    const data = await res.json();
    const filtered = data.results.filter(item =>
      item.original_language === 'ja' && item.genre_ids.includes(16)
    );
    allResults = allResults.concat(filtered);
  }
  return allResults;
}

async function fetchTrailer(id, mediaType) {
  const res = await fetch(`${BASE_URL}/${mediaType}/${id}/videos?api_key=${API_KEY}`);
  const data = await res.json();
  const trailer = data.results.find(video => video.type === "Trailer" && video.site === "YouTube");
  return trailer ? trailer.key : null;
}

function displayList(items, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  items.forEach(item => {
    const img = document.createElement('img');
    img.src = `${IMG_URL}${item.poster_path}`;
    img.alt = item.title || item.name;
    img.onclick = () => goToMovie(item);
    container.appendChild(img);
  });
}

function goToMovie(item) {
  const type = item.media_type || (item.first_air_date ? 'tv' : 'movie');
  saveToWatchHistory({
    id: item.id,
    title: item.title || item.name,
    poster_path: item.poster_path,
    type: type
  });
  window.location.href = `movie.html?id=${item.id}&type=${type}`;
}

function saveToWatchHistory({ title, id, type = 'upload', poster_path = '' }) {
  let history = JSON.parse(localStorage.getItem("watchHistory") || "[]");
  const exists = history.find(item => item.id === id && item.type === type);
  if (!exists) {
    history.unshift({ title, id, type, poster_path, timestamp: Date.now() });
    if (history.length > 20) history = history.slice(0, 20);
    localStorage.setItem("watchHistory", JSON.stringify(history));
  }
}

function loadWeeklyTrending() {
  const container = document.getElementById('weekly-trending-container');
  if (!container) return;
  container.innerHTML = '<p style="color:white;">Loading weekly picks...</p>';
  fetch(`${BASE_URL}/trending/all/week?api_key=${API_KEY}&language=en-US`)
    .then(response => response.json())
    .then(data => {
      container.innerHTML = '';
      const trending = data.results.slice(0, 10);
      trending.forEach(item => {
        const title = item.title || item.name || 'Untitled';
        const poster = item.poster_path
          ? `https://image.tmdb.org/t/p/w300${item.poster_path}`
          : 'images/placeholder.png';
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.innerHTML = `
          <img src="${poster}" alt="${title}" class="movie-poster">
          <p class="movie-title">${title}</p>
        `;
        container.appendChild(card);
      });
    })
    .catch(error => {
      console.error('Failed to load weekly trending:', error);
      container.innerHTML = '<p style="color:red;">Failed to load weekly trending.</p>';
    });
}

function displayBanner(items) {
  bannerItems = items;
  bannerIndex = 0;
  updateBanner();
}

async function updateBanner() {
  if (!bannerItems.length) return;
  const item = bannerItems[bannerIndex];
  const type = item.media_type || (item.first_air_date ? 'tv' : 'movie');
  const trailerKey = await fetchTrailer(item.id, type);

  const banner = document.getElementById('banner-video-container');
  const titleEl = document.getElementById('banner-title');
  banner.innerHTML = '';
  titleEl.textContent = item.title || item.name || 'Untitled';

  if (trailerKey) {
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailerKey}`;
    iframe.allow = 'autoplay; encrypted-media';
    iframe.allowFullscreen = true;
    iframe.frameBorder = '0';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    banner.appendChild(iframe);
  } else {
    const fallbackImg = document.createElement('img');
    fallbackImg.src = IMG_URL + item.backdrop_path;
    fallbackImg.alt = item.title || item.name;
    fallbackImg.style.width = '100%';
    fallbackImg.style.height = '100%';
    fallbackImg.style.objectFit = 'cover';
    banner.appendChild(fallbackImg);
  }
}

function prevBannerTrailer() {
  if (!bannerItems.length) return;
  bannerIndex = (bannerIndex - 1 + bannerItems.length) % bannerItems.length;
  updateBanner();
}

function nextBannerTrailer() {
  if (!bannerItems.length) return;
  bannerIndex = (bannerIndex + 1) % bannerItems.length;
  updateBanner();
}

function watchCurrentBanner() {
  if (!bannerItems.length) return;
  const item = bannerItems[bannerIndex];
  const type = item.media_type || (item.first_air_date ? 'tv' : 'movie');
  fetchTrailer(item.id, type).then(trailerKey => {
    if (trailerKey) {
      window.open(`https://www.youtube.com/watch?v=${trailerKey}`, '_blank');
    }
  });
}

async function init() {
  movieItems = await fetchTrending('movie');
  tvItems = await fetchTrending('tv');
  animeItems = await fetchTrendingAnime();

  // Uploads array must be loaded before this line if not global!
  const uploadItems = (typeof uploads !== 'undefined' && Array.isArray(uploads))
    ? uploads.map(u => ({
        title: u.title,
        id: u.id,
        isUpload: true,
        media_type: 'upload'
      }))
    : [];

  const bannerPool = [...movieItems, ...tvItems, ...uploadItems];
  displayBanner(bannerPool);

  displayList(movieItems, 'movies-list');
  displayList(tvItems, 'tvshows-list');
  displayList(animeItems, 'anime-list');
}

// Watch History modal logic
function openWatchHistoryModal() {
  const modal = document.getElementById("watch-history-modal");
  if (modal) modal.style.display = "flex";
}

function loadWatchHistory() {
  const history = JSON.parse(localStorage.getItem("watchHistory") || "[]");
  const container = document.getElementById("watch-history-list");
  container.innerHTML = '';
  const sorted = history.sort((a, b) => b.timestamp - a.timestamp);

  sorted.forEach(item => {
    const div = document.createElement("div");
    div.classList.add("upload-item");
    div.innerHTML = `
      <div style="text-align:center">
        <img src="${item.poster_path ? IMG_URL + item.poster_path : 'https://via.placeholder.com/120x180?text=No+Image'}"
             alt="${item.title}"
             style="width:120px;border-radius:5px;cursor:pointer"
             onclick="${item.type === 'upload'
               ? `showUploadModal('${item.id}')`
               : `window.location.href='movie.html?id=${item.id}&type=${item.type || 'movie'}'`}">
        <p><strong>${item.title}</strong></p>
        <button onclick="${
          item.type === 'upload'
            ? `showUploadModal('${item.id}')`
            : `goToMovie(${JSON.stringify(item).replace(/"/g, '&quot;')})`
        }">▶ Resume</button>
      </div>
    `;
    container.appendChild(div);
  });
}

// Search modal logic
function openSearchModal() {
  document.getElementById('search-modal').style.display = 'flex';
  document.getElementById('search-input').focus();
}
function closeSearchModal() {
  document.getElementById('search-modal').style.display = 'none';
  document.getElementById('search-results').innerHTML = '';
}
async function searchTMDB() {
  const query = document.getElementById('search-input').value.trim();
  const container = document.getElementById('search-results');
  container.innerHTML = '';
  if (!query) return;

  const tmdbSection = document.createElement('div');
  const tmdbHeader = document.createElement('h3');
  tmdbHeader.textContent = '🎬 Search Results from TMDB';
  tmdbHeader.style.margin = '10px 0';
  tmdbSection.appendChild(tmdbHeader);

  const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
  const data = await res.json();
  const tmdbResults = data.results.filter(item => item.poster_path);

  tmdbResults.forEach(item => {
    const img = document.createElement('img');
    img.src = `${IMG_URL}${item.poster_path}`;
    img.alt = item.title || item.name;
    img.style.width = '120px';
    img.style.margin = '5px';
    img.style.borderRadius = '5px';
    img.style.cursor = 'pointer';
    img.onclick = () => {
      closeSearchModal();
      goToMovie(item);
    };
    tmdbSection.appendChild(img);
  });

  if (tmdbResults.length > 0) container.appendChild(tmdbSection);

  // Uploaded movies section
  if (typeof uploads !== 'undefined' && Array.isArray(uploads)) {
    const uploadedSection = document.createElement('div');
    const uploadHeader = document.createElement('h3');
    uploadHeader.textContent = '📁 My Uploaded Movies';
    uploadHeader.style.margin = '20px 0';
    uploadedSection.appendChild(uploadHeader);

    uploads.forEach(upload => {
      if (upload.title.toLowerCase().includes(query.toLowerCase())) {
        const div = document.createElement('div');
        div.style.textAlign = 'center';
        div.style.marginTop = '15px';
        div.innerHTML = `
          <img src="https://drive.google.com/thumbnail?id=${upload.id}&sz=w200"
               alt="${upload.title}"
               style="width:120px;border-radius:5px;cursor:pointer"
               onclick="showUploadModal('${upload.id}')">
          <p style="margin: 5px 0; font-size:14px;">
            <strong>${upload.title}</strong><br>
            <span style="font-size:12px; color:#4CAF50;">📁 Free Movie</span>
          </p>
        `;
        uploadedSection.appendChild(div);
      }
    });
    container.appendChild(uploadedSection);
  }
}

// Watch history modal close
function closeModal() {
  document.getElementById('modal').style.display = 'none';
  document.getElementById('modal-video').src = '';
}
function closeUploadModal() {
  document.getElementById('upload-modal').style.display = 'none';
  document.getElementById('upload-video').src = '';
}
window.showUploadModal = typeof showUploadModal !== 'undefined' ? showUploadModal : () => {};
window.closeModal = closeModal;
window.closeUploadModal = closeUploadModal;
window.openSearchModal = openSearchModal;
window.closeSearchModal = closeSearchModal;
window.searchTMDB = searchTMDB;
window.goToMovie = goToMovie;
window.openWatchHistoryModal = openWatchHistoryModal;

document.addEventListener('DOMContentLoaded', async () => {
  await init();
  loadWeeklyTrending();
  loadWatchHistory();

  // Banner controls
  const prevBtn = document.getElementById('prev-trailer');
  const nextBtn = document.getElementById('next-trailer');
  const watchFullBtn = document.getElementById('watch-full');

  if (prevBtn) prevBtn.addEventListener('click', prevBannerTrailer);
  if (nextBtn) nextBtn.addEventListener('click', nextBannerTrailer);
  if (watchFullBtn) watchFullBtn.addEventListener('click', watchCurrentBanner);

  setInterval(updateBanner, 30000); // auto next every 30s
});

// Trigger the banner trailer on homepage load
document.addEventListener("DOMContentLoaded", () => {
  displayBanner();
});
if (typeof API_KEY === 'undefined') {
  var API_KEY = '22d74813ded3fecbe3ef632b4814ae3a';
}


async function getTrendingTrailerAndPlay() {
  try {
    const trendingRes = await fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}`);
    const trendingData = await trendingRes.json();

    const filteredItems = trendingData.results.filter(item => item.id);
    if (filteredItems.length === 0) return;

    const randomItem = filteredItems[Math.floor(Math.random() * filteredItems.length)];
    const mediaId = randomItem.id;
    const title = randomItem.title;

    const videoRes = await fetch(`https://api.themoviedb.org/3/movie/${mediaId}/videos?api_key=${API_KEY}`);
    const videoData = await videoRes.json();

    const trailer = videoData.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
    if (!trailer) return;

    const videoId = trailer.key;

    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}`;
    iframe.allow = 'autoplay; encrypted-media';
    iframe.allowFullscreen = true;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = '0';

    const container = document.getElementById('banner-video-container');
    if (container) {
      container.innerHTML = '';
      container.appendChild(iframe);
    }

    const titleElement = document.getElementById('banner-title');
    if (titleElement) {
      titleElement.textContent = title;
    }

  } catch (error) {
    console.error('Banner trailer error:', error);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  getTrendingTrailerAndPlay(); // This will call loadHomeContent()

  // Bind Prev/Next Trailer buttons
  const prevBtn = document.getElementById('prev-trailer');
  const nextBtn = document.getElementById('next-trailer');
  const watchFullBtn = document.getElementById('watch-full');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      displayBanner(currentBannerIndex - 1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      displayBanner(currentBannerIndex + 1);
    });
  }

  // Bind Watch Full button
  if (watchFullBtn) {
    watchFullBtn.addEventListener('click', () => {
      const item = combinedItems[currentBannerIndex];
      if (!item) return;

      if (item.isUpload) {
        // Uploaded movie: open modal
        showUploadModal(item.id);
      } else {
        // TMDB movie or TV show: redirect to movie.html
        const id = item.id;
        const type = item.media_type || (item.first_air_date ? 'tv' : 'movie');
        window.location.href = `movie.html?id=${id}&type=${type}`;
      }
    });
  }
});

// Make sure these functions are accessible globally if needed
window.goToMovie = goToMovie;
window.showUploadModal = showUploadModal;
