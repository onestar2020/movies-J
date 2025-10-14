// ✅ js/browse.js (NEW FILE)

// Note: Ginagamit pa rin natin ang mga variables na ito, kaya dapat consistent sila sa home.js
const API_KEY = '22d74813ded3fecbe3ef632b4814ae3a';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL_W500 = 'https://image.tmdb.org/t/p/w500';

const urlParams = new URLSearchParams(window.location.search);
const type = urlParams.get('type'); // 'movie', 'tv', or 'anime'
let currentPage = 1;

// --- MAIN FUNCTION PAGKA-LOAD NG BROWSE PAGE ---
document.addEventListener("DOMContentLoaded", () => {
    // I-setup ang page depende sa type
    setupBrowsePage();
    // I-load ang unang set ng resulta
    loadContent(currentPage);

    // Idagdag ang function sa "Load More" button
    document.getElementById('load-more-btn').addEventListener('click', () => {
        currentPage++; // Itaas ang page number
        loadContent(currentPage); // I-load ang susunod na page
    });
});


// Function para i-setup ang title ng page at active link sa navbar
function setupBrowsePage() {
    const titleElement = document.getElementById('browse-title');
    const navLinks = document.querySelectorAll('.nav-links a');
    let title = "Browse"; // Default title

    // Alisin muna ang 'active' class sa lahat ng links
    navLinks.forEach(link => link.classList.remove('active'));

    // I-set ang title at active link depende sa type
    if (type === 'movie') {
        title = "Movies";
        document.querySelector('a[href="browse.html?type=movie"]').classList.add('active');
    } else if (type === 'tv') {
        title = "TV Shows";
        document.querySelector('a[href="browse.html?type=tv"]').classList.add('active');
    } else if (type === 'anime') {
        title = "Anime";
        document.querySelector('a[href="browse.html?type=anime"]').classList.add('active');
    }
    
    titleElement.textContent = title;
    document.title = `${title} - Movies-J`; // I-update din ang tab title
}


// Function para kumuha at mag-display ng content
async function loadContent(page) {
    let endpoint = '';
    
    // Alamin kung anong API endpoint ang gagamitin
    switch (type) {
        case 'movie':
            endpoint = `${BASE_URL}/discover/movie?api_key=${API_KEY}&sort_by=popularity.desc&page=${page}`;
            break;
        case 'tv':
            endpoint = `${BASE_URL}/discover/tv?api_key=${API_KEY}&sort_by=popularity.desc&page=${page}`;
            break;
        case 'anime':
            // Ang anime ay special case ng TV shows na may specific keywords/genres
            endpoint = `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_keywords=210024|287501&with_genres=16&sort_by=popularity.desc&page=${page}`;
            break;
        default:
            // Kung walang type, huwag mag-load
            return;
    }

    try {
        const res = await fetch(endpoint);
        const data = await res.json();
        displayContentGrid(data.results);
    } catch (error) {
        console.error("Failed to load content:", error);
    }
}


// Function para i-display ang mga items sa grid
function displayContentGrid(items) {
    const grid = document.getElementById('browse-grid');

    items.forEach(item => {
        if (item.poster_path) {
            const movieCard = document.createElement('div');
            movieCard.className = 'movie-card';
            // Dahil nasa browse.js tayo, gamitin natin ang showDetailsModal mula sa home.js
            // Ang home.js ay na-load na natin sa browse.html kaya available ang function na ito
            movieCard.onclick = () => showDetailsModal(item);
            
            movieCard.innerHTML = `
                <img src="${IMG_URL_W500}${item.poster_path}" alt="${item.title || item.name}" loading="lazy">
                <p class="movie-title">${item.title || item.name}</p>
            `;
            grid.appendChild(movieCard);
        }
    });
}