function generateEmbedURL(server, item, season = 1, episode = 1) {

  const id = item.id;
  const type = item.media_type === "movie" ? "movie" : "tv";
  const isTV = type === "tv";

  switch (server) {
    case "vidsrc.cc":
      return isTV
        ? `https://vidsrc.cc/v2/embed/tv/${id}/${season}/${episode}`
        : `https://vidsrc.cc/v2/embed/${type}/${id}`;
    case "vidsrc.me":
      return isTV
        ? `https://vidsrc.me/embed/tv?tmdb=${id}&season=${season}&episode=${episode}`
        : `https://vidsrc.net/embed/${type}/?tmdb=${id}`;
    case "player.videasy.net":
      return isTV
        ? `https://player.videasy.net/tv/${id}/${season}/${episode}`
        : `https://player.videasy.net/${type}/${id}`;
    case "multiembed.mov":
      return isTV
        ? `https://multiembed.mov/tv/${id}/${season}/${episode}`
        : `https://multiembed.mov/${type}/${id}`;
    case "2embed.to":
      return isTV
        ? `https://www.2embed.to/embed/tmdb/tv?id=${id}&s=${season}&e=${episode}`
        : `https://www.2embed.to/embed/tmdb/${type}?id=${id}`;
    case "zembed.net":
      return `https://zembed.net/v/${id}`;
    case "curtstream.com":
      return isTV
        ? `https://www.curtstream.com/embed/tv/${id}/${season}/${episode}`
        : `https://www.curtstream.com/embed/${type}/${id}`;
    case "vidsrc.pro":
      return isTV
        ? `https://vidsrc.pro/embed/tv/${id}/${season}/${episode}`
        : `https://vidsrc.pro/embed/${type}/${id}`;
    case "autoembed.to":
      return isTV
        ? `https://autoembed.to/tv/tmdb/${id}/${season}-${episode}`
        : `https://autoembed.to/movie/tmdb/${id}`;
    case "2embed.cc":
      return isTV
        ? `https://2embed.cc/embedtv/${id}/${season}-${episode}`
        : `https://2embed.cc/embed/${id}`;
    case "dopebox.to":
      return isTV
        ? `https://dopebox.to/embedtv/${id}/${season}/${episode}`
        : `https://dopebox.to/embed/${id}`;
    case "sflix.to":
      return isTV
        ? `https://sflix.to/embed/tv/${id}/${season}/${episode}`
        : `https://sflix.to/embed/movie/${id}`;
    case "megacloud.tv":
      return isTV
        ? `https://megacloud.tv/embed?t=tv&id=${id}&s=${season}&e=${episode}`
        : `https://megacloud.tv/embed?t=movie&id=${id}`;
    case "fzmovies.xyz":
      return isTV
        ? `https://fzmovies.xyz/tv/${id}/${season}/${episode}`
        : `https://fzmovies.xyz/movie/${id}`;
    default:
      return "";
  }
}
