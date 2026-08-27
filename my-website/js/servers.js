/**
 * Movies-J - Stream Servers Configuration (Protected & Encoded Version)
 * Active: Server 1 (Vidstorm), Server 2 (CineSRC), Server 3 (2Embed), Server 4 (ZXCStream)
 * Security: Anti-F12, Anti-Inspect, Debugger Loop, Base64 Encoded Stream URLs
 */

// ================= 1. ANTI-DEVTOOLS & INSPECT PROTECTION =================
(function() {
  // Disable Right Click
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  // Disable DevTools Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) ||
      (e.ctrlKey && ['U', 'u', 'S', 's'].includes(e.key))
    ) {
      e.preventDefault();
      return false;
    }
  });

  // Anti-Debugger Trap Loop
  setInterval(() => {
    const startTime = performance.now();
    debugger;
    if (performance.now() - startTime > 100) {
      window.location.href = "about:blank";
    }
  }, 500);
})();

// ================= 2. ENCODED SERVER CONFIGURATION =================
const _d = (str) => atob(str);

export const STREAM_SERVERS = {
  // Server 1 - Vidstorm
  vidstorm: {
    id: "vidstorm",
    name: "Server 1",
    type: "iframe",
    enabled: true,
    movie: (imdbId) => `${_d('aHR0cHM6Ly92aWRzdG9ybS5ydS9tb3ZpZS8=')}${imdbId}?autoplay=true&theme=7c5cff&download=false&lang=en`,
    tv: (imdbId, s = 1, e = 1) => `${_d('aHR0cHM6Ly92aWRzdG9ybS5ydS90di8=')}${imdbId}/${s}/${e}?autoplay=true&theme=7c5cff&download=false&lang=en`
  },

  // Server 2 - CineSRC
  cinesrc: {
    id: "cinesrc",
    name: "Server 2",
    type: "iframe",
    enabled: true,
    movie: (tmdbId) => `${_d('aHR0cHM6Ly9jaW5lc3JjLnN0L2VtYmVkL21vdmllLw==')}${tmdbId}`,
    tv: (tmdbId, s = 1, e = 1) => `${_d('aHR0cHM6Ly9jaW5lc3JjLnN0L2VtYmVkL3R2Lw==')}${tmdbId}?s=${s}&e=${e}`
  },

  // Server 3 - 2Embed
  twoembed: {
    id: "twoembed",
    name: "Server 3",
    type: "iframe",
    enabled: true,
    movie: (tmdbId) => `${_d('aHR0cHM6Ly93d3cuMmVtYmVkLnNraW4vZW1iZWQv')}${tmdbId}`,
    tv: (tmdbId, s = 1, e = 1) => `${_d('aHR0cHM6Ly93d3cuMmVtYmVkLnNraW4vZW1iZWR0di8=')}${tmdbId}&s=${s}&e=${e}`
  },

  // Server 4 - ZXCStream
  zxcstream: {
    id: "zxcstream",
    name: "Server 4",
    type: "iframe",
    enabled: true,
    movie: (tmdbId) => `${_d('aHR0cHM6Ly9wbGF5ZXIuenhjc3RyZWFtLnh5ei9wbGF5ZXIvbW92aWUv')}${tmdbId}`,
    tv: (tmdbId, s = 1, e = 1) => `${_d('aHR0cHM6Ly9wbGF5ZXIuenhjc3RyZWFtLnh5ei9wbGF5ZXIvdHYv')}${tmdbId}/${s}/${e}`
  }
};

// ================= 3. GET EMBED URL DISPATCHER =================
export function getEmbedUrl(serverKey, mediaData, type = "movie", s = 1, e = 1) {
  const server = STREAM_SERVERS[serverKey] || STREAM_SERVERS.vidstorm;
  if (!server) return "";

  const isTv = (type === "tv" || mediaData.type === "tv" || mediaData.seasons || mediaData.number_of_seasons);

  if (server.id === "vidstorm") {
    const id = mediaData.imdb_id || (typeof mediaData === "string" ? mediaData : mediaData.id);
    return isTv ? server.tv(id, s, e) : server.movie(id);
  }

  const id = mediaData.tmdb_id || mediaData.id || mediaData;
  return isTv ? server.tv(id, s, e) : server.movie(id);
}