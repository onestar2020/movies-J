// ✅ js/movie.js (AUTO-FALLBACK ENGINE + AUTO NEXT EPISODE + TRADEMARK TRAILER-FIRST + QUALITY DETECTOR + REALTIME USERS)

// ================= 1. ANTI-DEVTOOLS & INSPECT PROTECTION (DEVELOPMENT SAFE) =================
(function() {
    document.addEventListener('contextmenu', (e) => e.preventDefault());

    document.addEventListener('keydown', (e) => {
        if (
            e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) ||
            (e.ctrlKey && ['U', 'u', 'S', 's'].includes(e.key))
        ) {
            e.preventDefault();
            return false;
        }
    });

    /* Pansamantalang naka-disable para sa smooth local debugging
    setInterval(() => {
        const startTime = performance.now();
        debugger;
        if (performance.now() - startTime > 100) {
            window.location.href = "about:blank";
        }
    }, 500);
    */
})();

// ================= 2. CORE MOVIE & TV LOGIC =================
const BASE_URL = 'https://movies-j-api-proxy.jayjovendinawanao2020.workers.dev'; 
const TMDB_DIRECT_KEY = '1e86095039d9eb32cbcf1aa445b23d92';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';

const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get('id') || '1083818';
let type = (urlParams.get('type') || 'movie').toLowerCase();

let trailerUrl = ''; 
let currentItemData = null;
let isEpisodic = (type === 'tv' || type === 'anime');
let isMovieReleased = true;

// Server Fallback State Variables
let currentActiveServerKey = '';
let serverHealthTimeout = null;
let failedServers = new Set();

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

        // Release check para sa Movies
        if (!isEpisodic) {
            const relStatus = getReleaseStatus(item.release_date);
            isMovieReleased = relStatus.isReleased;
        }

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

        // 4. Player & Server Setup (Trailer First as Trademark)
        setupInitialPlayer(item);
        populateServerSelector(item);

        // 5. Cast Section (Filtered - No blank cards)
        renderCastSection(item);

        // 6. Similar / Recommendations
        renderSimilarSection(item);

        // 7. Organized Collection Sidebar (Watch Order for Franchise)
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

        // Mobile Auto-Scroll
        if (window.innerWidth <= 900) {
            setTimeout(() => {
                const targetPanel = isEpisodic ? document.getElementById("tv-panel") : document.getElementById("server-buttons");
                if (targetPanel) {
                    targetPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 800);
        }
    }
});

// Helper: Custom Theme Modal Notification
function showThemeModal(title, message, badgeText = '') {
    let overlay = document.getElementById('custom-theme-modal');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'custom-theme-modal';
        overlay.className = 'custom-modal-overlay';
        overlay.innerHTML = `
            <div class="custom-modal-card">
                <div class="custom-modal-icon">🎬</div>
                <h3 class="custom-modal-title" id="custom-modal-title">Notice</h3>
                <div id="custom-modal-badge-container"></div>
                <p class="custom-modal-desc" id="custom-modal-desc"></p>
                <button class="custom-modal-btn" id="custom-modal-close-btn">Understood</button>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.remove('show');
        });

        document.getElementById('custom-modal-close-btn').onclick = () => {
            overlay.classList.remove('show');
        };
    }

    document.getElementById('custom-modal-title').textContent = title;
    document.getElementById('custom-modal-desc').textContent = message;

    const badgeContainer = document.getElementById('custom-modal-badge-container');
    if (badgeText) {
        badgeContainer.innerHTML = `<span class="custom-modal-badge">${badgeText}</span>`;
    } else {
        badgeContainer.innerHTML = '';
    }

    overlay.classList.add('show');
}

// Helper: Release Status Calculator (Smart Context for Movies & TV)
function getReleaseStatus(airDateStr) {
    if (!airDateStr) return { isReleased: true, label: '' };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const airDate = new Date(airDateStr);
    airDate.setHours(0, 0, 0, 0);

    const diffTime = airDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const mediumText = isEpisodic ? "Airing" : "In Theaters";

    if (diffDays <= 0) {
        return { isReleased: true, label: '' };
    } else if (diffDays === 1) {
        return { isReleased: false, label: isEpisodic ? 'Airing Tomorrow' : 'Releasing Tomorrow' };
    } else if (diffDays <= 30) {
        return { isReleased: false, label: `${mediumText} in ${diffDays} days` };
    } else {
        return { isReleased: false, label: `Release: ${airDateStr}` };
    }
}

// Helper: Smart Video Quality & CAM Detector (Safe 90-Day / 3-Month Window)
function getQualityStatus(releaseDateStr) {
    if (isEpisodic) {
        return { quality: 'HD', isCamLikely: false, badge: 'HD 1080p' };
    }
    if (!releaseDateStr) {
        return { quality: 'Auto', isCamLikely: false, badge: 'Standard' };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const relDate = new Date(releaseDateStr);
    relDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((today - relDate) / (1000 * 60 * 60 * 24));

    if (diffDays >= 0 && diffDays <= 90) {
        return {
            quality: 'CAM / SD',
            isCamLikely: true,
            badge: 'CAM / Telesync',
            message: 'This movie was recently released in theaters. Stream servers may currently provide a Cinema / CAM copy until the official HD digital release is out.'
        };
    }

    return {
        quality: 'HD',
        isCamLikely: false,
        badge: 'HD 1080p',
        message: ''
    };
}

// Fetch Details
async function fetchDetails() {
    let data = null;
    try {
        const res = await fetch(`${BASE_URL}/${type}/${id}?append_to_response=external_ids,credits,similar,videos`);
        if (res.ok) data = await res.json();
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
        const relStatus = !isEpisodic ? getReleaseStatus(item.release_date) : { isReleased: true };
        const qualityStatus = getQualityStatus(item.release_date || item.first_air_date);

        const statusBadge = !relStatus.isReleased 
            ? `<span class="meta-badge" style="background:#e50914; color:#fff; font-weight:bold;">${relStatus.label}</span>` 
            : `<span class="meta-badge">${item.status || "Released"}</span>`;

        const qualityBadge = relStatus.isReleased
            ? `<span class="meta-badge" style="background:${qualityStatus.isCamLikely ? '#ff9800' : '#4CAF50'}; color:#fff; font-weight:bold;">${qualityStatus.badge}</span>`
            : '';

        badgeBox.innerHTML = `
            <span class="meta-badge">${type.toUpperCase()}</span>
            ${statusBadge}
            ${qualityBadge}
            ${(item.genres || []).map(g => `<span class="meta-badge">${g.name}</span>`).join("")}
        `;
    }
}

// Cast Cards (FILTERED: Tanggal ang walang picture)
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
    const validCast = castList.filter(c => c.profile_path && c.name && c.name.trim() !== "");

    if (validCast.length > 0) {
        validCast.slice(0, 15).forEach(c => {
            const pic = `https://image.tmdb.org/t/p/w185${c.profile_path}`;
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
        castBox.innerHTML = "<p style='color:#777; padding:10px;'>No cast info available.</p>";
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

// Setup Player (Loads Trailer First by Default)
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

// Server Buttons (with Quality Badge & CAM Notice)
function populateServerSelector(item) {
    const grid = document.getElementById("server-buttons");
    if (!grid) return;

    grid.innerHTML = "";

    if (typeof STREAM_SERVERS !== "undefined") {
        const serverKeys = Object.keys(STREAM_SERVERS);
        const qualityStatus = getQualityStatus(item.release_date || item.first_air_date);

        serverKeys.forEach((key) => {
            const srv = STREAM_SERVERS[key];
            if (!srv.enabled) return;

            const btn = document.createElement("button");
            btn.className = `srv-btn ${!isEpisodic && !isMovieReleased ? 'disabled-srv' : ''}`;
            btn.setAttribute('data-server', key);
            
            const qTag = isMovieReleased 
                ? `<span style="font-size:10px; margin-left:4px; opacity:0.8; color:${qualityStatus.isCamLikely ? '#ffb74d' : '#81c784'};">(${qualityStatus.quality})</span>` 
                : '';
            
            btn.innerHTML = `${srv.name} ${qTag}`;
            
            btn.onclick = () => {
                if (!isEpisodic && !isMovieReleased) {
                    const status = getReleaseStatus(item.release_date);
                    showThemeModal(
                        "Not Yet Released",
                        "This movie is currently unreleased in official channels. We are playing the official trailer for you in the meantime.",
                        status.label
                    );
                    if (trailerUrl) {
                        const player = document.getElementById("movie-player");
                        if (player) player.src = trailerUrl;
                    }
                    return;
                }

                if (qualityStatus.isCamLikely && !sessionStorage.getItem(`cam_notified_${item.id}`)) {
                    showThemeModal(
                        "Video Quality Notice",
                        qualityStatus.message,
                        qualityStatus.badge
                    );
                    sessionStorage.setItem(`cam_notified_${item.id}`, 'true');
                }

                document.querySelectorAll(".srv-btn").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                
                failedServers.clear(); // Reset failure tracker on user manual select
                updatePlayer(key, item, currentSeasonNumber, currentEpisodeNumber);
            };

            grid.appendChild(btn);
        });
    }
}

// ================= SMART STREAM SERVER AUTO-FALLBACK =================


function checkAndTriggerAutoFallback(item, season, episode) {
    if (typeof STREAM_SERVERS === 'undefined') return;
    const availableKeys = Object.keys(STREAM_SERVERS).filter(k => STREAM_SERVERS[k].enabled);
    
    failedServers.add(currentActiveServerKey);
    const nextServerKey = availableKeys.find(k => !failedServers.has(k));

    if (nextServerKey) {
        console.warn(`[Auto-Fallback] Server "${currentActiveServerKey}" unresponsive. Switching to "${nextServerKey}"...`);
        
        const statusBanner = document.getElementById("server-status-banner");
        const activeNameElem = document.getElementById("active-server-name");
        if (statusBanner && activeNameElem) {
            activeNameElem.textContent = `Using: ${STREAM_SERVERS[nextServerKey].name}`;
            statusBanner.style.display = 'flex';
        }

        const targetBtn = document.querySelector(`.srv-btn[data-server="${nextServerKey}"]`);
        if (targetBtn) {
            document.querySelectorAll(".srv-btn").forEach(b => b.classList.remove("active"));
            targetBtn.classList.add("active");
        }

        updatePlayer(nextServerKey, item, season, episode);
    }
}

// TV Seasons & Episodes Setup
function handleTVShow(item) {
    const drop = document.getElementById("season-dropdown");
    const btn = document.getElementById("season-toggle");
    const currentLabel = document.getElementById("season-current-label");
    if (!drop || !btn || !item.seasons) return;

    drop.innerHTML = "";
    const validSeasons = item.seasons.filter(s => s.season_number > 0);

    if (validSeasons.length === 0) {
        document.getElementById("episode-list").innerHTML = "<p style='color:#777; padding:10px;'>No seasons available.</p>";
        return;
    }

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

// TV Episode Loader (with Custom Modal on Click)
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

    const releasedEpisodes = episodes.filter(ep => getReleaseStatus(ep.air_date).isReleased);
    const lastReleasedEpNum = releasedEpisodes.length > 0 ? releasedEpisodes[releasedEpisodes.length - 1].episode_number : null;

    let targetSelectedEpNum = currentEpisodeNumber;
    const currentTargetEp = episodes.find(e => e.episode_number === targetSelectedEpNum);
    
    if (currentTargetEp && !getReleaseStatus(currentTargetEp.air_date).isReleased) {
        targetSelectedEpNum = lastReleasedEpNum || 1;
        currentEpisodeNumber = targetSelectedEpNum;
    }

    episodes.forEach((ep) => {
        const status = getReleaseStatus(ep.air_date);
        const card = document.createElement("div");
        card.className = `ep-card ${ep.episode_number === targetSelectedEpNum && status.isReleased ? "active" : ""} ${!status.isReleased ? "unreleased" : ""}`;
        card.setAttribute('data-episode', ep.episode_number);
        
        const thumb = ep.still_path ? `https://image.tmdb.org/t/p/w185${ep.still_path}` : 'images/logo-192.png';
        
        const badgeHtml = !status.isReleased 
            ? `<span class="ep-badge-unreleased" style="position:absolute; top:6px; left:6px; background:#e50914; color:#fff; font-size:10px; font-weight:700; padding:2px 6px; border-radius:4px; z-index:2; text-shadow:0 1px 2px rgba(0,0,0,0.8);">${status.label}</span>` 
            : '';

        card.innerHTML = `
            <div style="position:relative; width:100px; flex-shrink:0; display:flex;">
                <img src="${thumb}" alt="EP ${ep.episode_number}" loading="lazy" style="width:100%; border-radius:4px; object-fit:cover;">
                ${badgeHtml}
            </div>
            <div class="ep-info" style="flex:1; margin-left:10px;">
                <h4>EP ${ep.episode_number}: ${ep.name || "Episode " + ep.episode_number}</h4>
                <p>${ep.overview || "No description provided."}</p>
            </div>
        `;

        card.onclick = () => {
            if (!status.isReleased) {
                showThemeModal(
                    `Episode ${ep.episode_number} Unreleased`,
                    `"${ep.name || 'This episode'}" has not aired yet. Please check back on its release date.`,
                    status.label
                );
                return;
            }

            currentEpisodeNumber = ep.episode_number;
            document.querySelectorAll(".ep-card").forEach(c => c.classList.remove("active"));
            card.classList.add("active");

            const activeBtn = document.querySelector(".srv-btn.active") || document.querySelector(".srv-btn");
            if (activeBtn) activeBtn.click();

            if (window.innerWidth <= 900) {
                const target = document.getElementById("tv-panel");
                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        };

        list.appendChild(card);
    });

    const activeEp = list.querySelector('.ep-card.active');
    if (activeEp) {
        activeEp.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
}

// Next Episode Button Handler (with Custom Modal & Mobile Support)
function setupNextEpisodeButton() {
    const nextBtn = document.getElementById('next-ep-btn');
    if (!nextBtn) return;

    nextBtn.onmouseover = () => { nextBtn.style.background = "#e50914"; nextBtn.style.borderColor = "#e50914"; };
    nextBtn.onmouseout = () => { nextBtn.style.background = "#222"; nextBtn.style.borderColor = "#444"; };

    nextBtn.onclick = () => {
        const currentActive = document.querySelector('.ep-card.active');
        if (currentActive && currentActive.nextElementSibling && currentActive.nextElementSibling.classList.contains('ep-card')) {
            const nextCard = currentActive.nextElementSibling;
            if (nextCard.classList.contains('unreleased')) {
                showThemeModal(
                    "Upcoming Episode",
                    "The next episode is not yet available for streaming.",
                    "Unreleased"
                );
                return;
            }
            nextCard.click();
            nextCard.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'center' });
        } else {
            showThemeModal(
                "End of Season",
                "You have reached the end of this season! Please choose the next season from the selector.",
                "Season Completed"
            );
        }
    };
}

// ================= 3. ORGANIZED COLLECTION SIDEBAR (CHRONOLOGICAL STORY ORDER) =================
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
            container.style.display = 'block'; 
            listContainer.innerHTML = ''; 
            
            const sortedParts = data.parts.sort((a, b) => 
                new Date(a.release_date || '9999-12-31') - new Date(b.release_date || '9999-12-31')
            );

            sortedParts.forEach((movie, index) => {
                const isCurrentMovie = (movie.id == id);
                const relStatus = getReleaseStatus(movie.release_date);
                const posterImg = movie.poster_path ? `${IMG_URL}${movie.poster_path}` : 'images/logo-192.png';
                const releaseYear = movie.release_date ? movie.release_date.substring(0, 4) : 'Upcoming';
                
                const card = document.createElement('div');
                card.className = `ep-card ${isCurrentMovie ? 'active' : ''} ${!relStatus.isReleased ? 'unreleased' : ''}`;
                card.style.position = 'relative';
                
                card.innerHTML = `
                    <div style="position:relative; width:60px; aspect-ratio:2/3; flex-shrink:0;">
                        <img src="${posterImg}" alt="${movie.title || 'Movie'}" style="width:100%; height:100%; border-radius:4px; object-fit:cover;">
                        <span style="position:absolute; top:2px; left:2px; background:rgba(0,0,0,0.8); color:#ffd700; font-size:10px; font-weight:bold; padding:1px 4px; border-radius:2px;">#${index + 1}</span>
                    </div>
                    <div class="ep-info" style="flex:1; margin-left:10px;">
                        <h4>${movie.title || 'Untitled'} ${isCurrentMovie ? '<span style="color:#e50914; font-size:11px;">(Watching)</span>' : ''}</h4>
                        <p>${releaseYear} ${!relStatus.isReleased ? `• <span style="color:#e50914; font-weight:bold;">${relStatus.label}</span>` : ''}</p>
                    </div>
                `;

                if (!isCurrentMovie) {
                    card.onclick = () => window.location.href = `movie.html?id=${movie.id}&type=movie`;
                }

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

// ================= 4. ACTIVE USERS TRACKER (FIREBASE) =================
(function initActiveUsersTracker() {
    const DATABASE_URL = "https://movies-j-stream-default-rtdb.asia-southeast1.firebasedatabase.app";
    
    const visitorId = 'user_' + Math.random().toString(36).substr(2, 9);
    const connectionRefUrl = `${DATABASE_URL}/active_users/${visitorId}.json`;
    const allUsersRefUrl = `${DATABASE_URL}/active_users.json`;

    function setOnline() {
        fetch(connectionRefUrl, {
            method: 'PUT',
            body: JSON.stringify({ timestamp: Date.now() }),
            keepalive: true
        }).catch(e => console.error("Firebase connection error:", e));
    }

    function setOffline() {
        fetch(connectionRefUrl, {
            method: 'DELETE',
            keepalive: true
        }).catch(e => console.error("Firebase disconnect error:", e));
    }

    async function updateOnlineCount() {
        try {
            const res = await fetch(allUsersRefUrl);
            const data = await res.json();
            
            if (data) {
                const now = Date.now();
                let count = 0;
                
                for (const key in data) {
                    if (now - data[key].timestamp < 120000) { 
                        count++;
                    } else {
                        fetch(`${DATABASE_URL}/active_users/${key}.json`, { method: 'DELETE' });
                    }
                }
                
                const countElem = document.getElementById("online-count");
                if (countElem) {
                    countElem.textContent = count > 0 ? count : 1;
                }
            }
        } catch (e) {
            console.warn("Failed to fetch active users count");
        }
    }

    setOnline();
    updateOnlineCount();

    setInterval(() => {
        setOnline();
        updateOnlineCount();
    }, 60000);

    window.addEventListener('beforeunload', () => {
        setOffline();
    });
})();