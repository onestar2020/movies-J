const API_KEY = '22d74813ded3fecbe3ef632b4814ae3a';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';

const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get('id');
const type = urlParams.get('type') || 'movie';

async function loadMovie() {
  const res = await fetch(`${BASE_URL}/${type}/${id}?api_key=${API_KEY}`);
  const data = await res.json();

  document.title = data.title || data.name;
  document.getElementById('movie-title').textContent = data.title || data.name;
  document.getElementById('movie-overview').textContent = data.overview;
  document.getElementById('movie-rating').textContent = '★'.repeat(Math.round(data.vote_average / 2));

  const trailerRes = await fetch(`${BASE_URL}/${type}/${id}/videos?api_key=${API_KEY}`);
  const trailerData = await trailerRes.json();
  const trailer = trailerData.results.find(v => v.type === "Trailer" && v.site === "YouTube");
  if (trailer) {
    document.getElementById('movie-player').src = `https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1`;
  }

  // Cast
  const castRes = await fetch(`${BASE_URL}/${type}/${id}/credits?api_key=${API_KEY}`);
  const castData = await castRes.json();
  const castList = document.getElementById('cast-list');
  castData.cast?.slice(0, 6).forEach(c => {
    const span = document.createElement('span');
    span.innerHTML = `<img src="${c.profile_path ? IMG_URL + c.profile_path : 'https://via.placeholder.com/60x90'}" style="width:60px; border-radius:8px; margin-right:10px;" title="${c.name}">`;
    castList.appendChild(span);
  });

  // Similar
  const similarRes = await fetch(`${BASE_URL}/${type}/${id}/similar?api_key=${API_KEY}`);
  const similarData = await similarRes.json();
  const similarContainer = document.getElementById('similar-movies');
  similarData.results?.slice(0, 6).forEach(sim => {
    const img = document.createElement('img');
    img.src = IMG_URL + sim.poster_path;
    img.alt = sim.title || sim.name;
    img.style = 'width:100px; margin-right:10px; cursor:pointer; border-radius:8px;';
    img.onclick = () => {
      window.location.href = `movie.html?id=${sim.id}&type=${type}`;
    };
    similarContainer.appendChild(img);
  });
}

loadMovie();

// ➕ Add server selector and watch button
document.addEventListener("DOMContentLoaded", () => {
  const main = document.querySelector("main");

  const container = document.createElement("div");
  container.style = "margin-top:20px; text-align:center;";

  // 🔽 Server selector
  const serverSelect = document.createElement("select");
  serverSelect.id = "server-select";
  serverSelect.style = "padding: 8px; border-radius: 5px; margin-bottom: 10px;";

  const servers = [
    { name: "Vidsrc.to", url: "vidsrc.to" },
    { name: "2Embed.cc", url: "2embed.cc" },
    { name: "MultiEmbed.to", url: "multiembed.to" },
    { name: "Vidsrc.me", url: "vidsrc.me" },
    { name: "2Embed.to", url: "2embed.to" },
    { name: "Dopebox.to", url: "dopebox.to" },
    { name: "Sflix.to", url: "sflix.to" }
  ];

  servers.forEach(server => {
    const option = document.createElement("option");
    option.value = server.url;
    option.textContent = server.name;
    serverSelect.appendChild(option);
  });

  // ▶ Watch Button
  const watchBtn = document.createElement("button");
  watchBtn.textContent = "▶ Watch Full Movie";
  watchBtn.style = "padding:10px 20px; background:#00bcd4; color:#fff; border:none; border-radius:5px; cursor:pointer; display:block; margin:10px auto 0 auto;";
  watchBtn.onclick = () => {
    const selectedServer = serverSelect.value;
    const link = `https://${selectedServer}/embed/${type}/${id}`;
    window.open(link, "_blank");
  };

  container.appendChild(serverSelect);
  container.appendChild(watchBtn);
  main.insertBefore(container, document.getElementById("movie-overview"));
});
