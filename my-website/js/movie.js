// ✅ FINAL MOVIE.JS WITH CAST AND SIMILAR MOVIES

const API_KEY = '22d74813ded3fecbe3ef632b4814ae3a';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';

const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get('id');
const type = urlParams.get('type') || 'movie';

document.addEventListener("DOMContentLoaded", async () => {
    const item = await fetchDetails();
    if (item) {
        // Populate Main Details
        document.title = item.title || item.name;
        document.getElementById("movie-title").textContent = item.title || item.name;
        document.getElementById("movie-overview").textContent = item.overview;
        
        // ✅ IBINALIK ANG PAG-DISPLAY NG CAST AT SIMILAR MOVIES
        displayCast(item.credits.cast);
        displaySimilar(item.similar.results);

        // Populate Server Dropdown
        populateServerSelector(item);

        if (type === 'tv') {
            document.querySelector('.season-episode-selectors').style.display = 'flex';
            handleTVShow(item);
        }
    }
});

async function fetchDetails() {
    try {
        // ✅ Dinagdagan ng append_to_response para makuha ang cast at similar
        const res = await fetch(`${BASE_URL}/${type}/${id}?api_key=${API_KEY}&append_to_response=credits,similar`);
        const data = await res.json();
        return data;
    } catch (error) {
        console.error("Failed to fetch details:", error);
        return null;
    }
}

function populateServerSelector(item) {
    const serverSelect = document.getElementById("server-select");
    serverSelect.innerHTML = '';
    const servers = window.SERVER_LIST || [];
    servers.forEach(server => {
        const option = document.createElement("option");
        option.value = server;
        option.textContent = server;
        serverSelect.appendChild(option);
    });
    updatePlayer(servers[0], item);
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
    const url = generateEmbedURL(server, { id: item.id, media_type: type, first_air_date: item.first_air_date }, season, episode);
    player.src = url;
}

// ✅ BAGONG FUNCTION PARA SA CAST
function displayCast(cast) {
    const castContainer = document.getElementById("cast-list");
    castContainer.innerHTML = '<h2>🎭 Cast</h2>';
    const castList = document.createElement('div');
    castList.className = 'extra-list';
    
    cast.slice(0, 10).forEach(person => {
        if(person.profile_path) {
            const personDiv = document.createElement('div');
            personDiv.className = 'cast-item';
            personDiv.innerHTML = `
                <img src="${IMG_URL}${person.profile_path}" alt="${person.name}" loading="lazy">
                <p>${person.name}</p>
            `;
            castList.appendChild(personDiv);
        }
    });
    castContainer.appendChild(castList);
}

// ✅ BAGONG FUNCTION PARA SA SIMILAR MOVIES
function displaySimilar(similar) {
    const similarContainer = document.getElementById("similar-movies");
    similarContainer.innerHTML = '<h2>🎬 You May Also Like</h2>';
    const similarList = document.createElement('div');
    similarList.className = 'extra-list';

    similar.slice(0, 10).forEach(item => {
        if(item.poster_path) {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'movie-card'; // Re-use the movie-card style
            itemDiv.onclick = () => window.location.href = `movie.html?id=${item.id}&type=${type}`;
            itemDiv.innerHTML = `
                <img src="${IMG_URL}${item.poster_path}" alt="${item.title || item.name}" loading="lazy">
                <p class="movie-title">${item.title || item.name}</p>
            `;
            similarList.appendChild(itemDiv);
        }
    });
    similarContainer.appendChild(similarList);
}

// --- TV Show Specific Logic ---
async function handleTVShow(item) {
    const seasonSelect = document.getElementById("season-select");
    const episodeSelect = document.getElementById("episode-select");
    
    item.seasons.forEach(season => {
        if (season.season_number > 0) {
            const option = document.createElement("option");
            option.value = season.season_number;
            option.textContent = season.name;
            seasonSelect.appendChild(option);
        }
    });

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
        updatePlayer(document.getElementById("server-select").value, item, seasonNumber, 1);
    }

    seasonSelect.addEventListener("change", () => loadEpisodes(seasonSelect.value));
    episodeSelect.addEventListener("change", () => {
        updatePlayer(document.getElementById("server-select").value, item, seasonSelect.value, episodeSelect.value);
    });

    if (item.seasons.length > 0) {
        loadEpisodes(item.seasons.find(s => s.season_number > 0)?.season_number || 1);
    }
}