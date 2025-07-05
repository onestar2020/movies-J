console.log("✅ home.js loaded");
console.log("📁 uploads = ", typeof uploads);


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

async function init() {
  try {
    const movies = await fetchTrending('movie');
    await loadUploadedMovies(currentUploadPage);

    const uploadItems = uploads.map(u => ({
      title: u.title,
      id: u.id,
      isUpload: true
    }));

    const bannerPool = [...movies, ...uploadItems];

    displayBanner(bannerPool);
    displayList(movies, 'movies-list');
  } catch (e) {
    console.error("❌ Failed in init():", e);
    alert("Something went wrong while loading movies. Please try again later.");
  }
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

  const seasonSelect = document.getElementById('season-selector');
  const episodeSelect = document.getElementById('episode-selector');
  const type = item.media_type || (item.first_air_date ? 'tv' : 'movie');

  if (type !== 'tv') {
    document.querySelector('.season-episode-selectors').style.display = 'none';
    return;
  }

  // ✅ THIS WAS MISSING IN YOUR SECOND CODE
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

  // Trigger the default season load
  seasonSelect.selectedIndex = 0;
  seasonSelect.dispatchEvent(new Event('change'));

  document.querySelector('.season-episode-selectors').style.display = 'block';
}



function changeServer(auto = false, index = 0) {
  const servers = [
    "vidsrc.cc", "vidsrc.me", "player.videasy.net", "multiembed.mov",
    "2embed.to", "zembed.net", "curtstream.com", "vidsrc.pro",
    "autoembed.to", "2embed.cc", "dopebox.to", "sflix.to"
  ];

  const serverSelect = document.getElementById("server");
const server = auto ? servers[index] : serverSelect.value;
if (auto) serverSelect.value = servers[index];  // ← sync dropdown on auto

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
    case "megacloud.tv":
      url = isTV
        ? `https://megacloud.tv/embed?t=tv&id=${id}&s=${season}&e=${episode}`
        : `https://megacloud.tv/embed?t=movie&id=${id}`;
      break;

    case "fzmovies.xyz":
      url = isTV
        ? `https://fzmovies.xyz/tv/${id}/${season}/${episode}`
        : `https://fzmovies.xyz/movie/${id}`;
      break;



    default:
      url = "";
  }

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
  }, 5000); // 5 seconds timeout fallback

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
  const tmdbResults = data.results.filter(item =>
  item.poster_path && (item.media_type === 'movie' || (!item.media_type && !item.first_air_date))
);


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

    // Manually set media_type if missing
    if (!item.media_type) {
      item.media_type = item.first_air_date ? 'tv' : 'movie';
    }

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
  if (!hasUploadedMatch && tmdbResults.length === 0) {
  const noResult = document.createElement('p');
  noResult.textContent = 'No matching movie found.';
  noResult.style.textAlign = 'center';
  noResult.style.color = '#ccc';
  noResult.style.marginTop = '20px';
  container.appendChild(noResult);
}

}

function showUploadModal(videoId) {
  const upload = uploads.find(u => u.id === videoId);
  if (!upload) return;

  currentUpload = upload;
  const title = encodeURIComponent(upload.title);

  fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${title}`)
    .then(res => res.json())
    .then(data => { document.getElementById('upload-download-btn').href = `https://drive.google.com/u/0/uc?id=${upload.id}&export=download`;
document.getElementById('startDownloadBtn').setAttribute("data-download", `https://drive.google.com/u/0/uc?id=${upload.id}&export=download`);

      const movie = data.results[0] || {};

      document.getElementById('upload-title').textContent = movie.title || upload.title;
      document.getElementById('upload-description').textContent = movie.overview || "No description available.";
      document.getElementById('upload-rating').innerHTML = movie.vote_average
        ? '★'.repeat(Math.round(movie.vote_average / 2))
        : 'Not rated';

      document.getElementById('upload-trailer-btn').onclick = () => watchUploadTrailer();
      document.getElementById('upload-watch-btn').onclick = () => playUploadedVideo();
     


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

   alert("No official trailer found.");

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

    // 👉 Create main container
    const div = document.createElement('div');
    div.classList.add('upload-item');
    div.style.textAlign = 'center';
    div.style.marginBottom = '20px';

    // 👉 Create image
    const img = document.createElement('img');
    img.src = movie?.poster_path ? IMG_URL + movie.poster_path : '';
    img.alt = upload.title;
    img.style.width = '120px';
    img.style.borderRadius = '5px';
    img.style.cursor = 'pointer';

    // ✅ Add click event to image
    img.addEventListener('click', () => showUploadModal(upload.id));

    // 👉 Title
    const titleElem = document.createElement('p');
    titleElem.innerHTML = `<strong>${upload.title}</strong>`;

    // 👉 Add to div
    div.appendChild(img);
    div.appendChild(titleElem);

    // 👉 Description (optional)
    if (movie?.overview) {
      const desc = document.createElement('p');
      desc.style.fontSize = '12px';
      desc.textContent = movie.overview.slice(0, 100) + '...';
      div.appendChild(desc);
    }

    // 👉 Rating (optional)
    if (movie?.vote_average) {
      const rating = document.createElement('p');
      rating.style.color = 'gold';
      rating.textContent = '★'.repeat(Math.round(movie.vote_average / 2));
      div.appendChild(rating);
    }

    // 👉 Add to container
    container.appendChild(div);
  }

  // 👉 Render pagination as usual
  renderUploadPagination();
}


function renderUploadPagination() {
  const paginationContainer = document.getElementById('upload-pagination');
  paginationContainer.innerHTML = '';
  const totalPages = Math.ceil(uploads.length / uploadsPerPage);

  // ⏪ First Page (SHOW ONLY IF NOT ON PAGE 1)
  if (currentUploadPage > 1) {
    const firstBtn = document.createElement('button');
    firstBtn.textContent = '⏪ First Page';
    firstBtn.onclick = () => {
      currentUploadPage = 1;
      loadUploadedMovies(currentUploadPage);
    };
    paginationContainer.appendChild(firstBtn);
  }

  // ⬅️ Previous Page (SHOW ONLY IF NOT ON PAGE 1)
  if (currentUploadPage > 1) {
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '⬅️ Previous Page';
    prevBtn.onclick = () => {
      currentUploadPage--;
      loadUploadedMovies(currentUploadPage);
    };
    paginationContainer.appendChild(prevBtn);
  }

  // 📄 Page Indicator
  const info = document.createElement('span');
  info.textContent = ` Page ${currentUploadPage} of ${totalPages} `;
  info.style.color = '#fff';
  info.style.margin = '0 10px';
  paginationContainer.appendChild(info);

  // ➡️ Next Page (SHOW ONLY IF NOT ON LAST PAGE)
  if (currentUploadPage < totalPages) {
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next Page ➡️';
    nextBtn.onclick = () => {
      currentUploadPage++;
      loadUploadedMovies(currentUploadPage);
    };
    paginationContainer.appendChild(nextBtn);
  }
}

init().catch(err => {
  console.error("❌ Error during initialization:", err);
});



