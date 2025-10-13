// js/movie.js (FINAL SECURE VERSION)

const IMG_URL = 'https://image.tmdb.org/t/p/w500'; // OPTIMIZED IMAGE SIZE

const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get('id');
const type = urlParams.get('type') || 'movie';

let autoTesting = false;

// Function to fetch data from TMDB via our Netlify function
async function fetchFromTMDB(endpoint) {
  // BINAGO: Lahat ng fetch ay dito na dadaan
  const res = await fetch(`/.netlify/functions/tmdb?endpoint=${endpoint}`);
  return res.json();
}

async function loadMovieDetails() {
  const data = await fetchFromTMDB(`${type}/${id}`);
  
  // Dynamic Page Title for SEO
  document.title = `${data.title || data.name} - Movies-J`;

  document.getElementById('poster').src = `${IMG_URL}${data.poster_path}`;
  document.getElementById('title').textContent = data.title || data.name;
  document.getElementById('overview').textContent = data.overview;
  
  if (type === 'tv' && data.seasons) {
    setupSeasonSelector(data.seasons);
    document.getElementById('season-episode-selectors').style.display = 'flex';
  }

  // Save to watch history
  if (typeof saveToWatchHistory === 'function') {
    saveToWatchHistory({
      title: data.title || data.name,
      id: id,
      type: type,
      poster_path: data.poster_path
    });
  }
}

async function loadCast() {
  const data = await fetchFromTMDB(`${type}/${id}/credits`);
  const castList = document.getElementById('cast-list');
  castList.innerHTML = '<h3>Cast</h3>';
  data.cast.slice(0, 10).forEach(person => {
    const castMember = document.createElement('div');
    castMember.className = 'cast-member';
    castMember.innerHTML = `
      <img src="${person.profile_path ? IMG_URL + person.profile_path : 'images/placeholder.png'}" alt="${person.name}">
      <p>${person.name}</p>
      <span>as ${person.character}</span>
    `;
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

  data.results.forEach(item => {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.innerHTML = `
      <img src="${IMG_URL}${item.poster_path}" alt="${item.title || item.name}" onclick="location.href='movie.html?id=${item.id}&type=${type}'">
      <p>${item.title || item.name}</p>
    `;
    moviesContainer.appendChild(card);
  });
}

function setupSeasonSelector(seasons) {
  const seasonSelect = document.getElementById("season-select");
  seasons.forEach(season => {
    if (season.season_number > 0) { // Skip "Specials" season
      const option = document.createElement("option");
      option.value = season.season_number;
      option.textContent = `Season ${season.season_number}`;
      seasonSelect.appendChild(option);
    }
  });
  seasonSelect.addEventListener("change", () => loadEpisodes(seasonSelect.value));
  loadEpisodes(seasons[0]?.season_number || 1);
}

async function loadEpisodes(seasonNumber) {
  const episodeSelect = document.getElementById("episode-select");
  episodeSelect.innerHTML = "<option>Loading episodes...</option>";
  const data = await fetchFromTMDB(`tv/${id}/season/${seasonNumber}`);
  episodeSelect.innerHTML = ""; // Clear loading message
  data.episodes.forEach(ep => {
    const option = document.createElement("option");
    option.value = ep.episode_number;
    option.textContent = `E${ep.episode_number}: ${ep.name}`;
    episodeSelect.appendChild(option);
  });
  episodeSelect.addEventListener("change", updatePlayerSource);
}

function updatePlayerSource() {
    const player = document.getElementById("movie-player");
    const season = document.getElementById("season-select").value;
    const episode = document.getElementById("episode-select").value;
    const currentSrc = player.src;
    
    // Check if the current source is one of our embed servers
    if (currentSrc && (currentSrc.includes("vidsrc") || currentSrc.includes("videasy") || currentSrc.includes("autoembed"))) {
        const url = new URL(currentSrc);
        const serverDomain = url.hostname;
        
        let activeServer = '';
        if (serverDomain.includes('vidsrc.cc')) activeServer = 'vidsrc.cc';
        else if (serverDomain.includes('vidsrc.me') || serverDomain.includes('vidsrc.net')) activeServer = 'vidsrc.me';
        else if (serverDomain.includes('videasy.net')) activeServer = 'player.videasy.net';
        else if (serverDomain.includes('autoembed.cc')) activeServer = 'player.autoembed.cc';
        
        if (activeServer && typeof generateEmbedURL === 'function') {
            player.src = generateEmbedURL(activeServer, { id, media_type: type }, season, episode);
        }
    }
}


document.addEventListener("DOMContentLoaded", () => {
  loadMovieDetails();
  loadCast();
  loadSimilar();
  
  const startBtn = document.getElementById("start-test-btn");
  const stopBtn = document.getElementById("stop-test-btn");

  if(startBtn) startBtn.onclick = () => {
    autoTesting = true;
    startBtn.disabled = true;
    if(stopBtn) stopBtn.style.display = 'inline-block';
    if(typeof initPlayerWithFallback === 'function') initPlayerWithFallback();
  };
  
  if(stopBtn) stopBtn.onclick = () => {
    autoTesting = false;
    document.getElementById("active-server-label").textContent = "⛔ Auto Find Cancelled.";
    if(startBtn) startBtn.disabled = false;
    stopBtn.style.display = 'none';
  };
});