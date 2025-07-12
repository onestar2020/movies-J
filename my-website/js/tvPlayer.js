const channels = {
  "GMA 7": {
    url: "https://gmanews-i.akamaihd.net/hls/live/2030464/gmanews/master.m3u8",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/GMA_Network_Logo.svg/1200px-GMA_Network_Logo.svg.png"
  },
  "TV5": {
    url: "https://tv5edge1-lh.akamaihd.net/i/tv5_1@183619/index_720_av-p.m3u8",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/TV5_%28Philippines%29_logo.svg/2048px-TV5_%28Philippines%29_logo.svg.png"
  },
  "PTV": {
    url: "https://stream.ptv.ph/live/ptv/playlist.m3u8",
    logo: "https://upload.wikimedia.org/wikipedia/en/thumb/0/0b/People%27s_Television_Network_%28PTV%29_Logo_2017.svg/1200px-People%27s_Television_Network_%28PTV%29_Logo_2017.svg.png"
  },
  "Anime Channel": {
    url: "https://animesample.live/stream/animechannel.m3u8",  // Replace if not working
    logo: "https://cdn-icons-png.flaticon.com/512/4712/4712103.png"
  }
};

const player = jwplayer("video");

player.setup({
  file: "", // default empty
  width: "100%",
  aspectratio: "16:9",
  autostart: false,
  mute: false
});

// Load and play selected channel
function loadChannel(channelName) {
  const channel = channels[channelName];
  if (channel) {
    player.load([{ file: channel.url }]);
    player.play().catch(err => {
      console.error(`Failed to play ${channelName}:`, err);
      alert(`Error playing ${channelName}. Please try another channel.`);
    });

    document.getElementById("channelInfo").innerHTML =
      `Now Playing: <img src="${channel.logo}" style="height: 20px; vertical-align: middle;"> ${channelName}`;
  }
}

// Create channel buttons based on search
function renderChannelButtons() {
  const container = document.getElementById("channelList");
  container.innerHTML = "";
  const search = document.getElementById("search").value.toLowerCase();

  for (const [name, info] of Object.entries(channels)) {
    if (name.toLowerCase().includes(search)) {
      const btn = document.createElement("button");
      btn.innerHTML = `<img src="${info.logo}" style="height: 30px; vertical-align: middle; margin-right: 10px;"> ${name}`;
      btn.className = "channel-button";
      btn.onclick = () => loadChannel(name);
      container.appendChild(btn);
    }
  }
}

// Initialize search and render
document.getElementById("search").addEventListener("input", renderChannelButtons);
renderChannelButtons();
