const API_KEY = '22d74813ded3fecbe3ef632b4814ae3a';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';

const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get('id');
const type = urlParams.get('type') || 'movie';

async function loadMovie() {
  // Fetch movie/TV show details
  const res = await fetch(`${BASE_URL}/${type}/${id}?api_key=${API_KEY}`);
  const data = await res.json();

  document.title = data.title || data.name;
  document.getElementById('movie-title').textContent = data.title || data.name;
  document.getElementById('movie-overview').textContent = data.overview;
  document.getElementById('movie-rating').textContent = '★'.repeat(Math.round(data.vote_average / 2));

  // Fetch trailer
  const trailerRes = await fetch(`${BASE_URL}/${type}/${id}/videos?api_key=${API_KEY}`);
  const trailerData = await trailerRes.json();
  const trailer = trailerData.results.find(v => v.type === "Trailer" && v.site === "YouTube");
  if (trailer) {
    document.getElementById('movie-player').src = `https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1`;
  }

  // Cast section (modern)
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

  // Similar Movies (modern grid)
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
}

loadMovie();

// Server selector below 🎬 label
document.addEventListener("DOMContentLoaded", () => {
  const label = document.getElementById("server-label");

  const serverSelect = document.createElement("select");
  serverSelect.id = "server-select";
  serverSelect.style = "padding: 8px; border-radius: 5px; margin-bottom: 20px; width: 100%; background: #222; color: #fff; border: 1px solid #555;";

  const servers = [
    { name: "MegaCloud.tv", url: "megacloud.tv" },
    { name: "FzMovies.xyz", url: "fzmovies.xyz" },
    { name: "Vidsrc.cc", url: "vidsrc.cc" },
    { name: "Vidsrc.me", url: "vidsrc.me" },
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
    const selected = serverSelect.value;
    document.getElementById("movie-player").src = `https://${selected}/embed/${type}/${id}`;
  });

  serverSelect.selectedIndex = 0;
  const defaultServer = serverSelect.value;
  document.getElementById("movie-player").src = `https://${defaultServer}/embed/${type}/${id}`;

  label.insertAdjacentElement("afterend", serverSelect);
});
