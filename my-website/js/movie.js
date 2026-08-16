// ✅ js/movie.js (SUPER SECURE VERSION + NEXT EPISODE BUTTON + SAFE METADATA RENDERING)

const BASE_URL = 'https://movies-j-api-proxy.jayjovendinawanao2020.workers.dev'; 
const IMG_URL = 'https://image.tmdb.org/t/p/w500';

const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get('id');
const type = urlParams.get('type') || 'movie';

let trailerUrl = ''; 
let currentSeasonNumber = 1;
let currentEpisodeNumber = 1;
let currentItemData = null;

document.addEventListener("DOMContentLoaded", async () => {
    if (!id) {
        console.error("No ID provided in URL parameters.");
        return;
    }

    const item = await fetchDetails();
    if (item) {
        currentItemData = item;

        // 1. Update Title at Metadata / Overview
        const displayTitle = item.title || item.name || "Now Playing";
        document.title = displayTitle;

        const titleElem = document.getElementById("movie-title");
        if (titleElem) titleElem.textContent = displayTitle;

        const overviewElem = document.getElementById("movie-overview");
        if (overviewElem) {
            overviewElem.textContent = item.overview && item.overview.trim() !== "" 
                ? item.overview 
                : "No overview available.";
        }

        // Render Meta Info (Runtime, Release Date, Rating, Country)
        renderMetadata(item);

        // 2. Setup Player & Server Selector
        setupInitialPlayer(item);
        populateServerSelector(item);

        // 3. Render Cast & Similar Items (Safe Checks)
        const castList = item.credits && Array.isArray(item.credits.cast) ? item.credits.cast : [];
        displayCast(castList);

        const similarList = item.similar && Array.isArray(item.similar.results) ? item.similar.results : [];
        displaySimilar(similarList);

        // 4. Collection Sidebar
        if (item.belongs_to_collection && item.belongs_to_collection.id) {
            handleCollection(item.belongs_to_collection.id);
        }

        // 5. TV Show Specific Handling
        if (type === 'tv') {
            const tvBrowser = document.querySelector('.tv-show-browser');
            if (tvBrowser) tvBrowser.style.display = 'block';
            handleTVShow(item);
            setupNextEpisodeButton();
        }
    }
});

async function fetchDetails() {
    try {
        const res = await fetch(`${BASE_URL}/${type}/${id}?append_to_response=credits,similar,videos`);
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        return data;
    } catch (error) {
        console.error("Failed to fetch details:", error);
        return null;
    }
}

function renderMetadata(item) {
    // Runtime
    const runtimeElem = document.getElementById("movie-runtime") || document.querySelector(".meta-runtime");
    if (runtimeElem) {
        const runtime = item.runtime || (item.episode_run_time && item.episode_run_time[0]);
        runtimeElem.textContent = runtime ? `${runtime} min` : "N/A";
    }

    // Release Date
    const releaseElem = document.getElementById("movie-release") || document.querySelector(".meta-release");
    if (releaseElem) {
        const date = item.release_date || item.first_air_date;
        releaseElem.textContent = date || "N/A";
    }

    // Rating
    const ratingElem = document.getElementById("movie-rating") || document.querySelector(".meta-rating");
    if (ratingElem) {
        ratingElem.textContent = item.vote_average && item.vote_average > 0 
            ? `${item.vote_average.toFixed(1)} / 10` 
            : "Unrated";
    }

    // Country
    const countryElem = document.getElementById("movie-country") || document.querySelector(".meta-country");
    if (countryElem) {
        const countries = item.production_countries && item.production_countries.length > 0
            ? item.production_countries.map(c => c.name || c.iso_3166_1).join(", ")
            : (item.origin_country ? item.origin_country.join(", ") : "Global");
        countryElem.textContent = countries || "Global";
    }
}

function setupInitialPlayer(item) {
    const player = document.getElementById("movie-player");
    if (!player) return;

    if (item.videos && item.videos.results && item.videos.results.length > 0) {
        const videos = item.videos.results;
        const bestVideo = videos.find(v => v.type === 'Trailer' && v.official === true && v.site === 'YouTube') ||
                          videos.find(v => v.type === 'Trailer' && v.site === 'YouTube') ||
                          videos.find(v => v.site === 'YouTube');

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

function populateServerSelector(item) {
    const serverButtonsContainer = document.getElementById("server-buttons-container");
    if (!serverButtonsContainer) return;
    
    serverButtonsContainer.innerHTML = ''; 

    const servers = window.SERVER_LIST || [];
    
    servers.forEach((server, index) => {
        const serverBtn = document.createElement("button");
        serverBtn.className = 'server-btn';
        serverBtn.textContent = server.displayName;
        serverBtn.dataset.server = server.realName; 

        serverBtn.addEventListener('click', () => {
            document.querySelectorAll('.server-btn').forEach(btn => btn.classList.remove('active'));
            serverBtn.classList.add('active');
            
            updatePlayer(server.realName, item, currentSeasonNumber, currentEpisodeNumber);
        });
        
        serverButtonsContainer.appendChild(serverBtn);

        if (index === 0 && !trailerUrl) {
            serverBtn.click();
        }
    });
}

function updatePlayer(server, item, season = 1, episode = 1) {
    const player = document.getElementById("movie-player");
    if (!player || !server || typeof generateEmbedURL !== "function") return;

    currentSeasonNumber = season;
    currentEpisodeNumber = episode;

    const url = generateEmbedURL(server, { id: item.id, media_type: type, first_air_date: item.first_air_date }, season, episode);
    player.src = url;
}

function setupNextEpisodeButton() {
    const tvBrowserLabel = document.querySelector('.tv-show-browser label');
    if (!tvBrowserLabel) return;

    tvBrowserLabel.style.display = 'flex';
    tvBrowserLabel.style.justifyContent = 'space-between';
    tvBrowserLabel.style.alignItems = 'center';

    let nextBtn = document.getElementById('next-ep-btn');
    if (!nextBtn) {
        nextBtn = document.createElement('button');
        nextBtn.id = 'next-ep-btn';
        nextBtn.innerHTML = 'Next Ep <i class="fas fa-step-forward"></i>';
        nextBtn.style = "background: #222; border: 1px solid #444; color: #fff; padding: 5px 12px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; font-weight: bold; transition: all 0.3s ease;";
        
        nextBtn.onmouseover = () => { nextBtn.style.background = "#e50914"; nextBtn.style.borderColor = "#e50914"; };
        nextBtn.onmouseout = () => { nextBtn.style.background = "#222"; nextBtn.style.borderColor = "#444"; };

        nextBtn.addEventListener('click', () => {
            const currentActive = document.querySelector('.episode-card.active');
            if (currentActive && currentActive.nextElementSibling && currentActive.nextElementSibling.classList.contains('episode-card')) {
                currentActive.nextElementSibling.click();
                currentActive.nextElementSibling.scrollIntoView({ behavior: 'smooth', block: 'center' });
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                alert("End of season! Please select the next season.");
            }
        });

        tvBrowserLabel.appendChild(nextBtn);
    }

    const oldContainer = document.getElementById('next-ep-container');
    if (oldContainer) oldContainer.remove();
}

function createScrollableList(containerId, title, items, renderItemFunc) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!items || items.length === 0) {
        container.innerHTML = `<h2>${title}</h2><p style="color: #888; font-size: 0.9rem; padding: 10px 0;">No info available.</p>`;
        return;
    }

    container.style.display = 'block';
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
        if (!person || !person.name) return null;
        const profileImg = person.profile_path ? `${IMG_URL}${person.profile_path}` : 'images/logo-192.png';
        const personDiv = document.createElement('div');
        personDiv.className = 'cast-item';
        personDiv.innerHTML = `<img src="${profileImg}" alt="${person.name}" loading="lazy"><p>${person.name}</p>`;
        return personDiv;
    });
}

function displaySimilar(similar) {
    createScrollableList('similar-movies', '🎬 You May Also Like', similar.slice(0, 20), (item) => {
        if (!item || !item.id) return null;
        const posterImg = item.poster_path ? `${IMG_URL}${item.poster_path}` : 'images/logo-192.png';
        const itemDiv = document.createElement('div');
        itemDiv.className = 'movie-card'; 
        itemDiv.onclick = () => window.location.href = `movie.html?id=${item.id}&type=${type}`;
        itemDiv.innerHTML = `<img src="${posterImg}" alt="${item.title || item.name}" loading="lazy"><p class="movie-title">${item.title || item.name}</p>`;
        return itemDiv;
    });
}

async function handleTVShow(item) {
    const seasonBtn = document.getElementById('season-selector-btn');
    const seasonMenu = document.getElementById('season-dropdown-menu');
    const selectedSeasonName = document.getElementById('selected-season-name');
    const episodeListContainer = document.getElementById('episode-list-container');

    if (!seasonBtn || !seasonMenu || !episodeListContainer || !item.seasons) return;

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
        try {
            const res = await fetch(`${BASE_URL}/tv/${id}/season/${seasonNumber}`);
            const data = await res.json();
            episodeListContainer.innerHTML = '';

            if (!data.episodes || data.episodes.length === 0) {
                episodeListContainer.innerHTML = '<h3 style="padding: 20px; text-align: center;">No episodes found for this season.</h3>';
                return;
            }

            data.episodes.forEach((ep, index) => {
                const card = document.createElement('div');
                card.className = 'episode-card';
                card.dataset.episodeNumber = ep.episode_number;
                
                const thumbImg = ep.still_path 
                    ? `https://image.tmdb.org/t/p/w300${ep.still_path}` 
                    : (item.backdrop_path ? `https://image.tmdb.org/t/p/w500${item.backdrop_path}` : 'images/logo-192.png');

                card.innerHTML = `
                    <img class="episode-thumbnail" src="${thumbImg}" alt="${ep.name || 'Episode'}">
                    <div class="episode-details">
                        <h3>E${ep.episode_number}: ${ep.name || 'Episode ' + ep.episode_number}</h3>
                        <p>${ep.overview || 'No description available.'}</p>
                    </div>
                `;

                card.addEventListener('click', () => {
                    const activeServerBtn = document.querySelector('.server-btn.active');
                    const selectedServer = activeServerBtn ? activeServerBtn.dataset.server : null;
                    
                    document.querySelectorAll('.episode-card').forEach(c => c.classList.remove('active'));
                    card.classList.add('active');

                    if (selectedServer) {
                        updatePlayer(selectedServer, item, seasonNumber, ep.episode_number);
                    } else if (trailerUrl) {
                        const p = document.getElementById("movie-player");
                        if (p) p.src = trailerUrl;
                    }
                });

                episodeListContainer.appendChild(card);
                
                if (index === 0) {
                    currentSeasonNumber = seasonNumber;
                    currentEpisodeNumber = ep.episode_number;
                    if (document.querySelector('.server-btn.active')) {
                        card.click();
                    } else {
                        card.classList.add('active');
                    }
                }
            });
        } catch (err) {
            console.error("Failed to load episodes:", err);
            episodeListContainer.innerHTML = '<h3 style="padding: 20px; text-align: center;">Error loading episodes.</h3>';
        }
    }

    seasonMenu.innerHTML = '';
    item.seasons.forEach(season => {
        if (season.season_number > 0) {
            const seasonOption = document.createElement('button');
            seasonOption.textContent = season.name;
            seasonOption.addEventListener('click', () => {
                if (selectedSeasonName) selectedSeasonName.textContent = season.name;
                loadEpisodes(season.season_number);
            });
            seasonMenu.appendChild(seasonOption);
        }
    });

    const firstSeason = item.seasons.find(s => s.season_number > 0);
    if (firstSeason) {
        if (selectedSeasonName) selectedSeasonName.textContent = firstSeason.name;
        loadEpisodes(firstSeason.season_number);
    } else {
        const tvBrowser = document.querySelector('.tv-show-browser');
        if (tvBrowser) tvBrowser.innerHTML = '<h3 style="text-align: center; color: #888;">No seasons available for this series.</h3>';
    }
}

async function handleCollection(collectionId) {
    const container = document.getElementById('collection-sidebar');
    const listContainer = document.getElementById('collection-list-container');
    if (!container || !listContainer) return;
    
    try {
        const res = await fetch(`${BASE_URL}/collection/${collectionId}`);
        const data = await res.json();
        
        if (data.parts && data.parts.length > 1) {
            const today = new Date(); 

            container.style.display = 'block'; 
            listContainer.innerHTML = ''; 
            
            const sortedParts = data.parts.sort((a, b) => 
                new Date(a.release_date || 0) - new Date(b.release_date || 0)
            );

            sortedParts.forEach(movie => {
                if (movie.id == id) return;

                const releaseDate = movie.release_date ? new Date(movie.release_date) : null;
                if (!releaseDate || releaseDate > today) return;

                const card = document.createElement('div');
                card.className = 'episode-card'; 
                const posterImg = movie.poster_path ? `${IMG_URL}${movie.poster_path}` : 'images/logo-192.png';
                
                card.innerHTML = `
                    <img class="episode-thumbnail" src="${posterImg}" alt="${movie.title || 'Movie'}">
                    <div class="episode-details">
                        <h3 style="font-size: 0.85rem;">${movie.title || 'Untitled'}</h3>
                        <p>${movie.release_date ? movie.release_date.substring(0,4) : 'N/A'}</p>
                    </div>
                `;

                card.onclick = () => window.location.href = `movie.html?id=${movie.id}&type=movie`;
                listContainer.appendChild(card);
            });

            if (listContainer.children.length === 0) {
                container.style.display = 'none';
            }
        }
    } catch (error) {
        console.error("Failed to load collection:", error);
    }
}