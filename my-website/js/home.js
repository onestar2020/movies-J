// =================== HOME.JS - START ===================

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

  const tmdbResults = data.results;

  tmdbResults.forEach(item => {
    const poster = item.poster_path ? `${IMG_URL}${item.poster_path}` : 'https://via.placeholder.com/120x180?text=No+Image';
    const div = document.createElement('div');
    div.style.textAlign = 'center';
    div.style.margin = '15px 0';
    div.innerHTML = `
      <img src="${poster}" alt="${item.title || item.name}" style="width:120px;border-radius:5px;cursor:pointer" onclick='closeSearchModal(); showDetails(${JSON.stringify(item).replace(/'/g, "\'")})'>
      <p style="margin: 5px 0; font-size:14px;"><strong>${item.title || item.name}</strong><br><span style="font-size:12px; color:#00bcd4;">🎬 TMDB Result</span></p>
    `;
    container.appendChild(div);
  });

  if (typeof uploads !== 'undefined') {
    uploads.forEach(upload => {
      if (upload.title.toLowerCase().includes(query.toLowerCase())) {
        const div = document.createElement('div');
        div.style.textAlign = 'center';
        div.style.marginTop = '15px';
        div.innerHTML = `
          <img src="https://drive.google.com/thumbnail?id=${upload.id}&sz=w200" alt="${upload.title}" style="width:120px;border-radius:5px;cursor:pointer" onclick="showUploadModal('${upload.id}')">
          <p style="margin: 5px 0; font-size:14px;"><strong>${upload.title}</strong><br><span style="font-size:12px; color:#aaa;">📁 My Uploaded</span></p>
        `;
        container.appendChild(div);
      }
    });
  }
}

// =================== HOME.JS - END ===================
