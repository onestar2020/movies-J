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



function updateBanner() {
  if (!bannerItems.length) return;

  const item = bannerItems[bannerIndex];
  const trailerKey = item.trailer;
  const type = item.type || "movie";

  // ✅ Update banner content (example logic — adjust to your layout)
  const banner = document.getElementById("banner");
  const title = item.title || item.name;
  banner.innerHTML = `
    <iframe width="100%" height="400" src="https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0" frameborder="0" allowfullscreen></iframe>
    <h2 style="text-align: center; margin-top: 10px;">${title}</h2>
  `;

  // ✅ Set correct ID & type for "Watch Full" button
  const watchFullBtn = document.getElementById("watch-full");
  watchFullBtn.dataset.id = item.id;
  watchFullBtn.dataset.type = type;
}

// ✅ Function for Watch Full button
function watchCurrentBanner() {
  const watchBtn = document.getElementById("watch-full");
  const id = watchBtn.dataset.id;
  const type = watchBtn.dataset.type || "movie";

  if (id && type) {
    window.location.href = `movie.html?id=${id}&type=${type}`;
  } else {
    alert("Missing movie info.");
  }
}

// ✅ Bind click event once DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  const watchFullBtn = document.getElementById("watch-full");
  if (watchFullBtn) {
    watchFullBtn.addEventListener("click", watchCurrentBanner);
  }
});


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

const bannerPool = [...movieItems, ...tvItems];

// Fetch trailer keys for banner items
const bannerPoolWithTrailers = [];
for (const item of bannerPool) {
  const type = item.media_type || (item.first_air_date ? 'tv' : 'movie');
  const trailerKey = await fetchTrailer(item.id, type);
  if (trailerKey) {
    bannerPoolWithTrailers.push({ ...item, trailer: trailerKey, type });
  }
}

// Optionally: Add uploaded items that have trailers (if supported)
const finalBannerItems = [...bannerPoolWithTrailers, ...uploadItems];

// Show banner
displayBanner(finalBannerItems);


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


