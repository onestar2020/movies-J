const channels = {
  "GMA 7": {
    url: "https://gma-live.pilipinas-streaming.repl.co/gma7.php",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/GMA_Network_Logo.svg/1200px-GMA_Network_Logo.svg.png",
  },
  "TV5": {
    url: "https://tv5-live.pilipinas-streaming.repl.co/tv5.php",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/TV5_%28Philippines%29_logo.svg/2048px-TV5_%28Philippines%29_logo.svg.png",
  },
  "PTV": {
    url: "https://ptv-live.pilipinas-streaming.repl.co/ptv.php",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/0/0b/People%27s_Television_Network_%28PTV%29_Logo_2017.svg/1200px-People%27s_Television_Network_%28PTV%29_Logo_2017.svg.png",
  },
  "Anime Channel": {
    url: "https://animechannel-live.pilipinas-streaming.repl.co/anime.php",
    logo: "https://cdn-icons-png.flaticon.com/512/4712/4712103.png",
  }
};

const player = jwplayer("player");
player.setup({
  file: "",
  width: "100%",
  aspectratio: "16:9",
  autostart: false
});

function loadChannel(channelName) {
  const channel = channels[channelName];
  if (channel) {
    player.load([{ file: channel.url }]);
    player.play();
    document.getElementById("channelInfo").innerHTML =
      `Now Playing: <img src="${channel.logo}" style="height: 20px; vertical-align: middle;"> ${channelName}`;
  }
}

function renderChannelButtons() {
  const container = document.getElementById("channelList");
  container.innerHTML = "";
  const searchInput = document.getElementById("search").value.toLowerCase();

  for (const [name, info] of Object.entries(channels)) {
    if (name.toLowerCase().includes(searchInput)) {
      const btn = document.createElement("button");
      btn.innerHTML = `<img src="${info.logo}" style="height: 30px; vertical-align: middle; margin-right: 10px;"> ${name}`;
      btn.style.cssText = `
        background: #222; color: white; border: 1px solid #444;
        padding: 10px 15px; border-radius: 8px; cursor: pointer;
        font-weight: bold; display: flex; align-items: center; gap: 10px;
      `;
      btn.onclick = () => loadChannel(name);
      container.appendChild(btn);
    }
  }
}

document.getElementById("search").addEventListener("input", renderChannelButtons);
renderChannelButtons();
