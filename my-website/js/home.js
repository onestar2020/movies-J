const API_KEY = '22d74813ded3fecbe3ef632b4814ae3a';
const BASE_URL = 'https://api.themoviedb.org/3';

const IMG_URL = 'https://image.tmdb.org/t/p/original';
let currentMoviePage = 1;
let currentTVPage = 1;
let currentAnimePage = 1;
const moviesPerPage = 15;

let movieItems = [];
let tvItems = [];
let animeItems = [];

let currentItem;
let currentUpload = null;
let bannerItems = [];
let bannerIndex = 0;
let currentUploadPage = 1;
const uploadsPerPage = 12;

async function fetchTrending(type) {
  const res = await fetch(`${BASE_URL}/trending/${type}/week?api_key=${API_KEY}`);
  const data = await res.json();
  return data.results;
}

async function fetchTrendingAnime() {
  let allResults = [];
  for (let page = 1; page <= 3; page++) {
    const res = await fetch(`${BASE_URL}/trending/tv/week?api_key=${API_KEY}&page=${page}`);
    const data = await res.json();
    const filtered = data.results.filter(item =>
      item.original_language === 'ja' && item.genre_ids.includes(16)
    );
    allResults = allResults.concat(filtered);
  }
  return allResults;
}

async function fetchTrailer(id, mediaType) {
  const res = await fetch(`${BASE_URL}/${mediaType}/${id}/videos?api_key=${API_KEY}`);
  const data = await res.json();
  const trailer = data.results.find(video => video.type === "Trailer" && video.site === "YouTube");
  return trailer ? `https://www.youtube.com/embed/${trailer.key}` : null;
}

async function playBannerTrailer() {
  const bannerTitle = document.getElementById('banner-title');
  const trailerIframe = document.getElementById('trailer');
  const item = bannerItems[bannerIndex];

  bannerTitle.textContent = item.title || item.name;

  if (item.isUpload) {
    trailerIframe.src = `https://drive.google.com/file/d/${item.id}/preview`;
  } else {
    const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
    const url = await fetchTrailer(item.id, mediaType);
    trailerIframe.src = url ? `${url}?autoplay=1&mute=1&controls=0&loop=1&playlist=${url.split('/').pop()}` : '';
  }
}

function nextBannerTrailer() {
  bannerIndex = (bannerIndex + 1) % bannerItems.length;
  playBannerTrailer();
}

function watchCurrentBanner() {
  if (!bannerItems.length) return;

  const currentItem = bannerItems[bannerIndex];
  if (currentItem.isUpload) {
    showUploadModal(currentItem.id);
  } else {
    goToMovie(currentItem);
  }
}





function displayBanner(items) {
  bannerItems = items;
  bannerIndex = 0;
  playBannerTrailer();
}

function displayList(items, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  items.forEach(item => {
    const img = document.createElement('img');
    img.src = `${IMG_URL}${item.poster_path}`;
    img.alt = item.title || item.name;
   img.onclick = () => goToMovie(item);


    container.appendChild(img);
  });
}

async function showDetails(item) {
  currentItem = item;

  // ✅ Save to Watch History (TMDB items only)
  saveToWatchHistory({
    id: item.id,
    title: item.title || item.name,
    poster_path: item.poster_path,
    type: item.media_type || (item.first_air_date ? 'tv' : 'movie')
  });

  document.getElementById('modal-title').textContent = item.title || item.name;
  document.getElementById('modal-description').textContent = item.overview;
  document.getElementById('modal-image').src = `${IMG_URL}${item.poster_path}`;
  document.getElementById('modal-rating').innerHTML = '★'.repeat(Math.round(item.vote_average / 2));
  document.getElementById('modal-video').src = '';
  document.getElementById('cast-list').innerHTML = '';
  document.getElementById('similar-movies').innerHTML = '';

  const type = item.media_type || (item.first_air_date ? 'tv' : 'movie');

  // ✅ Fetch Cast
  fetch(`${BASE_URL}/${type}/${item.id}/credits?api_key=${API_KEY}`)
    .then(res => res.json())
    .then(data => {
      const castList = document.getElementById('cast-list');
      data.cast?.slice(0, 12).forEach(cast => {
        const li = document.createElement('li');
        li.innerHTML = `
          <img src="${cast.profile_path ? IMG_URL + cast.profile_path : 'https://via.placeholder.com/80x120?text=No+Image'}" alt="${cast.name}" style="width:60px; border-radius:6px; margin-right:10px; vertical-align:middle;">
          <span style="color:#ccc;">${cast.name}</span>
        `;
        castList.appendChild(li);
      });
    });

  // ✅ Fetch Similar
  fetch(`${BASE_URL}/${type}/${item.id}/similar?api_key=${API_KEY}`)
    .then(res => res.json())
    .then(data => {
      const similarContainer = document.getElementById('similar-movies');
      data.results?.slice(0, 10).forEach(similar => {
        const card = document.createElement('div');
        card.className = 'similar-card';
        card.style = `
          display:inline-block; 
          width:100px; 
          margin:5px; 
          cursor:pointer; 
          text-align:center;
        `;
        card.innerHTML = `
          <img src="${similar.poster_path ? IMG_URL + similar.poster_path : 'https://via.placeholder.com/100x150?text=No+Image'}" alt="${similar.title || similar.name}" style="width:100px; border-radius:8px;">
          <div style="font-size:12px; color:#fff; margin-top:4px;">${similar.title || similar.name}</div>
        `;
        card.onclick = () => showDetails(similar);
        similarContainer.appendChild(card);
      });
    });

  document.getElementById('modal').style.display = 'flex';

  const isTV = item.media_type === "tv" || item.first_air_date;

  const seasonWrapper = document.querySelector('.season-episode-selectors');
  const seasonSelect = document.getElementById('season-selector');
  const episodeSelect = document.getElementById('episode-selector');

  if (isTV) {
    seasonWrapper.style.display = 'flex';
    const res = await fetch(`${BASE_URL}/tv/${item.id}?api_key=${API_KEY}`);
    const data = await res.json();

    seasonSelect.innerHTML = '';
    data.seasons.forEach(season => {
      const option = document.createElement('option');
      option.value = season.season_number;
      option.textContent = season.name;
      seasonSelect.appendChild(option);
    });

    seasonSelect.onchange = async () => {
      const selectedSeason = seasonSelect.value;
      const epRes = await fetch(`${BASE_URL}/tv/${item.id}/season/${selectedSeason}?api_key=${API_KEY}`);
      const epData = await epRes.json();

      episodeSelect.innerHTML = '';
      epData.episodes.forEach(ep => {
        const epOption = document.createElement('option');
        epOption.value = ep.episode_number;
        epOption.textContent = `Episode ${ep.episode_number}: ${ep.name}`;
        episodeSelect.appendChild(epOption);
      });

      episodeSelect.selectedIndex = 0;
      changeServer(true, 0);

      episodeSelect.onchange = () => changeServer(true, 0);
    };

    seasonSelect.dispatchEvent(new Event('change'));
  } else {
    seasonWrapper.style.display = 'none';
  }
}

function changeServer(auto = false, index = 0) {
  const servers = SERVER_LIST.map(s => s.url);
  const serverSelect = document.getElementById("server");
  const server = auto ? servers[index] : serverSelect.value;
  if (auto) serverSelect.value = servers[index]; // ← sync dropdown on auto

  const season = document.getElementById('season-selector')?.value || 1;
  const episode = document.getElementById('episode-selector')?.value || 1;

  const url = generateEmbedURL(server, currentItem, season, episode); // ✅ THIS LINE IS CORRECT

  const iframe = document.getElementById("modal-video");
  iframe.src = "";
  iframe.setAttribute('title', 'Switching to server: ' + server);
  iframe.src = url;

  if (!auto) {
    document.getElementById('active-server-label').textContent = `Now playing from: ${server}`;
  }

  // Auto switch fallback with timeout
  let fallbackTimer = setTimeout(() => {
    if (auto && index + 1 < servers.length) {
      changeServer(true, index + 1);
    }
  }, 5000);

  iframe.onload = () => {
    clearTimeout(fallbackTimer);
    if (auto) {
      document.getElementById('active-server-label').textContent = `Auto-selected server: ${server}`;
    }
  };

  iframe.onerror = () => {
    clearTimeout(fallbackTimer);
    if (auto && index + 1 < servers.length) {
      changeServer(true, index + 1);
    }
  };
}





  


function closeModal() {
  document.getElementById('modal').style.display = 'none';
  document.getElementById('modal-video').src = '';
}

function openSearchModal() {
  document.getElementById('search-modal').style.display = 'flex';
  document.getElementById('search-input').focus();
}

function closeSearchModal() {
  document.getElementById('search-modal').style.display = 'none';
  document.getElementById('search-results').innerHTML = '';
}

async function searchTMDB() {
  const query = document.getElementById('search-input').value.trim();
  const container = document.getElementById('search-results');
  container.innerHTML = '';
  if (!query) return;

  const tmdbSection = document.createElement('div');
  const uploadedSection = document.createElement('div');

  const tmdbHeader = document.createElement('h3');
  tmdbHeader.textContent = '🎬 Search Results from TMDB';
  tmdbHeader.style.margin = '10px 0';

  const uploadHeader = document.createElement('h3');
  uploadHeader.textContent = '📁 My Uploaded Movies';
  uploadHeader.style.margin = '20px 0';

  tmdbSection.appendChild(tmdbHeader);
  uploadedSection.appendChild(uploadHeader);

  const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
  const data = await res.json();
  const tmdbResults = data.results.filter(item => item.poster_path);

tmdbResults.forEach(item => {
  const img = document.createElement('img');
  img.src = `${IMG_URL}${item.poster_path}`;
  img.alt = item.title || item.name;
  img.style.width = '120px';
  img.style.margin = '5px';
  img.style.borderRadius = '5px';
  img.style.cursor = 'pointer';

img.onclick = () => {
  closeSearchModal();
  goToMovie(item);
};


  tmdbSection.appendChild(img); // ✅ dapat nasa loob ng forEach
});


  const hasUploadedMatch = uploads.some(upload =>
    upload.title.toLowerCase().includes(query.toLowerCase())
  );

  uploads.forEach(upload => {
    if (upload.title.toLowerCase().includes(query.toLowerCase())) {
      const div = document.createElement('div');
      div.style.textAlign = 'center';
      div.style.marginTop = '15px';

      div.innerHTML = `
        <img src="https://drive.google.com/thumbnail?id=${upload.id}&sz=w200"
             alt="${upload.title}"
             style="width:120px;border-radius:5px;cursor:pointer"
             onclick="showUploadModal('${upload.id}')">
        <p style="margin: 5px 0; font-size:14px;">
          <strong>${upload.title}</strong><br>
          <span style="font-size:12px; color:#4CAF50;">📁 Free Movie</span>
        </p>
      `;
      uploadedSection.appendChild(div);
    }
  });

  if (hasUploadedMatch) container.appendChild(uploadedSection);
  if (tmdbResults.length > 0) container.appendChild(tmdbSection);
}

function showUploadModal(videoId) {
  
  const upload = uploads.find(u => u.id === videoId);
  if (!upload) return;

  currentUpload = upload;

saveToWatchHistory({
  id: upload.id,
  title: upload.title,
  poster_path: poster,
  type: 'upload'
});



  const title = encodeURIComponent(upload.title);

  fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${title}`)
    .then(res => res.json())


   .then(data => {
  const movie = data.results[0] || {};
  const poster = movie.poster_path || ''; // ✅ Define this FIRST

  // ✅ Then use it
  saveToWatchHistory({
    id: upload.id,
    title: upload.title,
    poster_path: poster,
    type: 'upload'
  });

  document.getElementById('upload-title').textContent = movie.title || upload.title;
  document.getElementById('upload-description').textContent = movie.overview || "No description available.";
  document.getElementById('upload-rating').innerHTML = movie.vote_average
    ? '★'.repeat(Math.round(movie.vote_average / 2))
    : 'Not rated';

  document.getElementById('upload-trailer-btn').onclick = () => watchUploadTrailer();
  document.getElementById('upload-watch-btn').onclick = () => playUploadedVideo();
  document.getElementById('upload-download-btn').href = `https://drive.google.com/u/0/uc?id=${upload.id}&export=download`;

  document.getElementById('upload-video').src = `https://drive.google.com/file/d/${upload.id}/preview`;
  document.getElementById('upload-modal').style.display = 'flex';
});

}
function saveToWatchHistory({ title, id, type = 'upload', poster_path = '' }) {
  let history = JSON.parse(localStorage.getItem("watchHistory") || "[]");

  const exists = history.find(item => item.id === id && item.type === type);
  if (!exists) {
    history.unshift({ title, id, type, poster_path, timestamp: Date.now() });
    if (history.length > 20) history = history.slice(0, 20);
    localStorage.setItem("watchHistory", JSON.stringify(history));
  }
}

function playUploadedVideo() {
  if (!currentUpload) return;
  document.getElementById('upload-video').src = `https://drive.google.com/file/d/${currentUpload.id}/preview`;
}

async function watchUploadTrailer() {
  if (!currentUpload) return;

  const title = encodeURIComponent(currentUpload.title);
  const res = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${title}`);
  const data = await res.json();
  const movie = data.results[0];

  if (movie && movie.id) {
    const trailerRes = await fetch(`${BASE_URL}/movie/${movie.id}/videos?api_key=${API_KEY}`);
    const trailerData = await trailerRes.json();
    const trailer = trailerData.results.find(video => video.type === "Trailer" && video.site === "YouTube");

    if (trailer) {
      document.getElementById('upload-video').src = `https://www.youtube.com/embed/${trailer.key}?autoplay=1`;
      return;
    }
  }

  const searchUrl = `https://www.youtube.com/results?search_query=${title}+official+trailer`;
  window.open(searchUrl, '_blank');
}

function closeUploadModal() {
  document.getElementById('upload-modal').style.display = 'none';
  document.getElementById('upload-video').src = '';
}

async function loadUploadedMovies(page = 1) {
  const container = document.getElementById('uploaded-movies-list');
  container.innerHTML = '';

  const startIndex = (page - 1) * uploadsPerPage;
  const endIndex = startIndex + uploadsPerPage;
  const uploadsToDisplay = uploads.slice(startIndex, endIndex);

  for (const upload of uploadsToDisplay) {
    const title = encodeURIComponent(upload.title);
    const res = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${title}`);
    const data = await res.json();
    const movie = data.results[0];

    const div = document.createElement('div');
    div.classList.add('upload-item');
    div.innerHTML = `
      <div style="text-align:center">
        <img src="${movie?.poster_path ? IMG_URL + movie.poster_path : ''}" 
             alt="${upload.title}" 
             style="width:120px;border-radius:5px;cursor:pointer" 
             onclick="showUploadModal('${upload.id}')">
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
  const paginationContainer = document.getElementById('upload-pagination');
  paginationContainer.innerHTML = '';
  const totalPages = Math.ceil(uploads.length / uploadsPerPage);

  const pageInfo = document.createElement('span');
  pageInfo.textContent = `Page ${currentUploadPage} of ${totalPages}`;
  pageInfo.style.margin = '0 10px';
  pageInfo.style.fontWeight = 'bold';
  pageInfo.style.color = '#00BCD4';

  if (currentUploadPage > 1) {
    const firstBtn = document.createElement('button');
    firstBtn.textContent = '⏪ First';
    firstBtn.onclick = () => {
      currentUploadPage = 1;
      loadUploadedMovies(currentUploadPage);
    };
    paginationContainer.appendChild(firstBtn);

    const prevBtn = document.createElement('button');
    prevBtn.textContent = '⬅️ Previous';
    prevBtn.onclick = () => {
      currentUploadPage--;
      loadUploadedMovies(currentUploadPage);
    };
    paginationContainer.appendChild(prevBtn);
  }

  paginationContainer.appendChild(pageInfo);

  if (currentUploadPage < totalPages) {
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next ⏩';
    nextBtn.onclick = () => {
      currentUploadPage++;
      loadUploadedMovies(currentUploadPage);
    };
    paginationContainer.appendChild(nextBtn);

    const lastBtn = document.createElement('button');
    lastBtn.textContent = 'Last ⏩';
    lastBtn.onclick = () => {
      currentUploadPage = totalPages;
      loadUploadedMovies(currentUploadPage);
    };
    paginationContainer.appendChild(lastBtn);
  }
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









window.showUploadModal = showUploadModal;
window.closeModal = closeModal;
window.closeUploadModal = closeUploadModal;
window.nextBannerTrailer = nextBannerTrailer;
window.watchCurrentBanner = watchCurrentBanner;
window.changeServer = changeServer;
window.openSearchModal = openSearchModal;
window.closeSearchModal = closeSearchModal;
window.searchTMDB = searchTMDB;





function loadWatchHistory() {
  const history = JSON.parse(localStorage.getItem("watchHistory") || "[]");
  const container = document.getElementById("watch-history-list");
  container.innerHTML = '';

  // ✅ SORT BY LATEST VIEWED
  const sorted = history.sort((a, b) => b.timestamp - a.timestamp);

  sorted.forEach(item => {
    const div = document.createElement("div");
    div.classList.add("upload-item");
    div.innerHTML = `
      <div style="text-align:center">
        <img src="${item.poster_path ? IMG_URL + item.poster_path : 'https://via.placeholder.com/120x180?text=No+Image'}" 
             alt="${item.title}" 
             style="width:120px;border-radius:5px;cursor:pointer" 
             onclick="${item.type === 'upload'
               ? `showUploadModal('${item.id}')`
               : `window.location.href='movie.html?id=${item.id}&type=${item.type || 'movie'}'`}">
        <p><strong>${item.title}</strong></p>


      <button onclick="${
  item.type === 'upload'
    ? `showUploadModal('${item.id}')`
    : `goToMovie(${JSON.stringify(item).replace(/"/g, '&quot;')})`
}">▶ Resume</button>


      </div>
    `;
    container.appendChild(div);
  });
}


document.addEventListener('DOMContentLoaded', async () => {
  await init();
    loadWatchHistory(); // ✅ Load sorted Watch History

});

function goToMovie(item) {
  const type = item.media_type || (item.first_air_date ? 'tv' : 'movie');

  // Save to history
  saveToWatchHistory({
    id: item.id,
    title: item.title || item.name,
    poster_path: item.poster_path,
    type: type
  });

  // Redirect
  window.location.href = `movie.html?id=${item.id}&type=${type}`;
}
