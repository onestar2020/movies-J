/**
 * Movies-J - Stream Servers Configuration (Hardened Build)
 * Security: layered string protection (split-XOR + base64 + reversal),
 * anti-inspect guards, runtime-only URL assembly.
 * NOTE: No plaintext host names are present in this file.
 */

// ================= 1. ANTI-INSPECT & DEVTOOLS PROTECTION =================
(function () {
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

  // Debugger trap loop: nakakaharang kapag naka-open ang DevTools
  setInterval(function () {
    const t0 = performance.now();
    debugger;
    if (performance.now() - t0 > 100) {
      window.location.href = 'about:blank';
    }
  }, 1500);

  // DevTools size heuristic: kapag malaki ang gap ng outer/inner viewport,
  // mag-blur overlay imbes na redirect (iwas false positive)
  let overlayEl = null;
  function ensureOverlay() {
    if (overlayEl) return overlayEl;
    overlayEl = document.createElement('div');
    overlayEl.id = 'devtools-shield';
    overlayEl.innerHTML =
      '<div style="text-align:center;color:#fff;font-family:inherit;">' +
      '<i class="fas fa-shield-halved" style="font-size:42px;color:#e50914;margin-bottom:14px;"></i>' +
      '<h2 style="margin:0 0 8px;">Content Protected</h2>' +
      '<p style="margin:0;color:#aaa;font-size:13px;">Please close Developer Tools to continue watching.</p>' +
      '</div>';
    overlayEl.style.cssText =
      'position:fixed;inset:0;z-index:2147483647;background:rgba(5,5,8,0.985);backdrop-filter:blur(18px);display:none;align-items:center;justify-content:center;';
    (document.body || document.documentElement).appendChild(overlayEl);
    return overlayEl;
  }
  setInterval(function () {
    try {
      // SKIP sa mobile/touch — ang browser chrome ng mobile ay laging may
      // malaking outer/inner gap = false positive na "Content Protected"!
      if (!window.matchMedia || !window.matchMedia('(pointer: fine)').matches) return;
      var w = window;
      var gapW = w.outerWidth - w.innerWidth;
      var gapH = w.outerHeight - w.innerHeight;
      var open = gapW > 160 || gapH > 160;
      var ov = ensureOverlay();
      ov.style.display = open ? 'flex' : 'none';
      if (open) {
        try { console.clear(); } catch (e) {}
      }
    } catch (e) { /* ignore */ }
  }, 1200);
})();

// ================= 2. PROTECTED SERVER CONFIGURATION =================
// Scheme: plain -> XOR(key) -> base64 -> reverse -> split into 3 chunks joined by '~'
// Walang plaintext URL dito; binubuo lang ang URL sa runtime.

var _k = ['M', 'j', 'P', 'r', '0', 't', '3', 'c', 't', '2', '0', '2', '6', '!'];
var _dk = function (s) {
  var b64 = s.split('~').join('').split('').reverse().join('');
  b64 += '='.repeat((4 - (b64.length % 4)) % 4);
  var x = atob(b64);
  var out = '';
  for (var i = 0; i < x.length; i++) {
    out += String.fromCharCode(x.charCodeAt(i) ^ _k[i % _k.length].charCodeAt(0));
  }
  return out;
};

var _H = {
  vM: _dk('0RVbJADetVRA~43B/4kQBR1WC~wEHONkAk4RJ'),
  vT: _dk('sVFHtVRA43B~/4kQBR1WCwE~HONkAk4RJ'),
  vQ: _dk('0gVJdFHxYwaEVkXRRVSHI1G~cxxJFkyBQR1UHcBVOERXXgj~HrR0QAR0DNIwXE8lBlsgc'),
  cM: _dk('wfPQyVZ91HWFRA~eFxHGMCRuMVRX5~1WXwEHONkAk4RJ'),
  cT: _dk('gDAZ0HWFRAeFx~HGMCRuMVRX51W~XwEHONkAk4RJ'),
  eM: _dk('FlCRU9VVdohCYd~gHWUDCgQEBccUR~DwEHONkAk4RJ'),
  eT: _dk('0lJekCRU9VVdohC~YdgHWUDCgQEBccU~RDwEHONkAk4RJ'),
  zM: _dk('OM1WG1VGMFUEJNBPaI2~WPpkHfVhBBBwQRgCEjN~1ULFlXEwEHONkAk4RJ'),
  zT: _dk('fQEAMFUEJNBPaI2WPp~kHfVhBBBwQRgCEjN1U~LFlXEwEHONkAk4RJ'),
  nM: _dk('gYE9FRf91WHYlFddxfHI~iQYMlRdphABBwQXgTC/4~kUH9lXXwEHONkAk4RJ'),
  nT: _dk('QHGZ0WHYlFddxfHIiQ~YMlRdphABBwQXgTC/4~kUH9lXXwEHONkAk4RJ'),
  lM: _dk('0RVbJADet1XA~ACRm80XeR1WC~wEHONkAk4RJ'),
  lT: _dk('sVFHt1XAACR~m80XeR1WCwE~HONkAk4RJ')
};

var STREAM_SERVERS = {
  vidstorm: {
    id: 'vidstorm',
    name: 'Server 1',
    type: 'iframe',
    enabled: true,
    movie: function (imdbId) { return _H.vM + imdbId + _H.vQ; },
    tv: function (imdbId, s, e) { s = s || 1; e = e || 1; return _H.vT + imdbId + '/' + s + '/' + e + _H.vQ; }
  },
  cinesrc: {
    id: 'cinesrc',
    name: 'Server 2',
    type: 'iframe',
    enabled: true,
    movie: function (tmdbId) { return _H.cM + tmdbId; },
    tv: function (tmdbId, s, e) { s = s || 1; e = e || 1; return _H.cT + tmdbId + '?s=' + s + '&e=' + e; }
  },
  twoembed: {
    id: 'twoembed',
    name: 'Server 3',
    type: 'iframe',
    enabled: true,
    movie: function (tmdbId) { return _H.eM + tmdbId; },
    tv: function (tmdbId, s, e) { s = s || 1; e = e || 1; return _H.eT + tmdbId + '&s=' + s + '&e=' + e; }
  },
  zxcstream: {
    id: 'zxcstream',
    name: 'Server 4',
    type: 'iframe',
    enabled: true,
    movie: function (tmdbId) { return _H.zM + tmdbId; },
    tv: function (tmdbId, s, e) { s = s || 1; e = e || 1; return _H.zT + tmdbId + '/' + s + '/' + e; }
  },
  cloudorchestra: {
    id: 'cloudorchestra',
    name: 'Server (Nova)',
    type: 'iframe',
    enabled: false,
    movie: function (tmdbId) { return _H.nM + tmdbId; },
    tv: function (tmdbId, s, e) { s = s || 1; e = e || 1; return _H.nT + tmdbId + '/' + s + '/' + e; }
  },
  vidlink: {
    id: 'vidlink',
    name: 'Server (VidLink)',
    type: 'iframe',
    enabled: false,
    movie: function (tmdbId) { return _H.lM + tmdbId + '?autoplay=true'; },
    tv: function (tmdbId, s, e) { s = s || 1; e = e || 1; return _H.lT + tmdbId + '/' + s + '/' + e + '?autoplay=true'; }
  }
};

// ================= 3. GET EMBED URL DISPATCHER =================
function getEmbedUrl(serverKey, mediaData, type, s, e) {
  type = type || 'movie';
  s = s || 1;
  e = e || 1;
  var server = STREAM_SERVERS[serverKey];
  if (!server) return '';

  if (server.id === 'vidstorm') {
    var imdbId = mediaData.imdb_id || mediaData.id;
    return type === 'tv' ? server.tv(imdbId, s, e) : server.movie(imdbId);
  }

  var id = mediaData.tmdb_id || mediaData.id;
  return type === 'tv' ? server.tv(id, s, e) : server.movie(id);
}
