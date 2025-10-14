// ✅ js/browse.js (UPDATED: With Genre Filtering)

const urlParams = new URLSearchParams(window.location.search);
const type = urlParams.get('type'); // 'movie', 'tv', or 'anime'
let currentPage = 1;
let selectedGenre = ''; // BAGO: Variable para sa piniling genre

// --- MAIN FUNCTION PAGKA-LOAD NG BROWSE PAGE ---
document.addEventListener("DOMContentLoaded", () => {
    setupBrowsePage();
    loadGenres(); // BAGO: I-load ang genres sa dropdown
    loadContent(currentPage); // I-load ang unang set ng resulta

    document.getElementById('load-more-btn').addEventListener('click', () => {
        currentPage++;
        loadContent(currentPage);
    });

    // BAGO: Event listener para sa pagbabago ng genre
    document.getElementById('genre-filter').addEventListener('change', (event) => {
        selectedGenre = event.target.value;
        currentPage = 1; // I-reset sa unang page
        const grid = document.getElementById('browse-grid');
        grid.innerHTML = ''; // Linisin ang grid bago mag-load ng bago
        loadContent(currentPage);
    });
});


// Function para i-setup ang title ng page at active link sa navbar
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
        // Itago ang genre filter kung anime, dahil specific na ang query nito
        document.getElementById('genre-filter').style.display = 'none';
    }
    
    if(titleElement) titleElement.textContent = title;
    document.title = `${title} - Movies-J`;
}

// BAGO: Function para kumuha ng genres at ilagay sa dropdown
async function loadGenres() {
    // Ang genre filter ay para lang sa movies at tv shows
    if (type !== 'movie' && type !== 'tv') return;

    const endpoint = `${BASE_URL}/genre/${type}/list?api_key=${API_KEY}`;
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


// IN-UPDATE: Function para kumuha at mag-display ng content, kasama na ang genre
async function loadContent(page) {
    let endpoint = '';
    const genreParam = selectedGenre ? `&with_genres=${selectedGenre}` : '';

    switch (type) {
        case 'movie':
            endpoint = `${BASE_URL}/discover/movie?api_key=${API_KEY}&sort_by=popularity.desc&page=${page}${genreParam}`;
            break;
        case 'tv':
            endpoint = `${BASE_URL}/discover/tv?api_key=${API_KEY}&sort_by=popularity.desc&page=${page}${genreParam}`;
            break;
        case 'anime':
            endpoint = `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_keywords=210024|287501&with_genres=16&sort_by=popularity.desc&page=${page}`;
            break;
        default:
            return;
    }

    try {
        const res = await fetch(endpoint);
        const data = await res.json();
        displayContentGrid(data.results, page === 1); // Ipasa kung ito ba ay unang page load
    } catch (error) {
        console.error("Failed to load content:", error);
    }
}


// IN-UPDATE: Function para i-display ang mga items sa grid (na may option na i-clear)
function displayContentGrid(items, clearGrid) {
    const grid = document.getElementById('browse-grid');
    if (!grid) return;

    if (clearGrid) {
        grid.innerHTML = ''; // Linisin lang kung kinakailangan (e.g., pagpalit ng genre)
    }

    items.forEach(item => {
        if (item.poster_path) {
            const movieCard = document.createElement('div');
            movieCard.className = 'movie-card';
            movieCard.onclick = () => showDetailsModal(item);
            
            movieCard.innerHTML = `
                <img src="${IMG_URL_W500}${item.poster_path}" alt="${item.title || item.name}" loading="lazy">
                <p class="movie-title">${item.title || item.name}</p>
            `;
            grid.appendChild(movieCard);
        }
    });
}
