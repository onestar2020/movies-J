/**
 * ==============================================================================
 * MOVIES-J - OFFICIAL STREAMING & DETAILS ENGINE (js/movie.js)
 * ==============================================================================
 * 
 * TABLE OF CONTENTS:
 *  1. IMPORTS & CONFIGURATION
 *  2. INITIALIZATION / MAIN ENTRY POINT
 *  3. METADATA & BADGES
 *  4. VIDEO PLAYER & SERVER SELECTOR
 *  5. TV SHOWS, SEASONS & EPISODES
 *  6. CAST & RECOMMENDATIONS
 *  7. FRANCHISE / COLLECTION SIDEBAR
 *  8. WATCH HISTORY SYNC
 *  9. REALTIME COMMENTS & DISCUSSION (With Custom Modal Confirmation)
 * 10. REALTIME ONLINE ACTIVE USERS TRACKER
 * 11. UI MODALS & NOTIFICATIONS
 * ==============================================================================
 */

/* ==============================================================================
   SECTION 1: IMPORTS & CONFIGURATION
   ============================================================================== */
import { auth, db } from "./firebase-config.js";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// TMDb & Proxy Endpoints
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
let currentActiveServerKey = 'vidstorm';

const storageKey = `movies_j_progress_${id}`;
let savedProgress = null;
try {
    savedProgress = JSON.parse(localStorage.getItem(storageKey));
} catch (e) {
    savedProgress = null;
}

let currentSeasonNumber = parseInt(urlParams.get('season')) || (savedProgress ? savedProgress.season : 1);
let currentEpisodeNumber = parseInt(urlParams.get('episode')) || (savedProgress ? savedProgress.episode : 1);

/* ==============================================================================
   SECTION 2: INITIALIZATION / MAIN ENTRY POINT
   ============================================================================== */
document.addEventListener("DOMContentLoaded", async () => {
    if (!id) return;

    const item = await fetchDetails();
    if (item) {
        currentItemData = item;

        if (!isEpisodic) {
            const relStatus = getReleaseStatus(item.release_date);
            isMovieReleased = relStatus.isReleased;
        }

        const displayTitle = item.title || item.name || item.original_title || "Now Playing";
        document.title = `${displayTitle} - Stream`;

        const titleElem = document.getElementById("media-title");
        if (titleElem) titleElem.textContent = displayTitle;

        const headerTitleElem = document.getElementById("page-header-title");
        if (headerTitleElem) headerTitleElem.textContent = displayTitle;

        const overviewElem = document.getElementById("media-overview");
        if (overviewElem) {
            overviewElem.textContent = item.overview && item.overview.trim() !== "" 
                ? item.overview 
                : "No overview available.";
        }

        renderMetadata(item);
        setupInitialPlayer(item);
        populateServerSelector(item);
        renderCastSection(item);
        renderSimilarSection(item);

        if (item.belongs_to_collection && item.belongs_to_collection.id) {
            handleCollection(item.belongs_to_collection.id);
        }

        if (isEpisodic && item.seasons) {
            const tvPanel = document.getElementById("tv-panel");
            if (tvPanel) tvPanel.style.display = "block";
            handleTVShow(item);
            setupNextEpisodeButton();
        }

        syncToGlobalWatchHistory(item);
        initCommentsSection(id, type);

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

/* ==============================================================================
   SECTION 3: METADATA & BADGES
   ============================================================================== */
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
            <span class="meta-badge">${(isEpisodic ? 'TV SERIES' : 'MOVIE')}</span>
            ${statusBadge}
            ${qualityBadge}
            ${(item.genres || []).map(g => `<span class="meta-badge">${g.name}</span>`).join("")}
        `;
    }
}

/* ==============================================================================
   SECTION 4: VIDEO PLAYER & SERVER SELECTOR (MANUAL SELECTION)
   ============================================================================== */
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
                        "This title is not yet released on official streaming servers. We are playing the official trailer in the meantime.",
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
                
                updatePlayer(key, item, currentSeasonNumber, currentEpisodeNumber);
            };

            grid.appendChild(btn);
        });
    }
}

function updatePlayer(serverKey, item, season = 1, episode = 1) {
    const player = document.getElementById("movie-player");
    if (!player || typeof getEmbedUrl !== "function") return;

    currentActiveServerKey = serverKey;
    currentSeasonNumber = season;
    currentEpisodeNumber = episode;

    if (isEpisodic) {
        localStorage.setItem(storageKey, JSON.stringify({ season: currentSeasonNumber, episode: currentEpisodeNumber }));
    }

    const mediaData = { 
        id: item.id, 
        tmdb_id: item.id, 
        imdb_id: item.external_ids?.imdb_id || "" 
    };
    
    const typeKey = isEpisodic ? "tv" : "movie";
    const embedUrl = getEmbedUrl(serverKey, mediaData, typeKey, season, episode);
    player.src = embedUrl;

    syncToGlobalWatchHistory(item);
}

/* ==============================================================================
   SECTION 5: TV SHOWS, SEASONS & EPISODES
   ============================================================================== */
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

/* ==============================================================================
   SECTION 6: CAST & RECOMMENDATIONS
   ============================================================================== */
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

/* ==============================================================================
   SECTION 7: FRANCHISE / COLLECTION SIDEBAR
   ============================================================================== */
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

/* ==============================================================================
   SECTION 8: WATCH HISTORY SYNC
   ============================================================================== */
function syncToGlobalWatchHistory(item) {
    if (!item || !item.id) return;
    const mediaType = isEpisodic ? "tv" : "movie";
    
    if (typeof window.saveToWatchHistory === "function") {
        window.saveToWatchHistory({
            id: item.id,
            title: item.title || item.name || "Untitled",
            type: mediaType,
            poster_path: item.poster_path || "",
            backdrop_path: item.backdrop_path || "",
            season: currentSeasonNumber,
            episode: currentEpisodeNumber
        });
    }
}

/* ==============================================================================
   SECTION 9: REALTIME COMMENTS & DISCUSSION (WITH CUSTOM MODAL CONFIRMATION)
   ============================================================================== */
function formatTimeAgo(timestamp) {
    if (!timestamp) return "Just now";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((new Date() - date) / 1000);

    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return interval + "y ago";
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return interval + "mo ago";
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return interval + "d ago";
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return interval + "h ago";
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return interval + "m ago";
    return "Just now";
}

function escapeCommentHtml(str) {
    const div = document.createElement('div');
    div.innerText = str;
    return div.innerHTML;
}

// Custom Comment Delete Modal (NO BROWSER POPUP)
function showCustomConfirmModal({ title, message, onConfirm }) {
    let overlay = document.getElementById("custom-confirm-modal");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "custom-confirm-modal";
        overlay.style.cssText = `
            position: fixed;
            top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.8);
            backdrop-filter: blur(5px);
            z-index: 999999;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 15px;
        `;
        overlay.innerHTML = `
            <div style="background: #181818; border: 1px solid #333; border-radius: 12px; padding: 22px; max-width: 360px; width: 100%; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.9);">
                <div style="width: 45px; height: 45px; background: rgba(229,9,20,0.15); border: 1px solid #e50914; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; color: #e50914; font-size: 20px;">
                    <i class="fas fa-trash-alt"></i>
                </div>
                <h4 id="confirm-modal-title" style="color: #fff; font-size: 1.1rem; margin-bottom: 6px; font-weight: 600;">Delete Comment</h4>
                <p id="confirm-modal-msg" style="color: #aaa; font-size: 0.85rem; line-height: 1.4; margin-bottom: 20px;">Are you sure you want to permanently remove this comment?</p>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button id="confirm-modal-cancel-btn" style="flex: 1; padding: 9px; background: #282828; border: 1px solid #444; color: #ccc; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 13px;">Cancel</button>
                    <button id="confirm-modal-yes-btn" style="flex: 1; padding: 9px; background: #e50914; border: none; color: #fff; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 13px;">Delete</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    document.getElementById("confirm-modal-title").textContent = title || "Delete Comment";
    document.getElementById("confirm-modal-msg").textContent = message || "Are you sure you want to remove this?";

    const cancelBtn = document.getElementById("confirm-modal-cancel-btn");
    const yesBtn = document.getElementById("confirm-modal-yes-btn");

    overlay.style.display = "flex";

    cancelBtn.onclick = () => {
        overlay.style.display = "none";
    };

    yesBtn.onclick = () => {
        overlay.style.display = "none";
        if (onConfirm) onConfirm();
    };
}

function showCommentToast(msg, isError = false) {
    let toast = document.getElementById("comment-toast-notif");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "comment-toast-notif";
        toast.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%) translateY(20px);
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            color: #fff;
            z-index: 99999;
            box-shadow: 0 6px 20px rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            gap: 8px;
            opacity: 0;
            transition: all 0.3s ease;
            pointer-events: none;
        `;
        document.body.appendChild(toast);
    }

    toast.style.background = isError ? "#3b1111" : "#1c2e1c";
    toast.style.border = `1px solid ${isError ? "#e50914" : "#4caf50"}`;
    toast.innerHTML = `<i class="fas ${isError ? 'fa-exclamation-circle' : 'fa-check-circle'}" style="color:${isError ? '#e50914' : '#4caf50'};"></i> ${msg}`;

    toast.style.opacity = "1";
    toast.style.transform = "translateX(-50%) translateY(0)";

    clearTimeout(toast.hideTimer);
    toast.hideTimer = setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(-50%) translateY(20px)";
    }, 3000);
}

function initCommentsSection(mediaId, mediaType) {
    
const currentUser = auth.currentUser;
const isAdmin = currentUser && currentUser.email === "jayjovendinawanao2020@gmail.com";
const isOwner = currentUser && (currentUser.uid === data.userId || isAdmin);

    const commentInput = document.getElementById("comment-textarea");
    const postBtn = document.getElementById("post-comment-btn");
    const commentsFeed = document.getElementById("comments-feed-list");
    const countElem = document.getElementById("comments-count");
    const userAvatar = document.getElementById("current-user-comment-avatar");

    if (!commentsFeed) return;

    auth.onAuthStateChanged((user) => {
        if (user && userAvatar) {
            userAvatar.src = user.photoURL || "images/logo-192.png";
        } else if (userAvatar) {
            userAvatar.src = "images/logo-192.png";
        }
    });

    const commentsRef = collection(db, `media_comments_${mediaId}`);
    const q = query(commentsRef, orderBy("createdAt", "desc"));

    onSnapshot(q, (snapshot) => {
        const count = snapshot.size;
        if (countElem) countElem.textContent = count;

        if (count === 0) {
            commentsFeed.innerHTML = `
                <div style="text-align: center; padding: 30px; color: #777; background: #181818; border-radius: 8px; border: 1px dashed #333;">
                    <i class="far fa-comment-dots" style="font-size: 26px; margin-bottom: 8px; color: #555;"></i>
                    <p style="margin: 0; font-size: 13px;">No comments yet. Be the first to share your thoughts!</p>
                </div>
            `;
            return;
        }

        commentsFeed.innerHTML = "";
        const currentUser = auth.currentUser;

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const commentId = docSnap.id;
            const isOwner = currentUser && currentUser.uid === data.userId;

            const card = document.createElement("div");
            card.style.cssText = `
                background: #181818;
                border: 1px solid #282828;
                border-radius: 8px;
                padding: 14px;
                display: flex;
                gap: 12px;
                position: relative;
            `;

            card.innerHTML = `
                <img src="${data.userPhoto || 'images/logo-192.png'}" alt="Avatar" style="width: 34px; height: 34px; border-radius: 50%; object-fit: cover; flex-shrink: 0;" />
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-weight: 600; font-size: 13px; color: #fff;">${data.userName || 'User'}</span>
                            <span style="font-size: 11px; color: #777;">${formatTimeAgo(data.createdAt)}</span>
                        </div>
                        ${isOwner ? `
                            <button class="delete-comment-btn" data-id="${commentId}" style="background: transparent; border: none; color: #777; cursor: pointer; font-size: 12px;" title="Delete comment">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        ` : ''}
                    </div>
                    <p style="color: #ddd; font-size: 13px; line-height: 1.5; margin: 0; word-break: break-word;">
                        ${escapeCommentHtml(data.text)}
                    </p>
                </div>
            `;

            commentsFeed.appendChild(card);
        });

        // Attach Custom Modal Confirm Handler
        document.querySelectorAll(".delete-comment-btn").forEach((btn) => {
            btn.onclick = () => {
                const cId = btn.getAttribute("data-id");
                showCustomConfirmModal({
                    title: "Delete Comment",
                    message: "Are you sure you want to delete this comment?",
                    onConfirm: async () => {
                        try {
                            await deleteDoc(doc(db, `media_comments_${mediaId}`, cId));
                            showCommentToast("Comment deleted successfully.");
                        } catch (e) {
                            console.error("Error deleting comment:", e);
                            showCommentToast("Failed to delete comment.", true);
                        }
                    }
                });
            };
        });
    });

    if (postBtn && commentInput) {
        postBtn.onclick = async () => {
            const user = auth.currentUser;
            if (!user) {
                const navLoginBtn = document.getElementById("nav-login-btn");
                if (navLoginBtn) navLoginBtn.click();
                return;
            }

            const text = commentInput.value.trim();
            if (!text) return;

            postBtn.disabled = true;
            postBtn.style.opacity = "0.5";

            try {
                await addDoc(collection(db, `media_comments_${mediaId}`), {
                    mediaId: String(mediaId),
                    mediaType: mediaType || "movie",
                    userId: user.uid,
                    userName: user.displayName || "User",
                    userPhoto: user.photoURL || "images/logo-192.png",
                    text: text,
                    createdAt: serverTimestamp()
                });

                commentInput.value = "";
                showCommentToast("Comment posted!");
            } catch (err) {
                console.error("Failed to post comment:", err);
                showCommentToast("Error posting comment.", true);
            } finally {
                postBtn.disabled = false;
                postBtn.style.opacity = "1";
            }
        };
    }
}

/* ==============================================================================
   SECTION 10: REALTIME ONLINE ACTIVE USERS TRACKER
   ============================================================================== */
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

/* ==============================================================================
   SECTION 11: UI MODALS & NOTIFICATIONS
   ============================================================================== */
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