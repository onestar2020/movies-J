document.addEventListener("DOMContentLoaded", function () {
  const historyBtn = document.querySelector('.watch-history-btn');
  const historyModal = document.getElementById('watch-history-modal');
  const closeBtn = document.getElementById('close-history-modal');
  const historyList = document.getElementById('watch-history-list');

  const clearBtn = document.createElement('button');
  clearBtn.id = 'clear-history-btn';
  clearBtn.innerHTML = '<i class="fas fa-trash-alt"></i>'; // Changed to Font Awesome icon
  clearBtn.title = 'Clear Watch History';

  clearBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to clear your watch history?")) {
      localStorage.removeItem("watchHistory");
      loadWatchHistory();
    }
  });

  function loadWatchHistory() {
    const history = JSON.parse(localStorage.getItem("watchHistory") || "[]");
    historyList.innerHTML = '';

    if (history.length === 0) {
      historyList.innerHTML = '<p style="color: gray; text-align: center; grid-column: 1 / -1;">No watch history found.</p>';
      clearBtn.style.display = 'none';
      return;
    } else {
      clearBtn.style.display = 'flex';
    }

    const sorted = history.sort((a, b) => b.timestamp - a.timestamp);

    // IN-UPDATE: Binago ang buong loop para sa modernong design
    sorted.forEach(item => {
      const historyItem = document.createElement("div");
      historyItem.className = "history-item"; // Ang CSS na ang bahala sa styling

      const openItem = () => {
        if (item.type === 'upload') {
          // Assuming you have a function for this, otherwise, it needs to be created
          // showUploadModal(item.id); 
        } else {
          window.location.href = `movie.html?id=${item.id}&type=${item.type || 'movie'}`;
        }
      };

      // Idagdag ang click event sa buong card
      historyItem.addEventListener('click', openItem);
      
      const posterSrc = item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : 'images/logo.png';

      historyItem.innerHTML = `
        <img src="${posterSrc}" alt="${item.title}" loading="lazy">
        <div class="history-item-overlay"></div>
        <p class="history-item-title">${item.title}</p>
        <div class="play-icon-overlay">
            <i class="fas fa-play"></i>
        </div>
      `;
      
      historyList.appendChild(historyItem);
    });
  }

  // --- Modal Event Listeners ---
  historyBtn.addEventListener('click', () => {
    const modalContent = historyModal.querySelector('.modal-content');
    // Siguraduhing isang beses lang idadagdag ang button
    if (!modalContent.contains(clearBtn)) {
        modalContent.appendChild(clearBtn);
    }
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

// ✅ Global function for saving to history (NO CHANGES HERE)
function saveToWatchHistory({ title, id, type = 'movie', poster_path = '' }) {
  let history = JSON.parse(localStorage.getItem("watchHistory") || "[]");
  history = history.filter(item => !(item.id === id && item.type === type));
  history.unshift({ title, id, type, poster_path, timestamp: Date.now() });
  if (history.length > 20) history = history.slice(0, 20); // Limit history to 20 items
  localStorage.setItem("watchHistory", JSON.stringify(history));
}
