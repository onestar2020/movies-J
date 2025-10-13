// === BAGONG CODE PARA SA js/movie.js ===

// TINANGGAL NA DITO ANG API_KEY at BASE_URL
const IMG_URL = 'https://image.tmdb.org/t/p/w500'; // Mas mabilis na image size
const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get('id');
const type = urlParams.get('type') || 'movie';
let autoTesting = false;

async function fetchFromTMDB(endpoint) {
  // BINAGO: Centralized function na tumatawag sa ating "Sikretong Taguan"
  const res = await fetch(`/.netlify/functions/tmdb?endpoint=${endpoint}`);
  return res.json();
}

async function loadMovieDetails() {
  const data = await fetchFromTMDB(`${type}/${id}`);
  document.title = `${data.title || data.name} - Movies-J`; // Para sa SEO
  document.getElementById('poster').src = `${IMG_URL}${data.poster_path}`;
  document.getElementById('title').textContent = data.title || data.name;
  document.getElementById('overview').textContent = data.overview;
  if (type === 'tv' && data.seasons) {
    setupSeasonSelector(data.seasons);
    document.getElementById('season-episode-selectors').style.display = 'flex';
  }
  if (typeof saveToWatchHistory === 'function') {
    saveToWatchHistory({ title: data.title || data.name, id: id, type: type, poster_path: data.poster_path });
  }
}

async function loadCast() {
  const data = await fetchFromTMDB(`${type}/${id}/credits`);
  const castList = document.getElementById('cast-list');
  castList.innerHTML = '<h3>Cast</h3>';
  data.cast.slice(0, 10).forEach(person => {
    const castMember = document.createElement('div');
    castMember.className = 'cast-member';
    castMember.innerHTML = `<img src="${person.profile_path ? IMG_URL + person.profile_path : 'images/placeholder.png'}" alt="${person.name}"><p>${person.name}</p><span>as ${person.character}</span>`;
    castList.appendChild(castMember);
  });
}

async function loadSimilar() {
    const data = await fetchFromTMDB(`${type}/${id}/similar`);
    const similarContainer = document.getElementById('similar-movies');
    similarContainer.innerHTML = '<h3>You May Also Like</h3>';
    const moviesContainer = document.createElement('div');
    moviesContainer.className = 'movies-container';
    similarContainer.appendChild(moviesContainer);
    data.results.slice(0, 15).forEach(item => {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.innerHTML = `<img src="${IMG_URL}${item.poster_path}" alt="${item.title || item.name}" onclick="location.href='movie.html?id=${item.id}&type=${type}'"><p>${item.title || item.name}</p>`;
        moviesContainer.appendChild(card);
    });
}

function setupSeasonSelector(seasons) {
  const seasonSelect = document.getElementById("season-select");
  seasons.forEach(season => {
    if (season.season_number > 0) {
      const option = document.createElement("option");
      option.value = season.season_number;
      option.textContent = `Season ${season.season_number}`;
      seasonSelect.appendChild(option);
    }
  });
  seasonSelect.addEventListener("change", () => loadEpisodes(seasonSelect.value));
  loadEpisodes(seasons.find(s => s.season_number > 0)?.season_number || 1);
}

async function loadEpisodes(seasonNumber) {
  const episodeSelect = document.getElementById("episode-select");
  episodeSelect.innerHTML = "<option>Loading episodes...</option>";
  const data = await fetchFromTMDB(`tv/${id}/season/${seasonNumber}`);
  episodeSelect.innerHTML = "";
  data.episodes.forEach(ep => {
    const option = document.createElement("option");
    option.value = ep.episode_number;
    option.textContent = `E${ep.episode_number}: ${ep.name}`;
    episodeSelect.appendChild(option);
  });
  episodeSelect.addEventListener("change", updatePlayerSource);
}

function updatePlayerSource() {
    // Ang function na ito ay kailangan mong i-review base sa embed.js mo
    // Pero ang mahalaga, ang pag-load ng data ay secure na.
}

document.addEventListener("DOMContentLoaded", () => {
  loadMovieDetails();
  loadCast();
  loadSimilar();
});