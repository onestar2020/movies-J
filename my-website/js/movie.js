// ✅ js/movie.js (Updated to handle Display Names)

const API_KEY = '22d74813ded3fecbe3ef632b4814ae3a';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';

const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get('id');
const type = urlParams.get('type') || 'movie';

let trailerUrl = ''; 

document.addEventListener("DOMContentLoaded", async () => {
    const item = await fetchDetails();
    if (item) {
        document.title = item.title || item.name;
        document.getElementById("movie-title").textContent = item.title || item.name;
        document.getElementById("movie-overview").textContent = item.overview;
        
        if (item.videos && item.videos.results.length > 0) {
            displayTrailer(item.videos.results);
        } else {
            document.getElementById('movie-player').style.display = 'none';
        }

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
        const res = await fetch(`${BASE_URL}/${type}/${id}?api_key=${API_KEY}&append_to_response=credits,similar,videos`);
        const data = await res.json();
        return data;
    } catch (error) {
        console.error("Failed to fetch details:", error);
        return null;
    }
}

function displayTrailer(videos) {
    const player = document.getElementById("movie-player");
    const officialTrailer = videos.find(video => video.site === 'YouTube' && video.type === 'Trailer');
    
    if (officialTrailer) {
        trailerUrl = `https://www.youtube.com/embed/${officialTrailer.key}?autoplay=1&mute=1`;
        player.src = trailerUrl;
    } else {
        const anyVideo = videos.find(video => video.site === 'YouTube');
        if (anyVideo) {
            trailerUrl = `https://www.youtube.com/embed/${anyVideo.key}?autoplay=1&mute=1`;
            player.src = trailerUrl;
        }
    }
}

function populateServerSelector(item) {
    const serverSelect = document.getElementById("server-select");
    serverSelect.innerHTML = ''; 

    const placeholderOption = document.createElement("option");
    placeholderOption.value = "";
    placeholderOption.textContent = "--- Select a Server to Watch Full Movie ---";
    serverSelect.appendChild(placeholderOption);

    const servers = window.SERVER_LIST || [];
    
    // ✅ BINAGO ANG PART NA ITO
    servers.forEach(server => {
        const option = document.createElement("option");
        // Ang 'value' ay ang totoong pangalan para sa code
        option.value = server.realName; 
        // Ang ipapakita sa user ay ang display name
        option.textContent = server.displayName; 
        serverSelect.appendChild(option);
    });
    
    serverSelect.addEventListener("change", () => {
        const selectedServer = serverSelect.value;
        const season = document.getElementById("season-select")?.value || 1;
        const episode = document.getElementById("episode-select")?.value || 1;
        
        if (selectedServer) {
            updatePlayer(selectedServer, item, season, episode);
        } else {
            const player = document.getElementById("movie-player");
            if (trailerUrl) player.src = trailerUrl;
        }
    });
}

function updatePlayer(server, item, season = 1, episode = 1) {
    const player = document.getElementById("movie-player");
    if (!player || !server) return;
    const url = generateEmbedURL(server, { id: item.id, media_type: type, first_air_date: item.first_air_date }, season, episode);
    player.src = url;
}

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

function displaySimilar(similar) {
    const similarContainer = document.getElementById("similar-movies");
    similarContainer.innerHTML = '<h2>🎬 You May Also Like</h2>';
    const similarList = document.createElement('div');
    similarList.className = 'extra-list';

    similar.slice(0, 10).forEach(item => {
        if(item.poster_path) {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'movie-card'; 
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

// --- TV Show Specific Logic (Walang binago dito) ---
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
    }

    seasonSelect.addEventListener("change", () => loadEpisodes(seasonSelect.value));
    episodeSelect.addEventListener("change", () => {
        const selectedServer = document.getElementById("server-select").value;
        if(selectedServer){
             updatePlayer(selectedServer, item, seasonSelect.value, episodeSelect.value);
        }
    });

    if (item.seasons.length > 0) {
        loadEpisodes(item.seasons.find(s => s.season_number > 0)?.season_number || 1);
    }
}