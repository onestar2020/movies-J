const API_KEY = '22d74813ded3fecbe3ef632b4814ae3a';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';
let currentItem;
let currentUpload = null;
let bannerItems = [];
let bannerIndex = 0;

async function fetchTrending(type) {
  const res = await fetch(`${BASE_URL}/trending/${type}/week?api_key=${API_KEY}`);
  const data = await res.json();
  return data.results;
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
  const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
  const trailerUrl = await fetchTrailer(item.id, mediaType);
  document.getElementById('modal-video').src = trailerUrl || '';
  document.getElementById('modal').style.display = 'flex';
}

function changeServer() {
  const server = document.getElementById('server').value;
  const type = currentItem.media_type === "movie" ? "movie" : "tv";
  let embedURL = "";

  switch (server) {
    case "vidsrc.cc":
      embedURL = `https://vidsrc.cc/v2/embed/${type}/${currentItem.id}`;
      break;
    case "vidsrc.me":
      embedURL = `https://vidsrc.net/embed/${type}/?tmdb=${currentItem.id}`;
      break;
    case "player.videasy.net":
      embedURL = `https://player.videasy.net/${type}/${currentItem.id}`;
      break;
    case "multiembed.mov":
      embedURL = `https://multiembed.mov/${type}/${currentItem.id}`;
      break;
    case "2embed.to":
      embedURL = `https://www.2embed.to/embed/tmdb/${type}?id=${currentItem.id}`;
      break;
    case "zembed.net":
      embedURL = `https://zembed.net/v/${currentItem.id}`;
      break;
    case "curtstream.com":
      embedURL = `https://www.curtstream.com/embed/${type}/${currentItem.id}`;
      break;
    default:
      embedURL = '';
  }

  document.getElementById('modal-video').src = embedURL;
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

  const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
  const data = await res.json();
  const tmdbResults = data.results.filter(item => item.poster_path);

  tmdbResults.forEach(item => {
    const img = document.createElement('img');
    img.src = `${IMG_URL}${item.poster_path}`;
    img.alt = item.title || item.name;
    img.onclick = () => {
      closeSearchModal();
      showDetails(item);
    };
    container.appendChild(img);
  });

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
          <span style="font-size:12px; color:#aaa;">📁 My Upload</span>
        </p>
      `;

      container.appendChild(div);
    }
  });
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

async function loadUploadedMovies() {
  const container = document.getElementById('uploaded-movies-list');
  for (const upload of uploads) {
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
}

async function init() {
  const movies = await fetchTrending('movie');
  await loadUploadedMovies();

  const uploadItems = uploads.map(u => ({
    title: u.title,
    id: u.id,
    isUpload: true
  }));

  const bannerPool = [...movies, ...uploadItems]; // ✅ FIXED: removed tvShows
  displayBanner(bannerPool);
  displayList(movies, 'movies-list');
}


