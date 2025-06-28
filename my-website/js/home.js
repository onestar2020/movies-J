const API_KEY = '22d74813ded3fecbe3ef632b4814ae3a';
const BASE_URL = 'https://api.themoviedb.org/3';

const IMG_URL = 'https://image.tmdb.org/t/p/original';
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
  const item = bannerItems[bannerIndex];
  if (!item) return;

  if (item.isUpload) {
    showUploadModal(item.id);
  } else {
    showDetails(item);
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
    img.onclick = () => showDetails(item);
    container.appendChild(img);
  });
}

async function showDetails(item) {
  currentItem = item;
  document.getElementById('modal-title').textContent = item.title || item.name;
  document.getElementById('modal-description').textContent = item.overview;
  document.getElementById('modal-image').src = `${IMG_URL}${item.poster_path}`;
  document.getElementById('modal-rating').innerHTML = '★'.repeat(Math.round(item.vote_average / 2));
  document.getElementById('modal-video').src = '';
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

  // Auto-select episode 1
  episodeSelect.selectedIndex = 0;

  // ⏯ Update video after season loads
  changeServer(true, 0);


  // Re-assign onchange handler (needed every time season changes)
  episodeSelect.onchange = () => changeServer(true, 0);

};


    // Trigger default load for first season
    seasonSelect.dispatchEvent(new Event('change'));
  } else {
    seasonWrapper.style.display = 'none';
  }
}

function changeServer(auto = false, index = 0) {
  const servers = [
    "vidsrc.cc", "vidsrc.me", "player.videasy.net", "multiembed.mov",
    "2embed.to", "zembed.net", "curtstream.com", "vidsrc.pro",
    "autoembed.to", "2embed.cc", "dopebox.to", "sflix.to"
  ];

  const server = auto ? servers[index] : document.getElementById("server").value;
  const type = currentItem.media_type === "movie" ? "movie" : "tv";
  const isTV = type === "tv";
  const seasonSelect = document.getElementById('season-selector');
  const episodeSelect = document.getElementById('episode-selector');
  const season = seasonSelect?.value;
  const episode = episodeSelect?.value;
  const id = currentItem.id;

  let url = "";

  switch (server) {
    case "vidsrc.cc":
      url = isTV ? `https://vidsrc.cc/v2/embed/tv/${id}/${season}/${episode}` : `https://vidsrc.cc/v2/embed/${type}/${id}`; break;
    case "vidsrc.me":
      url = isTV ? `https://vidsrc.me/embed/tv?tmdb=${id}&season=${season}&episode=${episode}` : `https://vidsrc.net/embed/${type}/?tmdb=${id}`; break;
    case "player.videasy.net":
      url = isTV ? `https://player.videasy.net/tv/${id}/${season}/${episode}` : `https://player.videasy.net/${type}/${id}`; break;
    case "multiembed.mov":
      url = isTV ? `https://multiembed.mov/tv/${id}/${season}/${episode}` : `https://multiembed.mov/${type}/${id}`; break;
    case "2embed.to":
      url = isTV ? `https://www.2embed.to/embed/tmdb/tv?id=${id}&s=${season}&e=${episode}` : `https://www.2embed.to/embed/tmdb/${type}?id=${id}`; break;
    case "zembed.net":
      url = `https://zembed.net/v/${id}`; break;
    case "curtstream.com":
      url = isTV ? `https://www.curtstream.com/embed/tv/${id}/${season}/${episode}` : `https://www.curtstream.com/embed/${type}/${id}`; break;
    case "vidsrc.pro":
      url = isTV ? `https://vidsrc.pro/embed/tv/${id}/${season}/${episode}` : `https://vidsrc.pro/embed/${type}/${id}`; break;
    case "autoembed.to":
      url = isTV ? `https://autoembed.to/tv/tmdb/${id}/${season}-${episode}` : `https://autoembed.to/movie/tmdb/${id}`; break;
    case "2embed.cc":
      url = isTV ? `https://2embed.cc/embedtv/${id}/${season}-${episode}` : `https://2embed.cc/embed/${id}`; break;
    case "dopebox.to":
      url = isTV ? `https://dopebox.to/embedtv/${id}/${season}/${episode}` : `https://dopebox.to/embed/${id}`; break;
    case "sflix.to":
      url = isTV ? `https://sflix.to/embed/tv/${id}/${season}/${episode}` : `https://sflix.to/embed/movie/${id}`; break;
    default:
      url = "";
  }

  const iframe = document.getElementById("modal-video");
  iframe.src = url;

  // Auto fallback: if load fails, try next
    iframe.onerror = () => {
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
      showDetails(item);
    };
    tmdbSection.appendChild(img);
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
  const title = encodeURIComponent(upload.title);

  fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${title}`)
    .then(res => res.json())
    .then(data => {
      const movie = data.results[0] || {};

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

  if (currentUploadPage > 1) {
    const firstBtn = document.createElement('button');
    firstBtn.textContent = '⏪ First Page';
    firstBtn.onclick = () => {
      currentUploadPage = 1;
      loadUploadedMovies(currentUploadPage);
    };
    paginationContainer.appendChild(firstBtn);
  }

  if (currentUploadPage < totalPages) {
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next Page ⏩';
    nextBtn.onclick = () => {
      currentUploadPage++;
      loadUploadedMovies(currentUploadPage);
    };
    paginationContainer.appendChild(nextBtn);
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

init();
