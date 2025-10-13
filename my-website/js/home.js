// Movies-J Home.js - Netflix Style Version

const API_KEY = '22d74813ded3fecbe3ef632b4814ae3a';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500'; // Changed to w500 for better quality posters

let movieItems = [];
let tvItems = [];
let animeItems = [];

// Fetch data from TMDB
async function fetchTrending(type) {
  const res = await fetch(`${BASE_URL}/trending/${type}/week?api_key=${API_KEY}`);
  const data = await res.json();
  return data.results;
}

async function fetchTrendingAnime() {
  let allResults = [];
  // Fetch a few pages to get enough anime content
  for (let page = 1; page <= 3; page++) {
    const res = await fetch(`${BASE_URL}/discover/tv?api_key=${API_KEY}&with_keywords=210024|287501&with_genres=16&page=${page}`);
    const data = await res.json();
    allResults = allResults.concat(data.results);
  }
  return allResults;
}

/**
 * ✅ IN-EDIT NA FUNCTION PARA AYUSIN ANG POSTERS
 * This function now wraps each image in a div.movie-card
 * to ensure all posters have uniform size.
 */
function displayList(items, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    items.forEach(item => {
        if (item.poster_path) {
            // Gumawa ng card container para sa bawat poster
            const movieCard = document.createElement('div');
            movieCard.className = 'movie-card';
            movieCard.onclick = () => goToMovie(item); // Ilipat ang onclick sa buong card

            // Gumawa ng image sa loob ng card
            const img = document.createElement('img');
            img.src = `${IMG_URL}${item.poster_path}`;
            img.alt = item.title || item.name;
            img.loading = 'lazy'; // Improve page load speed

            // Ipasok ang image sa card, at ang card sa listahan
            movieCard.appendChild(img);
            container.appendChild(movieCard);
        }
    });
}


// Navigate to the movie details page and save to history
function goToMovie(item) {
  const type = item.media_type || (item.first_air_date ? 'tv' : 'movie');
  saveToWatchHistory({
    id: item.id,
    title: item.title || item.name,
    poster_path: item.poster_path,
    type: type
  });
  // Ensure you have a movie.html file to handle this
  window.location.href = `movie.html?id=${item.id}&type=${type}`;
}

// Save item to localStorage watch history
function saveToWatchHistory(item) {
  let history = JSON.parse(localStorage.getItem("watchHistory") || "[]");
  // Remove existing entry to move it to the front
  history = history.filter(histItem => !(histItem.id === item.id && histItem.type === item.type));
  // Add to the front
  history.unshift({ ...item, timestamp: Date.now() });
  // Keep history limited to 20 items
  if (history.length > 20) history = history.slice(0, 20);
  localStorage.setItem("watchHistory", JSON.stringify(history));
}

// Main function to initialize the page content
async function init() {
  try {
    movieItems = await fetchTrending('movie');
    tvItems = await fetchTrending('tv');
    animeItems = await fetchTrendingAnime();

    displayList(movieItems, 'movies-list');
    displayList(tvItems, 'tvshows-list');
    displayList(animeItems, 'anime-list');
  } catch (error) {
    console.error("Failed to initialize page:", error);
  }
}

// --- MODAL & SEARCH LOGIC --- (Mostly unchanged)

function openWatchHistoryModal() {
  const modal = document.getElementById("watch-history-modal");
  if (modal) {
    loadWatchHistory();
    modal.style.display = "flex";
  }
}

function loadWatchHistory() {
    const history = JSON.parse(localStorage.getItem("watchHistory") || "[]");
    const container = document.getElementById("watch-history-list");
    if(!container) return;
    container.innerHTML = '';

    if(history.length === 0){
        container.innerHTML = '<p style="color:grey; text-align:center;">No watch history yet.</p>';
        return;
    }

    history.forEach(item => {
        const div = document.createElement('div');
        div.className = 'movie-card'; // Re-use movie-card style
        div.style.width = '120px'; // Smaller size for modal
        div.onclick = () => goToMovie(item);
        div.innerHTML = `<img src="${IMG_URL}${item.poster_path}" alt="${item.title}" loading="lazy">`;
        container.appendChild(div);
    });
}

function openSearchModal() {
  const modal = document.getElementById('search-modal');
  if(modal) {
    modal.style.display = 'flex';
    document.getElementById('search-input').focus();
  }
}
function closeSearchModal() {
  const modal = document.getElementById('search-modal');
  if(modal) {
    modal.style.display = 'none';
    document.getElementById('search-results').innerHTML = '';
    document.getElementById('search-input').value = '';
  }
}
async function searchTMDB() {
  const query = document.getElementById('search-input').value.trim();
  const container = document.getElementById('search-results');
  container.innerHTML = '';
  if (!query) return;

  const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
  const data = await res.json();
  const results = data.results.filter(item => item.poster_path && (item.media_type === 'movie' || item.media_type === 'tv'));

  results.forEach(item => {
    const div = document.createElement('div');
    div.className = 'movie-card';
    div.style.width = '150px';
    div.onclick = () => {
      closeSearchModal();
      goToMovie(item);
    };
    div.innerHTML = `<img src="${IMG_URL}${item.poster_path}" alt="${item.title || item.name}" loading="lazy">`;
    container.appendChild(div);
  });
}

// Global functions for modals
window.openSearchModal = openSearchModal;
window.closeSearchModal = closeSearchModal;
window.searchTMDB = searchTMDB;
window.goToMovie = goToMovie;
window.openWatchHistoryModal = openWatchHistoryModal;
window.closeModal = () => { // Generic close for other modals
    document.querySelectorAll('.modal').forEach(modal => modal.style.display = 'none');
};


// Run initialization script when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);