// ✅ js/movie.js (MOBILE OPTIMIZED + LOCALSTORAGE WATCH PROGRESS)

const BASE_URL = 'https://movies-j-api-proxy.jayjovendinawanao2020.workers.dev'; 
const TMDB_DIRECT_KEY = '1e86095039d9eb32cbcf1aa445b23d92';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';

const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get('id') || '1083818';
let type = (urlParams.get('type') || 'movie').toLowerCase();

let trailerUrl = ''; 
let currentItemData = null;
let isEpisodic = (type === 'tv' || type === 'anime');

// LocalStorage Watch History Tracker
const storageKey = `movies_j_progress_${id}`;
let savedProgress = null;
try {
    savedProgress = JSON.parse(localStorage.getItem(storageKey));
} catch (e) {
    savedProgress = null;
}

let currentSeasonNumber = parseInt(urlParams.get('season')) || (savedProgress ? savedProgress.season : 1);
let currentEpisodeNumber = parseInt(urlParams.get('episode')) || (savedProgress ? savedProgress.episode : 1);

document.addEventListener("DOMContentLoaded", async () => {
    if (!id) return;

    const item = await fetchDetails();
    if (item) {
        currentItemData = item;

        // 1. Title & Header Info
        const displayTitle = item.title || item.name || item.original_title || "Now Playing";
        document.title = `${displayTitle} - Stream`;

        const titleElem = document.getElementById("media-title");
        if (titleElem) titleElem.textContent = displayTitle;

        const headerTitleElem = document.getElementById("page-header-title");
        if (headerTitleElem) headerTitleElem.textContent = displayTitle;

        // 2. Overview
        const overviewElem = document.getElementById("media-overview");
        if (overviewElem) {
            overviewElem.textContent = item.overview && item.overview.trim() !== "" 
                ? item.overview 
                : "No overview available.";
        }

        // 3. Facts & Badges
        renderMetadata(item);

        // 4. Player & Server Setup
        setupInitialPlayer(item);
        populateServerSelector(item);

        // 5. Cast Section
        renderCastSection(item);

        // 6. Similar / Recommendations
        renderSimilarSection(item);

        // 7. Collection Sidebar (Movies)
        if (item.belongs_to_collection && item.belongs_to_collection.id) {
            handleCollection(item.belongs_to_collection.id);
        }

        // 8. TV Shows & Episodes
        if (isEpisodic && item.seasons) {
            const tvPanel = document.getElementById("tv-panel");
            if (tvPanel) tvPanel.style.display = "block";
            handleTVShow(item);
            setupNextEpisodeButton();
        }
    }
});

// Fetch Main Details with Proxy & Direct TMDb Fallback
async function fetchDetails() {
    let data = null;

    try {
        const res = await fetch(`${BASE_URL}/${type}/${id}?append_to_response=external_ids,credits,similar,videos`);
        if (res.ok) {
            data = await res.json();
        }
    } catch (e) {
        console.warn("Proxy fetch failed, switching to direct TMDb API:", e);
    }

    if (!data || data.status_code === 34) {
        try {
            let tmdbRes = await fetch(`https://api.themoviedb.org/3/${type}/${id}?api_key=${TMDB_DIRECT_KEY}&append_to_response=external_ids,credits,similar,videos`);
            data = await tmdbRes.json();

            if (data.status_code === 34 && type === 'movie') {
                type = 'tv';
                isEpisodic = true;
                tmdbRes = await fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=${TMDB_DIRECT_KEY}&append_to_response=external_ids,credits,similar,videos`);
                data = await tmdbRes.json();
            }
        } catch (err) {
            console.error("Direct TMDb Fetch Error:", err);
        }
    }

    return data;
}

// Facts Grid at Badges
function renderMetadata(item) {
    const runtime = item.runtime || (item.episode_run_time && item.episode_run_time[0]);
    const runtimeElem = document.getElementById("fact-runtime");
    if (runtimeElem) {
        runtimeElem.textContent = runtime ? `${runtime} min` : (item.status || "N/A");
    }

    const releaseElem = document.getElementById("fact-release");
    if (releaseElem) {
        releaseElem.textContent = item.release_date || item.first_air_date || "N/A";
    }

    const ratingElem = document.getElementById("fact-rating");
    if (ratingElem) {
        ratingElem.textContent = item.vote_average && item.vote_average > 0 
            ? `★ ${item.vote_average.toFixed(1)}` 
            : "Unrated";
    }

    const countryElem = document.getElementById("fact-country");
    if (countryElem) {
        const country = (item.production_countries && item.production_countries[0]?.name) ||
                        (item.origin_country && item.origin_country[0]) || 
                        "Global";
        countryElem.textContent = country;
    }

    const badgeBox = document.getElementById("media-badges");
    if (badgeBox) {
        badgeBox.innerHTML = `
            <span class="meta-badge">${type.toUpperCase()}</span>
            <span class="meta-badge">${item.status || "Released"}</span>
            ${(item.genres || []).map(g => `<span class="meta-badge">${g.name}</span>`).join("")}
        `;
    }
}

// Cast Cards
async function renderCastSection(item) {
    const castBox = document.getElementById("cast-container");
    if (!castBox) return;

    let castList = item.credits && item.credits.cast ? item.credits.cast : [];

    if (castList.length === 0) {
        try {
            const res = await fetch(`https://api.themoviedb.org/3/${type}/${id}/credits?api_key=${TMDB_DIRECT_KEY}`);
            const data = await res.json();
            castList = data.cast || [];
        } catch (e) {
            castList = [];
        }
    }

    castBox.innerHTML = "";
    if (castList.length > 0) {
        castList.slice(0, 15).forEach(c => {
            const pic = c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : 'images/logo-192.png';
            castBox.innerHTML += `
                <div class="cast-card">
                    <img src="${pic}" alt="${c.name}" loading="lazy">
                    <div class="cast-name">
                        <h6>${c.name}</h6>
                        <span>${c.character || ""}</span>
                    </div>
                </div>
            `;
        });
    } else {
        castBox.innerHTML = "<p style='color:#777;'>No cast info available.</p>";
    }
}

// Recommendations
async function renderSimilarSection(item) {
    const recBox = document.getElementById("rec-container");
    if (!recBox) return;

    let similarList = item.similar && item.similar.results ? item.similar.results : [];

    if (similarList.length === 0) {
        try {
            const res = await fetch(`https://api.themoviedb.org/3/${type}/${id}/similar?api_key=${TMDB_DIRECT_KEY}`);
            const data = await res.json();
            similarList = data.results || [];
        } catch (e) {
            similarList = [];
        }
    }

    recBox.innerHTML = "";
    if (similarList.length > 0) {
        similarList.slice(0, 12).forEach(sim => {
            const poster = sim.poster_path ? `https://image.tmdb.org/t/p/w300${sim.poster_path}` : 'images/logo-192.png';
            recBox.innerHTML += `
                <a class="rec-card" href="movie.html?id=${sim.id}&type=${type}">
                    <img src="${poster}" alt="${sim.title || sim.name}" loading="lazy">
                    <h6>${sim.title || sim.name}</h6>
                </a>
            `;
        });
    } else {
        recBox.innerHTML = "<p style='color:#777;'>No recommendations available.</p>";
    }
}

// Setup Player
function setupInitialPlayer(item) {
    const player = document.getElementById("movie-player");
    if (!player) return;

    if (item.videos && item.videos.results && item.videos.results.length > 0) {
        const trailer = item.videos.results.find(v => (v.type === "Trailer" || v.type === "Teaser") && v.site === "YouTube") || item.videos.results[0];
        if (trailer && trailer.key) {
            trailerUrl = `https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=0&controls=1`;
            player.src = trailerUrl;
            return;
        }
    }

    trailerUrl = '';
}

// Server Buttons
function populateServerSelector(item) {
    const grid = document.getElementById("server-buttons");
    if (!grid) return;

    grid.innerHTML = "";

    if (typeof STREAM_SERVERS !== "undefined") {
        const serverKeys = Object.keys(STREAM_SERVERS);
        let firstActiveBtn = null;

        serverKeys.forEach((key) => {
            const srv = STREAM_SERVERS[key];
            if (!srv.enabled) return;

            const btn = document.createElement("button");
            btn.className = "srv-btn";
            btn.textContent = srv.name;
            btn.onclick = () => {
                document.querySelectorAll(".srv-btn").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                updatePlayer(key, item, currentSeasonNumber, currentEpisodeNumber);
            };

            grid.appendChild(btn);
            if (!firstActiveBtn) firstActiveBtn = btn;
        });

        if (!trailerUrl && firstActiveBtn) {
            firstActiveBtn.click();
        }
    }
}

function updatePlayer(serverKey, item, season = 1, episode = 1) {
    const player = document.getElementById("movie-player");
    if (!player || typeof getEmbedUrl !== "function") return;

    currentSeasonNumber = season;
    currentEpisodeNumber = episode;

    // Save Progress sa LocalStorage para sa mobile resume
    if (isEpisodic) {
        localStorage.setItem(storageKey, JSON.stringify({ season: currentSeasonNumber, episode: currentEpisodeNumber }));
    }

    const mediaData = { 
        id: item.id, 
        tmdb_id: item.id, 
        imdb_id: item.external_ids?.imdb_id || "" 
    };
    
    const typeKey = isEpisodic ? "tv" : "movie";
    player.src = getEmbedUrl(serverKey, mediaData, typeKey, season, episode);
}

// TV Seasons & Episodes Setup
function handleTVShow(item) {
    const drop = document.getElementById("season-dropdown");
    const btn = document.getElementById("season-toggle");
    const currentLabel = document.getElementById("season-current-label");
    if (!drop || !btn || !item.seasons) return;

    drop.innerHTML = "";

    // Salain lamang ang totoong seasons (season_number > 0)
    const validSeasons = item.seasons.filter(s => s.season_number > 0);

    if (validSeasons.length === 0) {
        document.getElementById("episode-list").innerHTML = "<p style='color:#777; padding:10px;'>No seasons available.</p>";
        return;
    }

    // Default to Season 1 or Saved Progress
    const initialSeason = validSeasons.find(s => s.season_number === currentSeasonNumber) || validSeasons[0];
    currentSeasonNumber = initialSeason.season_number;
    if (currentLabel) currentLabel.textContent = initialSeason.name || `Season ${initialSeason.season_number}`;

    validSeasons.forEach(s => {
        const b = document.createElement("button");
        b.textContent = s.name || `Season ${s.season_number}`;
        b.onclick = () => {
            currentSeasonNumber = s.season_number;
            currentEpisodeNumber = 1;
            if (currentLabel) currentLabel.textContent = b.textContent;
            drop.style.display = "none";
            loadEpisodes(currentSeasonNumber);
        };
        drop.appendChild(b);
    });

    btn.onclick = (e) => {
        e.stopPropagation();
        drop.style.display = (drop.style.display === "block") ? "none" : "block";
    };

    window.addEventListener("click", () => {
        if (drop.style.display === "block") drop.style.display = "none";
    });

    loadEpisodes(currentSeasonNumber);
}

async function loadEpisodes(seasonNum) {
    const list = document.getElementById("episode-list");
    if (!list) return;

    list.innerHTML = "<p style='color:#777; padding:15px; text-align:center;'>Loading episodes...</p>";

    let episodes = [];

    try {
        const res = await fetch(`${BASE_URL}/tv/${id}/season/${seasonNum}`);
        if (res.ok) {
            const data = await res.json();
            episodes = data.episodes || [];
        }
    } catch (e) {
        console.warn("Proxy season fetch failed, trying direct TMDb...");
    }

    if (!episodes || episodes.length === 0) {
        try {
            const res = await fetch(`https://api.themoviedb.org/3/tv/${id}/season/${seasonNum}?api_key=${TMDB_DIRECT_KEY}`);
            const data = await res.json();
            episodes = data.episodes || [];
        } catch (e) {
            console.error("Direct TMDb season fetch error:", e);
        }
    }

    list.innerHTML = "";

    if (!episodes || episodes.length === 0) {
        list.innerHTML = "<p style='color:#777; padding:15px; text-align:center;'>No episodes found for this season.</p>";
        return;
    }

    episodes.forEach((ep, index) => {
        const card = document.createElement("div");
        card.className = `ep-card ${ep.episode_number === currentEpisodeNumber ? "active" : ""}`;
        const thumb = ep.still_path ? `https://image.tmdb.org/t/p/w185${ep.still_path}` : 'images/logo-192.png';
        
        card.innerHTML = `
            <img src="${thumb}" alt="EP ${ep.episode_number}" loading="lazy">
            <div class="ep-info">
                <h4>EP ${ep.episode_number}: ${ep.name || "Episode " + ep.episode_number}</h4>
                <p>${ep.overview || "No description provided."}</p>
            </div>
        `;

        card.onclick = () => {
            currentEpisodeNumber = ep.episode_number;
            document.querySelectorAll(".ep-card").forEach(c => c.classList.remove("active"));
            card.classList.add("active");

            const activeBtn = document.querySelector(".srv-btn.active") || document.querySelector(".srv-btn");
            if (activeBtn) activeBtn.click();
        };

        list.appendChild(card);

        if (index === 0 && (!currentEpisodeNumber || currentEpisodeNumber === 1)) {
            card.classList.add("active");
        }
    });

    // Auto scroll the active episode card into view (useful on mobile horizontal bar)
    const activeEp = list.querySelector('.ep-card.active');
    if (activeEp) {
        activeEp.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
}

// Next Episode Button Handler
function setupNextEpisodeButton() {
    const nextBtn = document.getElementById('next-ep-btn');
    if (!nextBtn) return;

    nextBtn.onmouseover = () => { nextBtn.style.background = "#e50914"; nextBtn.style.borderColor = "#e50914"; };
    nextBtn.onmouseout = () => { nextBtn.style.background = "#222"; nextBtn.style.borderColor = "#444"; };

    nextBtn.onclick = () => {
        const currentActive = document.querySelector('.ep-card.active');
        if (currentActive && currentActive.nextElementSibling && currentActive.nextElementSibling.classList.contains('ep-card')) {
            currentActive.nextElementSibling.click();
            currentActive.nextElementSibling.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'center' });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            alert("End of season! Please select the next season.");
        }
    };
}

// Collection Sidebar Handler
async function handleCollection(collectionId) {
    const container = document.getElementById('collection-sidebar');
    const listContainer = document.getElementById('collection-list-container');
    if (!container || !listContainer) return;
    
    try {
        let res = await fetch(`${BASE_URL}/collection/${collectionId}`);
        let data = null;
        if (res.ok) data = await res.json();
        
        if (!data || !data.parts) {
            res = await fetch(`https://api.themoviedb.org/3/collection/${collectionId}?api_key=${TMDB_DIRECT_KEY}`);
            data = await res.json();
        }
        
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
                card.className = 'ep-card'; 
                const posterImg = movie.poster_path ? `${IMG_URL}${movie.poster_path}` : 'images/logo-192.png';
                
                card.innerHTML = `
                    <img src="${posterImg}" alt="${movie.title || 'Movie'}" style="width: 60px; aspect-ratio: 2/3; border-radius: 4px; object-fit: cover;">
                    <div class="ep-info">
                        <h4>${movie.title || 'Untitled'}</h4>
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