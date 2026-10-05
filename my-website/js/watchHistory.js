// ✅ js/watchHistory.js (Full Fixed Version)

document.addEventListener("DOMContentLoaded", function () {
  const historyBtn = document.querySelector('.watch-history-btn');
  const historyModal = document.getElementById('watch-history-modal');

  // Safety check kung wala sa page ang modal
  if (!historyBtn || !historyModal) {
    return;
  }

  const closeBtn = historyModal.querySelector('#close-history-modal');
  const historyList = historyModal.querySelector('#watch-history-list');
  const modalContent = historyModal.querySelector('.modal-content');

  if (!closeBtn || !historyList || !modalContent) {
    console.error("Watch history modal is incomplete.");
    return;
  }

  // Clear button setup
  let clearBtn = modalContent.querySelector('#clear-history-btn');
  if (!clearBtn) {
    clearBtn = document.createElement('button');
    clearBtn.id = 'clear-history-btn';
    clearBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Clear History';
    clearBtn.title = 'Clear Watch History';
    modalContent.appendChild(clearBtn);
    clearBtn.style.display = 'none';
  }

  clearBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to clear your watch history?")) {
      localStorage.removeItem("watchHistory");
      loadWatchHistory();
    }
  });

  function loadWatchHistory() {
    if (!historyList) return;

    let history = [];
    try {
      history = JSON.parse(localStorage.getItem("watchHistory") || "[]");
    } catch (e) {
      console.error("Error parsing watch history:", e);
      history = [];
      localStorage.removeItem("watchHistory");
    }

    historyList.innerHTML = '';

    if (history.length === 0) {
      historyList.innerHTML = '<p style="color: #888; text-align: center; grid-column: 1 / -1; padding: 25px; font-size: 14px;">No watch history found.</p>';
      clearBtn.style.display = 'none';
    } else {
      clearBtn.style.display = 'inline-flex';

      const sorted = history.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      // PH title fix: i-migrate ang mga lumang entry na may maling English lokal na title
      // (hal. "Brothers" dapat "Ang Probinsyano") — re-save sa localStorage para permanent.
      let titlesFixed = false;
      sorted.forEach(item => {
        if (item && (item.title === 'Brothers' || item.title === 'FPJ\'s Ang Probinsyano') && item.type === 'tv') {
          item.title = 'Ang Probinsyano';
          titlesFixed = true;
        }
      });
      if (titlesFixed) {
        try { localStorage.setItem("watchHistory", JSON.stringify(history)); } catch (e) {}
      }

      sorted.forEach(item => {
        if (!item || !item.id) return;

        const mediaType = (item.type === "tv" || item.seasons || item.season || item.episode) ? "tv" : "movie";
        const itemTitle = item.title || item.name || "Untitled";

        const historyItem = document.createElement("div");
        historyItem.className = "history-item";

        // Click event para pumunta sa movie/tv page na may tamang URL parameters.
        // SPG titles (Romance/Vivamax) hindi pwedeng direktang i-bypass — dadaan sa gate.
        historyItem.onclick = () => {
          const fakeItem = { ...item, type: mediaType };
          if (typeof window.isSpgTitle === "function" && window.isSpgTitle(fakeItem)) {
            if (window.mjAuthReady) {
              window.mjAuthReady.then(() => {
                const loggedIn = typeof window.mjIsLoggedIn === "function" && window.mjIsLoggedIn();
                if (!loggedIn) {
                  if (!(typeof window.mjOpenAuthModal === "function" && window.mjOpenAuthModal())) {
                    window.location.href = "index.html#mj-login";
                  }
                  return;
                }
                if (sessionStorage.getItem("mjSpgConfirmed") === "1") { navigateHistoryItem(item, mediaType); return; }
                window.__mjSpgPass = true;
                if (typeof window.mjSpgGate === "function") { window.mjSpgGate(fakeItem); return; }
                navigateHistoryItem(item, mediaType);
              }).catch(() => navigateHistoryItem(item, mediaType));
            } else {
              window.__mjSpgPass = true;
              if (typeof window.mjSpgGate === "function") { window.mjSpgGate(fakeItem); return; }
              navigateHistoryItem(item, mediaType);
            }
            return;
          }
          navigateHistoryItem(item, mediaType);
        };

        const posterSrc = item.poster_path
          ? `https://image.tmdb.org/t/p/w300${item.poster_path}`
          : 'images/logo-192.png';

        historyItem.innerHTML = `
          <div style="position: relative; overflow: hidden; border-radius: 6px;">
            <img src="${posterSrc}" alt="${itemTitle}" loading="lazy" onerror="this.src='images/logo-192.png';" style="width: 100%; display: block;">
            <div class="history-item-overlay"></div>
            <div class="play-icon-overlay">
              <i class="fas fa-play"></i>
            </div>
          </div>
          <p class="history-item-title" style="margin-top: 6px; font-size: 13px; font-weight: 500; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${itemTitle} ${mediaType === 'tv' && item.season ? `<span style="color:#aaa; font-size:11px;">(S${item.season} E${item.episode || 1})</span>` : ''}
          </p>
        `;
        historyList.appendChild(historyItem);
      });
    }
  }

  // Event Listeners
  historyBtn.addEventListener('click', () => {
    historyModal.style.display = 'flex';
    loadWatchHistory();
  });

  closeBtn.addEventListener('click', () => {
    historyModal.style.display = 'none';
  });

  historyModal.addEventListener('click', (event) => {
    if (event.target === historyModal) {
      historyModal.style.display = 'none';
    }
  });
});

// --- Navigation helper para sa history items (ginagamit ng SPG gate flow) ---
function navigateHistoryItem(item, mediaType) {
  let targetUrl = `movie.html?id=${item.id}&type=${mediaType}`;
  if (mediaType === "tv") {
    targetUrl += `&season=${item.season || 1}&episode=${item.episode || 1}`;
  }
  window.location.href = targetUrl;
}

// --- Global function para sa pag-save ng history (Movie & TV show) ---
function saveToWatchHistory(itemData) {
  if (!itemData || !itemData.id) return;

  try {
    const rawId = String(itemData.id);
    const mediaType = (itemData.type === "tv" || itemData.seasons || itemData.season || itemData.episode) ? "tv" : "movie";
    // PH-aware title (hal. "Brothers" → "Ang Probinsyano")
    let itemTitle = itemData.title || itemData.name || "Untitled";
    if (itemData.type === "tv" && itemData.original_name && itemData.title && itemData.original_name !== itemData.title) {
      itemTitle = itemData.original_name;
    }

    let history = JSON.parse(localStorage.getItem("watchHistory") || "[]");

    // Alisin ang lumang kaparehong entry
    history = history.filter(h => !(String(h.id) === rawId && h.type === mediaType));

    // Ilagay ang bagong entry sa pinakaunahan
    history.unshift({
      id: itemData.id,
      title: itemTitle,
      type: mediaType,
      poster_path: itemData.poster_path || "",
      backdrop_path: itemData.backdrop_path || "",
      season: itemData.season || 1,
      episode: itemData.episode || 1,
      progress: itemData.progress || 0,
      timestamp: Date.now()
    });

    // Limit hanggang 20 items
    if (history.length > 20) {
      history = history.slice(0, 20);
    }

    localStorage.setItem("watchHistory", JSON.stringify(history));
  } catch (e) {
    console.error("Error saving watch history:", e);
  }
}

// Accessible globally
window.saveToWatchHistory = saveToWatchHistory;