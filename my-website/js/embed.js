function generateEmbedURL(server, item, season = 1, episode = 1) {
  const id = item.id;
  const type = item.media_type === "movie" ? "movie" : "tv";
  const isTV = type === "tv";

  switch (server) {
    // ✅ Confirmed working
    case "vidsrc.cc":
      return isTV
        ? `https://vidsrc.cc/v2/embed/tv/${id}/${season}/${episode}`
        : `https://vidsrc.cc/v2/embed/movie/${id}`;

    case "vidsrc.me":
      return isTV
        ? `https://vidsrc.net/embed/tv/?tmdb=${id}&season=${season}&episode=${episode}`
        : `https://vidsrc.net/embed/movie/?tmdb=${id}`;

    case "player.videasy.net":
      return isTV
        ? `https://player.videasy.net/tv/${id}/${season}/${episode}`
        : `https://player.videasy.net/movie/${id}`;

    case "player.autoembed.cc":
      return isTV
        ? `https://player.autoembed.cc/embed/tv/${id}/${season}/${episode}`
        : `https://player.autoembed.cc/embed/movie/${id}`;

    default:
      return "";
  }
}

window.generateEmbedURL = generateEmbedURL;
