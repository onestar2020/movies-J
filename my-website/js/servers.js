/**
 * Movies-J - Stream Servers Configuration
 * Clean list without duplicates.
 */

const STREAM_SERVERS = {
  // Server 1 - Vidstorm (Requires IMDb ID)
  vidstorm: {
    id: "vidstorm",
    name: "Server 1 (Vidstorm)",
    type: "iframe",
    movie: (imdbId) => `https://vidstorm.ru/movie/${imdbId}?autoplay=true&theme=7c5cff&download=false&lang=en`,
    tv: (imdbId, s = 1, e = 1) => `https://vidstorm.ru/tv/${imdbId}/${s}/${e}?autoplay=true&theme=7c5cff&download=false&lang=en`
  },

  // Server 2 - CineSRC (TMDb ID)
  cinesrc: {
    id: "cinesrc",
    name: "Server 2 (CineSRC)",
    type: "iframe",
    movie: (tmdbId) => `https://cinesrc.st/embed/movie/${tmdbId}`,
    tv: (tmdbId, s = 1, e = 1) => `https://cinesrc.st/embed/tv/${tmdbId}?s=${s}&e=${e}`
  },

  // Server 3 - 2Embed (TMDb ID)
  twoembed: {
    id: "twoembed",
    name: "Server 3 (2Embed)",
    type: "iframe",
    movie: (tmdbId) => `https://www.2embed.skin/embed/${tmdbId}`,
    tv: (tmdbId, s = 1, e = 1) => `https://www.2embed.skin/embedtv/${tmdbId}&s=${s}&e=${e}`
  },

  // Server 4 - Nova / CloudOrchestra (TMDb ID)
  cloudorchestra: {
    id: "cloudorchestra",
    name: "Server 4 (Nova)",
    type: "iframe",
    movie: (tmdbId) => `https://cloudorchestranova.com/embed/movie/${tmdbId}`,
    tv: (tmdbId, s = 1, e = 1) => `https://cloudorchestranova.com/embed/tv/${tmdbId}/${s}/${e}`
  },

  // Server 5 - VidLink (TMDb ID)
  vidlink: {
    id: "vidlink",
    name: "Server 5 (VidLink)",
    type: "iframe",
    movie: (tmdbId) => `https://vidlink.pro/movie/${tmdbId}?autoplay=true`,
    tv: (tmdbId, s = 1, e = 1) => `https://vidlink.pro/tv/${tmdbId}/${s}/${e}?autoplay=true`
  },

  // Server 6 - ZXCStream (TMDb ID)
  zxcstream: {
    id: "zxcstream",
    name: "Server 6 (ZXCStream)",
    type: "iframe",
    movie: (tmdbId) => `https://player.zxcstream.xyz/player/movie/${tmdbId}`,
    tv: (tmdbId, s = 1, e = 1) => `https://player.zxcstream.xyz/player/tv/${tmdbId}/${s}/${e}`
  },

  // Server 7 - Asian / Global Scraper (KKPhim, KissKH, OneTouchTV, etc.)
  yastream: {
    id: "yastream",
    name: "Server 7 (KKPhim / KissKH)",
    type: "api_addon",
    endpoint: "https://yastream.tamthai.de/eyJjYXRhbG9ncyI6WyJpZHJhbWEuc2VyaWVzLmlEcmFtYSIsImlkcmFtYS5zZXJpZXMuU2VhcmNoIiwia2lzc2toLnNlcmllcy5DaGluZXNlIiwia2lzc2toLnNlcmllcy5Lb3JlYW4iLCJraXNza2guc2VyaWVzLkphcGFuZXNlIiwia2lzc2toLnNlcmllcy5Ib25na29uZyIsImtpc3NraC5zZXJpZXMuVGhhaSIsImtpc3NraC5zZXJpZXMuVVMiLCJraXNza2guc2VyaWVzLlRhaXdhbmVzZSIsImtpc3NraC5zZXJpZXMuUGhpbGlwcGluZSIsImtpc3NraC5zZXJpZXMuU2VhcmNoIiwia2lzc2toLm1vdmllLkNoaW5lc2UiLCJraXNza2gubW92aWUuS29yZWFuIiwia2lzc2toLm1vdmllLkphcGFuZXNlIiwia2lzc2toLm1vdmllLkhvbmdrb25nIiwia2lzc2toLm1vdmllLlRoYWkiLCJraXNza2gubW92aWUuVVMiLCJraXNza2gubW92aWUuVGFpd2FuZXNlIiwia2lzc2toLm1vdmllLlBoaWxpcHBpbmUiLCJraXNza2gubW92aWUuU2VhcmNoIiwib25ldG91Y2h0di5zZXJpZXMuUG9wdWxhciIsIm9uZXRvdWNodHYuc2VyaWVzLkNoaW5lc2UiLCJvbmV0b3VjaHR2LnNlcmllcy5Lb3JlYW4iLCJvbmV0b3VjaHR2LnNlcmllcy5UaGFpIiwib25ldG91Y2h0di5zZXJpZXMuU2VhcmNoIiwib25ldG91Y2h0di5tb3ZpZS5Qb3B1bGFyIiwib25ldG91Y2h0di5tb3ZpZS5DaGluZXNlIiwib25ldG91Y2h0di5tb3ZpZS5Lb3JlYW4iLCJvbmV0b3VjaHR2Lm1vdmllLlRoYWkiLCJvbmV0b3VjaHR2Lm1vdmllLlNlYXJjaCJdLCJjYXRhbG9nIjpbImtpc3NraCIsIm9uZXRvdWNodHYiLCJpZHJhbWEiXSwic3RyZWFtIjpbImtpc3NraCIsIm9uZXRvdWNodHYiLCJta3ZkcmFtYSIsImlkcmFtYSIsImtrcGhpbSIsIm9waGltIl0sIm5zZnciOmZhbHNlLCJpbmZvIjpmYWxzZSwicG9zdGVyIjoicnBkYiIsIm1mcFVybCI6IiIsInRiS2V5IjoiIiwibWZwUGFzcyI6IiIsImVtYWlsIjoiIiwiaXAiOiIifQ",
    getStreamUrl: (imdbId, type = "movie", s = 1, e = 1) => {
      const idStr = type === "movie" ? imdbId : `${imdbId}:${s}:${e}`;
      return `${STREAM_SERVERS.yastream.endpoint}/stream/${type}/${idStr}.json`;
    }
  }
};

// Helper function para mag-generate ng embed URL para sa iframe
function getEmbedUrl(serverKey, mediaData, type = "movie", s = 1, e = 1) {
  const server = STREAM_SERVERS[serverKey];
  if (!server) return "";

  if (server.id === "vidstorm") {
    const id = mediaData.imdb_id || mediaData.id;
    return type === "tv" ? server.tv(id, s, e) : server.movie(id);
  }

  const id = mediaData.tmdb_id || mediaData.id;
  return type === "tv" ? server.tv(id, s, e) : server.movie(id);
}