const API_KEY = '22d74813ded3fecbe3ef632b4814ae3a';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';

const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get('id');
const type = urlParams.get('type') || 'movie';
if (type === 'tv') {
  document.querySelector('.season-episode-selectors').style.display = 'flex';

  // Fetch seasons and populate
  const seasonSelect = document.getElementById('season-select');
  const episodeSelect = document.getElementById('episode-select');

  fetch(`${BASE_URL}/${type}/${id}?api_key=${API_KEY}&language=en-US`)
    .then(res => res.json())
    .then(data => {
      if (data.seasons && data.seasons.length > 0) {
        // Populate seasons
        seasonSelect.innerHTML = '';
        data.seasons.forEach(season => {
          if (season.season_number !== 0) {
            const option = document.createElement('option');
            option.value = season.season_number;
            option.textContent = `Season ${season.season_number}`;
            seasonSelect.appendChild(option);
          }
        });

        // Auto-trigger first season load
        seasonSelect.addEventListener('change', () => {
  const selectedSeason = seasonSelect.value;
  fetch(`${BASE_URL}/${type}/${id}/season/${selectedSeason}?api_key=${API_KEY}&language=en-US`)
    .then(res => res.json())
    .then(seasonData => {
      episodeSelect.innerHTML = '';
      seasonData.episodes.forEach(episode => {
        const option = document.createElement('option');
        option.value = episode.episode_number;
        option.textContent = `Episode ${episode.episode_number}: ${episode.name}`;
        episodeSelect.appendChild(option);
      });

      // Default autoplay sa unang episode pagkatapos mag-load
      episodeSelect.selectedIndex = 0;
      const server = document.getElementById("server-select").value;
      document.getElementById("movie-player").src =
        `https://${server}/embed/tv?id=${id}&s=${selectedSeason}&e=1`;
    });
});


        // Trigger change to load first season's episodes
        seasonSelect.dispatchEvent(new Event('change'));
      }
    });
}



async function loadMovie() {
  const res = await fetch(`${BASE_URL}/${type}/${id}?api_key=${API_KEY}`);
  const data = await res.json();

  document.title = data.title || data.name;
  const serverLabel = document.getElementById('server-label');
if (type === 'tv') {
  serverLabel.textContent = '📺 Select a season and episode, then choose a server to start watching:';
} else {
  serverLabel.textContent = '🎬 Select a server below to watch the full movie:';
}

  document.getElementById('movie-title').textContent = data.title || data.name;
  document.getElementById('movie-overview').textContent = data.overview;
  document.getElementById('movie-rating').textContent = '★'.repeat(Math.round(data.vote_average / 2));

  const trailerRes = await fetch(`${BASE_URL}/${type}/${id}/videos?api_key=${API_KEY}`);
  const trailerData = await trailerRes.json();
  const trailer = trailerData.results.find(v => v.type === "Trailer" && v.site === "YouTube");
  if (trailer) {
    document.getElementById('movie-player').src = `https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1`;
  }

  const castRes = await fetch(`${BASE_URL}/${type}/${id}/credits?api_key=${API_KEY}`);
  const castData = await castRes.json();
  const castList = document.getElementById('cast-list');
  castList.innerHTML = "<h2 style='margin-bottom:10px;'>Cast</h2>";
  castList.style = "display: flex; gap: 20px; flex-wrap: wrap;";
  castData.cast?.slice(0, 6).forEach(c => {
    const div = document.createElement('div');
    div.style = "text-align:center; width: 80px;";
    div.innerHTML = `
      <img src="${c.profile_path ? IMG_URL + c.profile_path : 'https://via.placeholder.com/60x90'}"
        style="width: 80px; height: 100px; object-fit: cover; border-radius:10px;">
      <p style="font-size:12px; color:#ccc; margin-top:5px;">${c.name}</p>
    `;
    castList.appendChild(div);
  });

  const similarRes = await fetch(`${BASE_URL}/${type}/${id}/similar?api_key=${API_KEY}`);
  const similarData = await similarRes.json();
  const similarContainer = document.getElementById('similar-movies');
  similarContainer.innerHTML = "<h2 style='margin-top:30px; margin-bottom:10px;'>You May Also Like</h2>";
  similarContainer.style = "display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 15px;";
  similarData.results?.slice(0, 6).forEach(sim => {
    const card = document.createElement('div');
    card.style = "cursor:pointer; transition:transform 0.3s; text-align:center;";
    card.onmouseover = () => (card.style.transform = "scale(1.05)");
    card.onmouseout = () => (card.style.transform = "scale(1)");
    card.innerHTML = `
      <img src="${IMG_URL + sim.poster_path}" alt="${sim.title || sim.name}"
        style="width:100%; border-radius:10px; object-fit:cover;">
      <p style="font-size:13px; color:#ccc; margin-top:5px;">${sim.title || sim.name}</p>
    `;
    card.onclick = () => {
      window.location.href = `movie.html?id=${sim.id}&type=${type}`;
    };
    similarContainer.appendChild(card);
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
  const selectorBox = document.getElementById("season-episode-selectors");
  selectorBox.style.display = 'block';

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

  const server = document.getElementById("server-select").value;
  document.getElementById("movie-player").src = `https://${server}/embed/tv?id=${id}&s=${seasonNumber}&e=1`;
}

document.addEventListener("DOMContentLoaded", () => {
  const label = document.getElementById("server-label");

  const serverSelect = document.createElement("select");
  serverSelect.id = "server-select";
  serverSelect.style = "padding: 8px; border-radius: 5px; margin-bottom: 20px; width: 100%; background: #222; color: #fff; border: 1px solid #555;";

  const servers = [
    { name: "Vidsrc.me", url: "vidsrc.me" },
    { name: "MegaCloud.tv", url: "megacloud.tv" },
    { name: "FzMovies.xyz", url: "fzmovies.xyz" },
    { name: "Vidsrc.cc", url: "vidsrc.cc" },
    { name: "Player.Videasy.net", url: "player.videasy.net" },
    { name: "MultiEmbed.mov", url: "multiembed.mov" },
    { name: "2Embed.to", url: "2embed.to" },
    { name: "Zembed.net", url: "zembed.net" },
    { name: "CurtStream", url: "curtstream.com" },
    { name: "VidSrc Pro", url: "vidsrc.pro" },
    { name: "AutoEmbed.to", url: "autoembed.to" },
    { name: "2Embed.cc", url: "2embed.cc" },
    { name: "DopeBox.to", url: "dopebox.to" },
    { name: "SFlix.to", url: "sflix.to" }
  ];

  servers.forEach(server => {
    const option = document.createElement("option");
    option.value = server.url;
    option.textContent = server.name;
    serverSelect.appendChild(option);
  });

  serverSelect.addEventListener("change", () => {
    if (type === 'tv') {
      const season = document.getElementById("season-select").value;
      const episode = document.getElementById("episode-select").value;
      document.getElementById("movie-player").src = `https://${serverSelect.value}/embed/tv?id=${id}&s=${season}&e=${episode}`;
    } else {
      document.getElementById("movie-player").src = `https://${serverSelect.value}/embed/movie/${id}`;
    }
  });

  label.insertAdjacentElement("afterend", serverSelect);
});

loadMovie();
