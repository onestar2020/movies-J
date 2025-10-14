// ✅ js/movie.js (UPDATED: With Premium Server Buttons)

const API_KEY = '22d74813ded3fecbe3ef632b4814ae3a';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';

const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get('id');
const type = urlParams.get('type') || 'movie';

let trailerUrl = ''; 
let currentSeasonNumber = 1;
let currentEpisodeNumber = 1;

document.addEventListener("DOMContentLoaded", async () => {
    const item = await fetchDetails();
    if (item) {
        document.title = item.title || item.name;
        document.getElementById("movie-title").textContent = item.title || item.name;
        document.getElementById("movie-overview").textContent = item.overview;
        
        setupInitialPlayer(item);
        displayCast(item.credits.cast);
        displaySimilar(item.similar.results);
        populateServerSelector(item); // Ito na ang gagawa ng mga bagong buttons

        if (type === 'tv') {
            document.querySelector('.tv-show-browser').style.display = 'block';
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

// IN-UPDATE: Tinanggal ang reference sa .server-note
function setupInitialPlayer(item) {
    const player = document.getElementById("movie-player");

    if (item.videos && item.videos.results && item.videos.results.length > 0) {
        const videos = item.videos.results;
        const bestVideo = videos.find(v => v.type === 'Trailer' && v.official === true && v.site === 'YouTube') || videos.find(v => v.type === 'Trailer' && v.site === 'YouTube') || videos.find(v => v.site === 'YouTube');

        if (bestVideo) {
            trailerUrl = `https://www.youtube.com/embed/${bestVideo.key}?autoplay=1&mute=1&rel=0`;
            player.src = trailerUrl;
            return;
        }
    }

    if (type === 'movie') {
        trailerUrl = '';
        player.src = '';
    }
}

// IN-UPDATE: Kompleto nang pinalitan para gumawa ng buttons
function populateServerSelector(item) {
    const serverButtonsContainer = document.getElementById("server-buttons-container");
    serverButtonsContainer.innerHTML = ''; 

    const servers = window.SERVER_LIST || [];
    
    servers.forEach((server, index) => {
        const serverBtn = document.createElement("button");
        serverBtn.className = 'server-btn';
        serverBtn.textContent = server.displayName;
        serverBtn.dataset.server = server.realName; // Itago ang real name sa data attribute

        serverBtn.addEventListener('click', () => {
            // Alisin ang active class sa lahat ng buttons
            document.querySelectorAll('.server-btn').forEach(btn => btn.classList.remove('active'));
            // Idagdag ang active class sa pinindot na button
            serverBtn.classList.add('active');
            
            updatePlayer(server.realName, item, currentSeasonNumber, currentEpisodeNumber);
        });
        
        serverButtonsContainer.appendChild(serverBtn);

        // Awtomatikong i-select ang unang server kung walang trailer
        if (index === 0 && !trailerUrl) {
            serverBtn.click();
        }
    });
}

function updatePlayer(server, item, season = 1, episode = 1) {
    const player = document.getElementById("movie-player");
    if (!player || !server) return;

    currentSeasonNumber = season;
    currentEpisodeNumber = episode;

    const url = generateEmbedURL(server, { id: item.id, media_type: type, first_air_date: item.first_air_date }, season, episode);
    player.src = url;
}


function createScrollableList(containerId, title, items, renderItemFunc) {
    const container = document.getElementById(containerId);
    if (!container || !items || items.length === 0) {
        if (container) container.style.display = 'none';
        return;
    };
    container.innerHTML = `<h2>${title}</h2>`;
    const listContainer = document.createElement('div');
    listContainer.className = 'extra-list-container';
    const list = document.createElement('div');
    list.className = 'extra-list';
    items.forEach(item => {
        const itemElement = renderItemFunc(item);
        if (itemElement) list.appendChild(itemElement);
    });
    const scrollBtnLeft = document.createElement('button');
    scrollBtnLeft.className = 'scroll-btn left';
    scrollBtnLeft.innerHTML = '&lt;';
    const scrollBtnRight = document.createElement('button');
    scrollBtnRight.className = 'scroll-btn right';
    scrollBtnRight.innerHTML = '&gt;';
    listContainer.appendChild(list);
    listContainer.appendChild(scrollBtnLeft);
    listContainer.appendChild(scrollBtnRight);
    container.appendChild(listContainer);
    scrollBtnLeft.addEventListener('click', () => list.scrollLeft -= list.clientWidth * 0.7);
    scrollBtnRight.addEventListener('click', () => list.scrollLeft += list.clientWidth * 0.7);
}

function displayCast(cast) {
    createScrollableList('cast-list', '🎭 Cast', cast.slice(0, 20), (person) => {
        if (!person.profile_path) return null;
        const personDiv = document.createElement('div');
        personDiv.className = 'cast-item';
        personDiv.innerHTML = `<img src="${IMG_URL}${person.profile_path}" alt="${person.name}" loading="lazy"><p>${person.name}</p>`;
        return personDiv;
    });
}

function displaySimilar(similar) {
    createScrollableList('similar-movies', '🎬 You May Also Like', similar.slice(0, 20), (item) => {
        if (!item.poster_path) return null;
        const itemDiv = document.createElement('div');
        itemDiv.className = 'movie-card'; 
        itemDiv.onclick = () => window.location.href = `movie.html?id=${item.id}&type=${type}`;
        itemDiv.innerHTML = `<img src="${IMG_URL}${item.poster_path}" alt="${item.title || item.name}" loading="lazy"><p class="movie-title">${item.title || item.name}</p>`;
        return itemDiv;
    });
}


// --- TV SHOW LOGIC ---
async function handleTVShow(item) {
    const seasonBtn = document.getElementById('season-selector-btn');
    const seasonMenu = document.getElementById('season-dropdown-menu');
    const selectedSeasonName = document.getElementById('selected-season-name');
    const episodeListContainer = document.getElementById('episode-list-container');

    seasonBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        seasonMenu.style.display = seasonMenu.style.display === 'block' ? 'none' : 'block';
    });
    window.addEventListener('click', () => {
        if (seasonMenu.style.display === 'block') {
            seasonMenu.style.display = 'none';
        }
    });
    
    async function loadEpisodes(seasonNumber) {
        episodeListContainer.innerHTML = '<h3 style="padding: 20px; text-align: center;">Loading episodes...</h3>';
        const res = await fetch(`${BASE_URL}/tv/${id}/season/${seasonNumber}?api_key=${API_KEY}`);
        const data = await res.json();
        episodeListContainer.innerHTML = '';

        if (data.episodes.length === 0) {
            episodeListContainer.innerHTML = '<h3 style="padding: 20px; text-align: center;">No episodes found for this season.</h3>';
            return;
        }

        data.episodes.forEach((ep, index) => {
            const card = document.createElement('div');
            card.className = 'episode-card';
            card.dataset.episodeNumber = ep.episode_number;
            
            card.innerHTML = `
                <img class="episode-thumbnail" src="${ep.still_path ? `https://image.tmdb.org/t/p/w300${ep.still_path}` : (item.backdrop_path ? `https://image.tmdb.org/t/p/w500${item.backdrop_path}` : 'images/logo.png')}" alt="${ep.name}">
                <div class="episode-details">
                    <h3>E${ep.episode_number}: ${ep.name}</h3>
                    <p>${ep.overview || 'No description available.'}</p>
                </div>
            `;

            card.addEventListener('click', () => {
                // IN-UPDATE: Hanapin ang active server button
                const activeServerBtn = document.querySelector('.server-btn.active');
                const selectedServer = activeServerBtn ? activeServerBtn.dataset.server : null;
                
                document.querySelectorAll('.episode-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');

                if (selectedServer) {
                    updatePlayer(selectedServer, item, seasonNumber, ep.episode_number);
                } else if (trailerUrl) {
                    document.getElementById("movie-player").src = trailerUrl;
                }
            });

            episodeListContainer.appendChild(card);
            
            if (index === 0) {
                currentSeasonNumber = seasonNumber;
                currentEpisodeNumber = ep.episode_number;
                // I-click ito pero huwag i-trigger ang player kung wala pang server
                if (document.querySelector('.server-btn.active')) {
                    card.click();
                } else {
                    card.classList.add('active');
                }
            }
        });
    }

    item.seasons.forEach(season => {
        if (season.season_number > 0) {
            const seasonOption = document.createElement('button');
            seasonOption.textContent = season.name;
            seasonOption.addEventListener('click', () => {
                selectedSeasonName.textContent = season.name;
                loadEpisodes(season.season_number);
            });
            seasonMenu.appendChild(seasonOption);
        }
    });

    const firstSeason = item.seasons.find(s => s.season_number > 0);
    if (firstSeason) {
        selectedSeasonName.textContent = firstSeason.name;
        loadEpisodes(firstSeason.season_number);
    } else {
        document.querySelector('.tv-show-browser').innerHTML = '<h3 style="text-align: center; color: #888;">No seasons available for this series.</h3>';
    }
}
