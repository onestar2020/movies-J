const API_KEY = '22d74813ded3fecbe3ef632b4814ae3a';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';
let currentItem;
let bannerItems = [];
let bannerIndex = 0;

async function fetchTrending(type) {
  let allResults = [];
  for (let page = 1; page <= 5; page++) {
    const res = await fetch(`${BASE_URL}/trending/${type}/week?api_key=${API_KEY}&page=${page}`);
    const data = await res.json();
    allResults = allResults.concat(data.results);
  }
  return allResults;
}

async function fetchTrendingAnime() {
  let allResults = [];
  for (let page = 1; page <= 5; page++) {
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

async function displayBanner(item) {
  const banner = document.getElementById('banner');
  const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
  const trailerUrl = await fetchTrailer(item.id, mediaType);

  if (trailerUrl) {
    banner.innerHTML = `
      <iframe width="100%" height="100%" src="${trailerUrl}?autoplay=1&mute=1&controls=0&showinfo=0&modestbranding=1&loop=1&playlist=${trailerUrl.split("/").pop()}"
        frameborder="0" allow="autoplay; encrypted-media" allowfullscreen style="border-radius: 8px; filter: brightness(0.7);"></iframe>
      <div class="banner-buttons">
        <button class="btn-outline" onclick="nextBannerTrailer()">
          <i class="fas fa-random"></i> Next Trailer
        </button>
        <button class="btn-solid" onclick="watchBannerMovie()">
          <i class="fas fa-play"></i> Watch Full Movie
        </button>
      </div>
    `;
  } else {
    banner.style.backgroundImage = `url(${IMG_URL}${item.backdrop_path})`;
    banner.innerHTML = `<h1 id="banner-title">${item.title || item.name}</h1>`;
  }
}

function nextBannerTrailer() {
  bannerIndex = (bannerIndex + 1) % bannerItems.length;
  displayBanner(bannerItems[bannerIndex]);
}

function watchBannerMovie() {
  showDetails(bannerItems[bannerIndex]);
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
  document.getElementById('modal').classList.add('server-enabled');
  document.getElementById('modal').style.display = 'flex';
}

function changeServer() {
  const server = document.getElementById('server').value;
  const type = currentItem.media_type === "movie" ? "movie" : "tv";
  let embedURL = "";
  if (server === "vidsrc.cc") {
    embedURL = `https://vidsrc.cc/v2/embed/${type}/${currentItem.id}`;
  } else if (server === "vidsrc.me") {
    embedURL = `https://vidsrc.net/embed/${type}/?tmdb=${currentItem.id}`;
  } else if (server === "player.videasy.net") {
    embedURL = `https://player.videasy.net/${type}/${currentItem.id}`;
  } else if (server === "multiembed") {
    embedURL = `https://multiembed.mov/?video_id=${currentItem.id}&tmdb=1`;
  } else if (server === "2embed") {
    embedURL = `https://www.2embed.cc/embed/${type}?tmdb=${currentItem.id}`;
  }
  document.getElementById('modal-video').src = embedURL;
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
  document.getElementById('modal-video').src = '';
  document.getElementById('modal').classList.remove('server-enabled');
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
  const query = document.getElementById('search-input').value;
  if (!query.trim()) {
    document.getElementById('search-results').innerHTML = '';
    return;
  }
  const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${query}`);
  const data = await res.json();
  const container = document.getElementById('search-results');
  container.innerHTML = '';
  data.results.forEach(item => {
    if (!item.poster_path) return;
    const img = document.createElement('img');
    img.src = `${IMG_URL}${item.poster_path}`;
    img.alt = item.title || item.name;
    img.onclick = () => {
      closeSearchModal();
      showDetails(item);
    };
    container.appendChild(img);
  });
}

async function addUploadedMovie(fileId, title) {
  const res = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(title)}`);
  const data = await res.json();
  const movie = data.results[0];
  if (!movie || !movie.poster_path) {
    console.warn("Movie not found or no poster:", title);
    return;
  }

  const trailerUrl = await fetchTrailer(movie.id, 'movie');
  const container = document.getElementById('myupload-list');
  const div = document.createElement('div');
  const img = document.createElement('img');
  img.src = `${IMG_URL}${movie.poster_path}`;
  img.alt = title;

  img.onclick = () => {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-description').textContent = movie.overview || "No description available.";
    document.getElementById('modal-image').src = `${IMG_URL}${movie.poster_path}`;
    document.getElementById('modal-rating').innerHTML = '★'.repeat(Math.round(movie.vote_average / 2));

    const modal = document.getElementById('modal');
    modal.classList.remove('server-enabled');
    modal.style.display = 'flex';

    const previewURL = `https://drive.google.com/file/d/${fileId}/preview`;
    const downloadURL = `https://drive.google.com/uc?id=${fileId}&export=download`;
    const videoIframe = document.getElementById('modal-video');
    const switcher = document.getElementById('upload-switcher');
    const downloadBtn = document.getElementById('btn-download');

    const isMKV = title.toLowerCase().includes('.mkv');

    if (trailerUrl) {
      videoIframe.src = trailerUrl;
      switcher.style.display = 'block';
    } else {
      videoIframe.src = previewURL;
      switcher.style.display = 'none';

      const modalDesc = document.getElementById('modal-description');
      modalDesc.innerHTML += `<br><br><span style="color: red; font-weight: bold;">⚠️ No preview available. Please download to watch.</span>`;
    }

    document.getElementById('btn-watch-trailer').onclick = () => {
      videoIframe.src = trailerUrl;
      highlightButton('btn-watch-trailer');
    };
    document.getElementById('btn-watch-drive').onclick = () => {
      videoIframe.src = previewURL;
      highlightButton('btn-watch-drive');
    };

    downloadBtn.href = downloadURL;
    downloadBtn.style.display = 'inline-block';
  };

  div.appendChild(img);
  container.appendChild(div);
}

function highlightButton(activeId) {
  const trailerBtn = document.getElementById('btn-watch-trailer');
  const driveBtn = document.getElementById('btn-watch-drive');
  trailerBtn.classList.remove('btn-solid');
  trailerBtn.classList.add('btn-outline');
  driveBtn.classList.remove('btn-solid');
  driveBtn.classList.add('btn-outline');

  const activeBtn = document.getElementById(activeId);
  activeBtn.classList.remove('btn-outline');
  activeBtn.classList.add('btn-solid');
}

async function init() {
  const movies = await fetchTrending('movie');
  const tvShows = await fetchTrending('tv');
  const anime = await fetchTrendingAnime();

  bannerItems = movies;
  bannerIndex = Math.floor(Math.random() * bannerItems.length);
  displayBanner(bannerItems[bannerIndex]);

  displayList(movies, 'movies-list');
  displayList(tvShows, 'tvshows-list');
  displayList(anime, 'anime-list');

  addUploadedMovie("1KJ_R_RGVGwgpypYNEf-_2gJ6mDfCvLYH", "ARQ");
  addUploadedMovie("1Agy9Z6IlEPwVqUK2VSDpBvpUFklBDOvp", "The Hunger Games");
  addUploadedMovie("1P9y0rzcoDKj0BRA2gaLznP6BtYZlc-lV", "The Hunger Games: Catching Fire");
  addUploadedMovie("1wDCCXjqF9woZAXPMBnYrZnvP_31DBqFP", "The Hunger Games: Mockingjay - Part 2");
  addUploadedMovie("1wfsA6vF6Xyy10qR5EeOQHf7HEj1VtyOt", "Kill Command");
  addUploadedMovie("1kKzOIMcEq76IqmI4Z8AnV2gAkrDhAd15", "Maze Runner: The Death Cure");
  addUploadedMovie("15ue4p4e14u7l_Bxhf5I2KH8BFAbAvi2C", "Morbius");
  addUploadedMovie("16gtWQJpiPF9sEw9ans7x_Ukz2EBDLSKv", "Maze Runner: The Scorch Trials");
  addUploadedMovie("1gqZ_IawXvSj-iQJB6L64kGFkbBg95lGO", "Shaun of the Dead");
  addUploadedMovie("1c4YOkoSiIKvM3ruYXRR2auFrT6hRmAKz", "Smile 2");
  addUploadedMovie("1IKJK2TM13u64knIpX749GIbkxiQxxbzT", "Sting");
  addUploadedMovie("1DDijEmLwM7tqjaQdrpwGzgtjSW0Sws8F", "Smile");
  addUploadedMovie("1_PExsLNP3s9z1QtJJtpQnH_5u5dpQDxp", "The 5th Wave");
  
}

init();