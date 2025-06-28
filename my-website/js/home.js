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

async function populateEpisodes(tvId, seasonNumber) {
  const episodeSelector = document.getElementById('episode-selector');
  episodeSelector.innerHTML = '';

  const res = await fetch(`${BASE_URL}/tv/${tvId}/season/${seasonNumber}?api_key=${API_KEY}`);
  const data = await res.json();

  data.episodes.forEach((episode) => {
    const option = document.createElement('option');
    option.value = episode.episode_number;
    option.textContent = `Episode ${episode.episode_number}: ${episode.name}`;
    episodeSelector.appendChild(option);
  });

  const embedURL = `https://vidsrc.to/embed/tv/${tvId}/${seasonNumber}/${data.episodes[0].episode_number}`;
  document.getElementById('modal-video').src = embedURL;
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
  const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
  document.getElementById('modal-title').textContent = item.title || item.name;
  document.getElementById('modal-description').textContent = item.overview;
  document.getElementById('modal-image').src = `${IMG_URL}${item.poster_path}`;
  document.getElementById('modal-rating').innerHTML = '★'.repeat(Math.round(item.vote_average / 2));

  if (mediaType === 'tv') {
    const seasonSelector = document.getElementById('season-selector');
    const episodeSelector = document.getElementById('episode-selector');
    const controls = document.querySelector('.season-episode-selectors');
    controls.style.display = 'block';

    seasonSelector.innerHTML = '';
    episodeSelector.innerHTML = '';

    const seasonsRes = await fetch(`${BASE_URL}/tv/${item.id}?api_key=${API_KEY}`);
    const seasonsData = await seasonsRes.json();

    seasonsData.seasons.forEach((season) => {
      const option = document.createElement('option');
      option.value = season.season_number;
      option.textContent = season.name;
      seasonSelector.appendChild(option);
    });

    await populateEpisodes(item.id, seasonSelector.value);

    seasonSelector.onchange = async () => {
      await populateEpisodes(item.id, seasonSelector.value);
    };

    episodeSelector.onchange = () => {
      const embedURL = `https://vidsrc.to/embed/tv/${item.id}/${seasonSelector.value}/${episodeSelector.value}`;
      document.getElementById('modal-video').src = embedURL;
    };
  } else {
    document.querySelector('.season-episode-selectors').style.display = 'none';
    const trailerUrl = await fetchTrailer(item.id, mediaType);
    document.getElementById('modal-video').src = trailerUrl || '';
  }

  document.getElementById('modal').style.display = 'flex';
}

init();
