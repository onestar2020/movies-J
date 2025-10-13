// ✅ home.js (Updated with Featured Movie logic and More Info button fix)

const API_KEY = '22d74813ded3fecbe3ef632b4814ae3a';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL_W500 = 'https://image.tmdb.org/t/p/w500';
const IMG_URL_ORIGINAL = 'https://image.tmdb.org/t/p/original';

// --- BAGONG FUNCTION PARA SA FEATURED MOVIE ---
async function loadFeaturedMovie() {
    const heroSection = document.getElementById('hero-section');
    const heroTitle = document.getElementById('hero-title');
    const heroDesc = document.getElementById('hero-description');
    const watchBtn = document.getElementById('hero-watch-btn');
    const infoBtn = document.getElementById('hero-info-btn');

    try {
        const res = await fetch(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}`);
        const data = await res.json();
        // Get a random movie from the top 5 results
        const featuredMovie = data.results[Math.floor(Math.random() * 5)];
        
        if (featuredMovie) {
            heroSection.style.backgroundImage = `url(${IMG_URL_ORIGINAL}${featuredMovie.backdrop_path})`;
            heroTitle.textContent = featuredMovie.title;
            heroDesc.textContent = featuredMovie.overview;
            
            watchBtn.onclick = () => goToMovie(featuredMovie);
            infoBtn.onclick = () => openModal(featuredMovie.id, 'movie');
        }
    } catch (error) {
        console.error("Failed to load featured movie:", error);
        if(heroTitle) heroTitle.textContent = "Could not load featured movie.";
    }
}

// --- Fetch data from TMDB ---
async function fetchTrending(type) {
    try {
        const res = await fetch(`${BASE_URL}/trending/${type}/week?api_key=${API_KEY}`);
        const data = await res.json();
        return data.results;
    } catch (error) {
        console.error(`Error fetching trending ${type}:`, error);
        return [];
    }
}

async function fetchTrendingAnime() {
    try {
        let allResults = [];
        for (let page = 1; page <= 3; page++) {
            const res = await fetch(`${BASE_URL}/discover/tv?api_key=${API_KEY}&with_keywords=210024|287501&with_genres=16&page=${page}`);
            const data = await res.json();
            allResults = allResults.concat(data.results.map(item => ({ ...item, media_type: 'tv' })));
        }
        return allResults;
    } catch (error) {
        console.error('Error fetching trending anime:', error);
        return [];
    }
}

function displayList(items, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    items.forEach(item => {
        if (item.poster_path) {
            const movieCard = document.createElement('div');
            movieCard.className = 'movie-card';
            movieCard.onclick = () => goToMovie(item);
            movieCard.innerHTML = `
                <img src="${IMG_URL_W500}${item.poster_path}" alt="${item.title || item.name}" loading="lazy">
                <p class="movie-title">${item.title || item.name}</p>
            `;
            container.appendChild(movieCard);
        }
    });
}

function goToMovie(item) {
    const type = item.media_type || (item.first_air_date ? 'tv' : 'movie');
    saveToWatchHistory({ id: item.id, title: item.title || item.name, poster_path: item.poster_path, type: type });
    window.location.href = `movie.html?id=${item.id}&type=${type}`;
}

function saveToWatchHistory(item) {
    let history = JSON.parse(localStorage.getItem("watchHistory") || "[]");
    history = history.filter(histItem => !(histItem.id === item.id && histItem.type === item.type));
    history.unshift({ ...item, timestamp: Date.now() });
    if (history.length > 20) history = history.slice(0, 20);
    localStorage.setItem("watchHistory", JSON.stringify(history));
}

// --- MODAL & SEARCH LOGIC ---
async function openModal(id, type) {
    // Ito ang function para sa "More Info" button
    // Simpleng redirect muna sa movie page para gumana
    window.location.href = `movie.html?id=${id}&type=${type}`;
}

function openWatchHistoryModal() { /* ... existing code ... */ }
function loadWatchHistory() { /* ... existing code ... */ }
function openSearchModal() { /* ... existing code ... */ }
function closeSearchModal() { /* ... existing code ... */ }
async function searchTMDB() { /* ... existing code ... */ }

// --- BAGONG SCROLL LISTENER ---
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// --- Main function to initialize the page ---
async function init() {
    try {
        // Run all fetches at the same time for faster loading
        await Promise.all([
            loadFeaturedMovie(),
            fetchTrending('movie').then(items => displayList(items, 'movies-list')),
            fetchTrending('tv').then(items => displayList(items, 'tvshows-list')),
            fetchTrendingAnime().then(items => displayList(items, 'anime-list'))
        ]);
    } catch (error) {
        console.error("Failed to initialize page:", error);
    }
}

// Global functions for modals
window.openSearchModal = openSearchModal;
window.closeSearchModal = closeSearchModal;
window.searchTMDB = searchTMDB;
window.goToMovie = goToMovie;
window.openWatchHistoryModal = openWatchHistoryModal;
window.closeModal = () => { document.querySelectorAll('.modal').forEach(modal => modal.style.display = 'none'); };

document.addEventListener('DOMContentLoaded', init);