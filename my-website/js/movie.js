// ✅ IN-UPDATE NA MOVIE.JS PARA SA MANUAL SERVER SELECTION

const API_KEY = '22d74813ded3fecbe3ef632b4814ae3a';
const BASE_URL = 'https://api.themoviedb.org/3';

const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get('id');
const type = urlParams.get('type') || 'movie';

document.addEventListener("DOMContentLoaded", async () => {
    // Fetch movie details first
    const item = await fetchDetails();
    if (item) {
        document.title = item.title || item.name;
        document.getElementById("movie-title").textContent = item.title || item.name;
        document.getElementById("movie-overview").textContent = item.overview;
        // ... (you can add more details like rating, cast here) ...

        // Populate server dropdown
        populateServerSelector(item);

        // If it's a TV show, handle seasons and episodes
        if (type === 'tv') {
            document.querySelector('.season-episode-selectors').style.display = 'flex';
            handleTVShow(item);
        }
    }
});

async function fetchDetails() {
    try {
        const res = await fetch(`${BASE_URL}/${type}/${id}?api_key=${API_KEY}`);
        const data = await res.json();
        return data;
    } catch (error) {
        console.error("Failed to fetch details:", error);
        return null;
    }
}

function populateServerSelector(item) {
    const serverSelect = document.getElementById("server-select");
    serverSelect.innerHTML = ''; // Clear existing options

    // Get the server list (make sure servers.js is loaded)
    const servers = window.SERVER_LIST || [];

    servers.forEach(server => {
        const option = document.createElement("option");
        option.value = server;
        option.textContent = server;
        serverSelect.appendChild(option);
    });

    // Load the first server by default
    updatePlayer(servers[0], item);

    // Add event listener to change server on selection
    serverSelect.addEventListener("change", () => {
        const selectedServer = serverSelect.value;
        const season = document.getElementById("season-select")?.value || 1;
        const episode = document.getElementById("episode-select")?.value || 1;
        updatePlayer(selectedServer, item, season, episode);
    });
}

function updatePlayer(server, item, season = 1, episode = 1) {
    const player = document.getElementById("movie-player");
    if (!player || !server) return;

    // Generate URL (make sure embed.js is loaded)
    const url = generateEmbedURL(server, { id: item.id, media_type: type, first_air_date: item.first_air_date }, season, episode);
    player.src = url;
}

// --- TV Show Specific Logic ---
async function handleTVShow(item) {
    const seasonSelect = document.getElementById("season-select");
    const episodeSelect = document.getElementById("episode-select");
    
    // Populate seasons
    item.seasons.forEach(season => {
        if (season.season_number > 0) { // Exclude season 0 specials if any
            const option = document.createElement("option");
            option.value = season.season_number;
            option.textContent = season.name;
            seasonSelect.appendChild(option);
        }
    });

    // Function to load episodes for a given season
    async function loadEpisodes(seasonNumber) {
        episodeSelect.innerHTML = "";
        const res = await fetch(`${BASE_URL}/tv/${id}/season/${seasonNumber}?api_key=${API_KEY}`);
        const data = await res.json();
        data.episodes.forEach(ep => {
            const option = document.createElement("option");
            option.value = ep.episode_number;
            option.textContent = `E${ep.episode_number}: ${ep.name}`;
            episodeSelect.appendChild(option);
        });
        // Load the first episode of the selected season
        updatePlayer(document.getElementById("server-select").value, item, seasonNumber, 1);
    }

    // Event listeners for season/episode change
    seasonSelect.addEventListener("change", () => loadEpisodes(seasonSelect.value));
    episodeSelect.addEventListener("change", () => {
        updatePlayer(document.getElementById("server-select").value, item, seasonSelect.value, episodeSelect.value);
    });

    // Load episodes for the first season initially
    if (item.seasons.length > 0) {
        loadEpisodes(item.seasons.find(s => s.season_number > 0)?.season_number || 1);
    }
}