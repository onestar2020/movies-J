// ✅ IN-UPDATE PARA SA 2EMBED.TO

function generateEmbedURL(server, item, season = 1, episode = 1) {
  const id = item.id;
  // Mas reliable na paraan para malaman kung TV show
  const isTV = item.media_type === "tv" || item.first_air_date; 

  switch (server) {
    // Bagong case para sa 2embed.to
    case "2embed.to":
      return isTV
        ? `https://www.2embed.to/embed/tmdb/tv?id=${id}&s=${season}&e=${episode}`
        : `https://www.2embed.to/embed/tmdb/movie?id=${id}`;

    // Mga dati mong server
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