const API_KEY = '22d74813ded3fecbe3ef632b4814ae3a';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';
let currentItem;
let currentUpload = null;
let bannerItems = [];
let bannerIndex = 0;
let currentUploadPage = 1;
const uploadsPerPage = 12;

async function loadUploadedMovies(page = 1) {
  const container = document.getElementById('uploaded-movies-list');
  container.innerHTML = '';

  const startIndex = (page - 1) * uploadsPerPage;
  const endIndex = startIndex + uploadsPerPage;
  const pageUploads = uploads.slice(startIndex, endIndex);

  for (const upload of pageUploads) {
    const title = encodeURIComponent(upload.title);
    const res = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${title}`);
    const data = await res.json();
    const movie = data.results[0];

    const div = document.createElement('div');
    div.classList.add('upload-item');

    div.innerHTML = `
      <div style="text-align:center">
        <img src="${movie?.poster_path ? IMG_URL + movie.poster_path : ''}" alt="${upload.title}" style="width:120px;border-radius:5px;cursor:pointer" onclick="showUploadModal('${upload.id}')">
        <p style="margin: 5px 0"><strong>${upload.title}</strong></p>
        ${movie?.overview ? `<p style='font-size:12px;'>${movie.overview.slice(0, 100)}...</p>` : ''}
        ${movie?.vote_average ? `<p style='color:gold;'>${'★'.repeat(Math.round(movie.vote_average / 2))}</p>` : ''}
      </div>
    `;

    container.appendChild(div);
  }

  renderUploadPagination();
}

function renderUploadPagination() {
  const pagination = document.getElementById('upload-pagination');
  if (!pagination) return;

  pagination.innerHTML = '';
  const totalPages = Math.ceil(uploads.length / uploadsPerPage);

  const prevBtn = document.createElement('button');
  prevBtn.textContent = 'Previous';
  prevBtn.disabled = currentUploadPage === 1;
  prevBtn.onclick = () => {
    if (currentUploadPage > 1) {
      currentUploadPage--;
      loadUploadedMovies(currentUploadPage);
    }
  };

  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Next';
  nextBtn.disabled = currentUploadPage === totalPages;
  nextBtn.onclick = () => {
    if (currentUploadPage < totalPages) {
      currentUploadPage++;
      loadUploadedMovies(currentUploadPage);
    }
  };

  pagination.appendChild(prevBtn);
  const pageIndicator = document.createElement('span');
  pageIndicator.textContent = ` Page ${currentUploadPage} of ${totalPages} `;
  pagination.appendChild(pageIndicator);
  pagination.appendChild(nextBtn);
}

async function init() {
  const movies = await fetchTrending('movie');
  const tvShows = await fetchTrending('tv');
  const anime = await fetchTrendingAnime();

  await loadUploadedMovies(currentUploadPage);

  const uploadItems = uploads.map(u => ({
    title: u.title,
    id: u.id,
    isUpload: true
  }));

  const bannerPool = [...movies, ...tvShows, ...uploadItems];
  displayBanner(bannerPool);

  displayList(movies, 'movies-list');
  displayList(tvShows, 'tvshows-list');
  displayList(anime, 'anime-list');
}

init();
