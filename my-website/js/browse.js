// ✅ js/browse.js (SUPER SECURE VERSION)

const urlParams = new URLSearchParams(window.location.search);
const type = urlParams.get('type'); 
let currentPage = 1;
let selectedGenre = ''; 

// Ginagamit na natin ang BASE_URL at IMG_URL_W500 mula sa home.js
// Hindi na kailangan i-declare ulit dito kung nauna nang na-load ang home.js

document.addEventListener("DOMContentLoaded", () => {
    setupBrowsePage();
    loadGenres(); 
    loadContent(currentPage);

    document.getElementById('load-more-btn').addEventListener('click', () => {
        currentPage++;
        loadContent(currentPage);
    });

    document.getElementById('genre-filter').addEventListener('change', (event) => {
        selectedGenre = event.target.value;
        currentPage = 1; 
        const grid = document.getElementById('browse-grid');
        grid.innerHTML = ''; 
        loadContent(currentPage);
    });
});


function setupBrowsePage() {
    const titleElement = document.getElementById('browse-title');
    const navLinks = document.querySelectorAll('.nav-links a');
    let title = "Browse";

    navLinks.forEach(link => link.classList.remove('active'));

    if (type === 'movie') {
        title = "Movies";
        const movieLink = document.querySelector('a[href="browse.html?type=movie"]');
        if (movieLink) movieLink.classList.add('active');
    } else if (type === 'tv') {
        title = "TV Shows";
        const tvLink = document.querySelector('a[href="browse.html?type=tv"]');
        if (tvLink) tvLink.classList.add('active');
    } else if (type === 'anime') {
        title = "Anime";
        const animeLink = document.querySelector('a[href="browse.html?type=anime"]');
        if (animeLink) animeLink.classList.add('active');
        document.getElementById('genre-filter').style.display = 'none';
    }
    
    if(titleElement) titleElement.textContent = title;
    document.title = `${title} - Movies-J`;
}

async function loadGenres() {
    if (type !== 'movie' && type !== 'tv') return;

    // Tinanggal ang API_KEY
    const endpoint = `${BASE_URL}/genre/${type}/list`;
    try {
        const res = await fetch(endpoint);
        const data = await res.json();
        const genreFilter = document.getElementById('genre-filter');
        
        data.genres.forEach(genre => {
            const option = document.createElement('option');
            option.value = genre.id;
            option.textContent = genre.name;
            genreFilter.appendChild(option);
        });
    } catch (error) {
        console.error("Failed to load genres:", error);
    }
}

async function loadContent(page) {
    let endpoint = '';
    const genreParam = selectedGenre ? `&with_genres=${selectedGenre}` : '';

    switch (type) {
        case 'movie':
            endpoint = `${BASE_URL}/discover/movie?sort_by=popularity.desc&page=${page}${genreParam}`;
            break;
        case 'tv':
            endpoint = `${BASE_URL}/discover/tv?sort_by=popularity.desc&page=${page}${genreParam}`;
            break;
        case 'anime':
            endpoint = `${BASE_URL}/discover/tv?with_keywords=210024|287501&with_genres=16&sort_by=popularity.desc&page=${page}`;
            break;
        default:
            return;
    }

    try {
        const res = await fetch(endpoint);
        const data = await res.json();
        displayContentGrid(data.results, page === 1); 
    } catch (error) {
        console.error("Failed to load content:", error);
    }
}

function displayContentGrid(items, clearGrid) {
    const grid = document.getElementById('browse-grid');
    if (!grid) return;

    if (clearGrid) {
        grid.innerHTML = '';
    }

    items.forEach(item => {
        if (item.poster_path) {
            const movieCard = document.createElement('div');
            movieCard.className = 'movie-card';
            movieCard.onclick = () => showDetailsModal(item);
            
            // Tiyaking ang IMG_URL_W500 ay available (mula sa home.js)
            movieCard.innerHTML = `
                <img src="${typeof IMG_URL_W500 !== 'undefined' ? IMG_URL_W500 : 'https://image.tmdb.org/t/p/w500'}${item.poster_path}" alt="${item.title || item.name}" loading="lazy">
                <p class="movie-title">${item.title || item.name}</p>
            `;
            grid.appendChild(movieCard);
        }
    });
}