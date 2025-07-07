function generateEmbedURL(server, meta, season = 1, episode = 1) {
  const { id, media_type } = meta;
  if (media_type === "tv") {
    return `https://${server}/embed/tv?id=${id}&s=${season}&e=${episode}`;
  } else {
    return `https://${server}/embed/movie/${id}`;
  }
}

const API_KEY = '22d74813ded3fecbe3ef632b4814ae3a';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';

const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get('id');
const type = urlParams.get('type') || 'movie';

let autoTesting = false; // global flag para sa auto-find

// ✅ TEST FUNCTION
function testEmbed(iframe) {
  return new Promise(resolve => {
    let responded = false;

    iframe.onload = () => {
      console.log("✅ iframe loaded successfully");
      if (!responded) {
        responded = true;
        resolve(true);
      }
    };

    iframe.onerror = () => {
      console.log("❌ iframe failed to load");
      if (!responded) {
        responded = true;
        resolve(false);
      }
    };

    setTimeout(() => {
      if (!responded) {
        console.log("⌛ iframe timeout");
        responded = true;
        resolve(false);
      }
    }, 6000);
  });
}



// ✅ AUTO-FIND FUNCTION
async function initPlayerWithFallback(startIndex = 0) {
  console.log("✅ SERVER_LIST check:", Array.isArray(SERVER_LIST), SERVER_LIST);

  if (autoTesting) return;
  autoTesting = true;

  const label = document.getElementById("active-server-label");
  const player = document.getElementById("movie-player");
  const season = document.getElementById("season-select")?.value || 1;
  const episode = document.getElementById("episode-select")?.value || 1;

  for (let i = startIndex; i < SERVER_LIST.length; i++) {
    if (!autoTesting) {
      label.textContent = "⛔ Auto Find Cancelled.";
      break;
    }

    const server = SERVER_LIST[i];
   const url = generateEmbedURL(server, { id, media_type: type }, season, episode);
console.log(`🔁 Testing server: ${server} | URL: ${url}`);
label.textContent = `🔁 Sinusubukan: ${server}`;


player.src = ''; // clear old source
await new Promise(r => setTimeout(r, 100)); // short delay para ma-reset ang iframe

player.src = url; // set new source
const success = await testEmbed(player);

    if (success) {
      label.textContent = `✅ Gumagana: ${server}`;
      document.getElementById("server-select").value = server;
      autoTesting = false;
      return;
    } else {
      label.textContent = `❌ Failed: ${server}, susubok ng iba...`;
    }
  }

  label.textContent = `⚠️ Walang gumaganang server.`;
  autoTesting = false;
}

// ✅ STOP FUNCTION
window.initPlayerWithFallback = initPlayerWithFallback;
window.stopAutoTesting = () => {
  autoTesting = false;
};

async function loadMovie() {
  const res = await fetch(`${BASE_URL}/${type}/${id}?api_key=${API_KEY}`);
  const data = await res.json();


  document.title = data.title || data.name;
  document.getElementById('movie-title').textContent = data.title || data.name;
  document.getElementById('movie-overview').textContent = data.overview;
  document.getElementById('movie-rating').textContent = '★'.repeat(Math.round(data.vote_average / 2));

  // ✅ REMOVE or COMMENT THIS OUT:
  // initPlayerWithFallback(); ← wag muna siya auto-call



  const trailerRes = await fetch(`${BASE_URL}/${type}/${id}/videos?api_key=${API_KEY}`);
  const trailerData = await trailerRes.json();
  const trailer = trailerData.results.find(v => v.type === "Trailer" && v.site === "YouTube");
  if (trailer) {
    document.getElementById('movie-player').src = `https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1`;
  }

// ✅ FIXED LINE: define label before using
const label = document.getElementById("active-server-label");
label.textContent = "⏳ Waiting for server selection...";



  const castRes = await fetch(`${BASE_URL}/${type}/${id}/credits?api_key=${API_KEY}`);
  const castData = await castRes.json();
  const castList = document.getElementById('cast-list');
  castList.innerHTML = `
    <h2 style="margin-bottom:10px;">Cast</h2>
    <div style="position: relative;">
      <button id="cast-left" style="position: absolute; left: 0; top: 30%; z-index: 2; background: rgba(0,0,0,0.6); color: #fff; border: none; font-size: 20px; cursor: pointer; padding: 5px 10px; display:none;">❮</button>
      <button id="cast-right" style="position: absolute; right: 0; top: 30%; z-index: 2; background: rgba(0,0,0,0.6); color: #fff; border: none; font-size: 20px; cursor: pointer; padding: 5px 10px; display:none;">❯</button>
      <div id="cast-scroll" style="display: flex; overflow-x: auto; gap: 10px; padding: 10px 30px; scroll-behavior: smooth;"></div>
    </div>
  `;

  const castScrollBox = document.getElementById("cast-scroll");
  const leftBtn = document.getElementById("cast-left");
  const rightBtn = document.getElementById("cast-right");

  castScrollBox.addEventListener("scroll", () => {
    leftBtn.style.display = castScrollBox.scrollLeft > 0 ? "block" : "none";
    rightBtn.style.display = (castScrollBox.scrollLeft + castScrollBox.clientWidth) < castScrollBox.scrollWidth ? "block" : "none";
  });

  setTimeout(() => {
    rightBtn.style.display = castScrollBox.scrollWidth > castScrollBox.clientWidth ? "block" : "none";
  }, 300);

  leftBtn.onclick = () => castScrollBox.scrollBy({ left: -200, behavior: 'smooth' });
  rightBtn.onclick = () => castScrollBox.scrollBy({ left: 200, behavior: 'smooth' });

  castData.cast?.forEach(c => {
    const div = document.createElement('div');
    div.style = "text-align:center; min-width: 80px; flex: 0 0 auto;";
    div.innerHTML = `
      <img src="${c.profile_path ? IMG_URL + c.profile_path : 'https://via.placeholder.com/60x90'}"
        style="width: 80px; height: 100px; object-fit: cover; border-radius:10px;">
      <p style="font-size:12px; color:#ccc; margin-top:5px;">${c.name}</p>
    `;
    castScrollBox.appendChild(div);
  });

  const similarRes = await fetch(`${BASE_URL}/${type}/${id}/similar?api_key=${API_KEY}`);
  const similarData = await similarRes.json();
  const similarContainer = document.getElementById('similar-movies');
  similarContainer.innerHTML = `
    <h3 style="margin-top: 30px;">You May Also Like</h3>
    <div id="similar-scroll" style="display: flex; flex-wrap: nowrap; overflow-x: auto; gap: 10px; padding: 10px 0;"></div>
  `;

  const similarScrollBox = document.getElementById("similar-scroll");
  const seenIds = new Set();

  similarData.results.forEach(sim => {
    if (seenIds.has(sim.id)) return;
    seenIds.add(sim.id);

    const card = document.createElement('div');
    card.style = `
      cursor: pointer;
      transition: transform 0.3s;
      text-align: center;
      min-width: 120px;
      flex: 0 0 auto;
    `;

    card.onmouseover = () => (card.style.transform = "scale(1.05)");
    card.onmouseout = () => (card.style.transform = "scale(1)");

    card.innerHTML = `
      <img src="${IMG_URL + sim.poster_path}" alt="${sim.title || sim.name}"
        style="width: 120px; height: 180px; object-fit: cover; border-radius: 10px;">
      <p style="font-size:13px; color:#ccc; margin-top:5px; max-width: 120px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
        ${sim.title || sim.name}
      </p>
    `;

    card.onclick = () => {
      window.location.href = `movie.html?id=${sim.id}&type=${type}`;
    };

    similarScrollBox.appendChild(card);
  });

  if (type === 'tv') {
    loadSeasons();
  }
}

async function loadSeasons() {
  const res = await fetch(`${BASE_URL}/tv/${id}?api_key=${API_KEY}`);
  const data = await res.json();
  const totalSeasons = data.number_of_seasons;

  const seasonSelect = document.getElementById("season-select");
  const episodeSelect = document.getElementById("episode-select");
  const selectorBox = document.querySelector(".season-episode-selectors");
  selectorBox.style.display = 'flex';

  seasonSelect.innerHTML = '';
  episodeSelect.innerHTML = '';

  for (let i = 1; i <= totalSeasons; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `Season ${i}`;
    seasonSelect.appendChild(option);
  }

  seasonSelect.addEventListener("change", () => {
    const selectedSeason = seasonSelect.value;
    loadEpisodes(selectedSeason);
  });

  episodeSelect.addEventListener("change", () => {
    const server = document.getElementById("server-select").value;
    const season = seasonSelect.value;
    const episode = episodeSelect.value;
    const player = document.getElementById("movie-player");
    player.src = `https://${server}/embed/tv?id=${id}&s=${season}&e=${episode}`;
  });

  loadEpisodes(1);
}

async function loadEpisodes(seasonNumber) {
  const episodeSelect = document.getElementById("episode-select");
  episodeSelect.innerHTML = "";
  const res = await fetch(`${BASE_URL}/tv/${id}/season/${seasonNumber}?api_key=${API_KEY}`);
  const data = await res.json();

  data.episodes.forEach(ep => {
    const option = document.createElement("option");
    option.value = ep.episode_number;
    option.textContent = `Episode ${ep.episode_number}: ${ep.name}`;
    episodeSelect.appendChild(option);
  });

  const player = document.getElementById("movie-player");
  const server = document.getElementById("server-select").value;
  player.src = generateEmbedURL(server, { id, media_type: type }, seasonNumber, 1);
}

// ✅ INIT SERVER LIST
document.addEventListener("DOMContentLoaded", () => {
  const serverBox = document.getElementById("server");
  const serverSelect = document.createElement("select");
  serverSelect.id = "server-select";
  serverSelect.style = "padding: 8px; border-radius: 5px; margin-bottom: 20px; width: 100%; background: #222; color: #fff; border: 1px solid #555;";

  SERVER_LIST.forEach(server => {
    const option = document.createElement("option");
    option.value = server;
    option.textContent = server;
    serverSelect.appendChild(option);
  });

  serverSelect.addEventListener("change", () => {
    const player = document.getElementById("movie-player");
    const serverURL = serverSelect.value;

    if (type === 'tv') {
      const season = document.getElementById("season-select").value;
      const episode = document.getElementById("episode-select").value;
      player.src = `https://${serverURL}/embed/tv?id=${id}&s=${season}&e=${episode}`;
    } else {
      player.src = `https://${serverURL}/embed/movie/${id}`;
    }
  });

  if (serverBox) serverBox.replaceWith(serverSelect);
});

loadMovie();

