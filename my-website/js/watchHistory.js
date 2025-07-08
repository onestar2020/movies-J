<script>
  document.addEventListener("DOMContentLoaded", function () {
    const historyBtn = document.querySelector('.watch-history-btn');
    const historyModal = document.getElementById('watch-history-modal');
    const closeBtn = document.getElementById('close-history-modal');
    const historyList = document.getElementById('watch-history-list');

    const clearBtn = document.createElement('button');
    clearBtn.textContent = '🗑️ Clear History';
    clearBtn.style.cssText = `
      margin: 10px auto;
      display: block;
      background-color: #e53935;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
    `;
    clearBtn.onclick = () => {
      if (confirm("Are you sure you want to clear your watch history?")) {
        localStorage.removeItem("watchHistory");
        loadWatchHistory();
      }
    };

    function loadWatchHistory() {
      const history = JSON.parse(localStorage.getItem("watchHistory") || "[]");
      historyList.innerHTML = '';

      if (history.length === 0) {
        historyList.innerHTML = '<p style="color: gray; text-align: center;">No watch history found.</p>';
        return;
      }

      // Append clear button
      historyList.appendChild(clearBtn);

      // Sort by latest viewed
      const sorted = history.sort((a, b) => b.timestamp - a.timestamp);

      sorted.forEach(item => {
        const div = document.createElement("div");
        div.className = "history-item";
        div.style = "margin: 10px 0; display: flex; gap: 10px; align-items: center;";

        div.innerHTML = `
          <img src="${item.poster_path 
                      ? 'https://image.tmdb.org/t/p/w200' + item.poster_path 
                      : 'https://via.placeholder.com/120x180?text=No+Image'}" 
               alt="${item.title}" 
               style="width: 80px; border-radius: 6px;" />
          <div style="flex: 1;">
            <h4 style="margin: 0;">${item.title}</h4>
            <button onclick="${
              item.type === 'upload'
                ? `showUploadModal('${item.id}')`
                : `window.location.href='movie.html?id=${item.id}&type=${item.type || 'movie'}'`
            }">▶ Resume</button>
          </div>
        `;
        historyList.appendChild(div);
      });
    }

    // Open modal
    historyBtn.addEventListener('click', () => {
      historyModal.style.display = 'flex';
      loadWatchHistory();
    });

    // Close modal
    closeBtn.addEventListener('click', () => {
      historyModal.style.display = 'none';
    });
  });

  // ✅ Global reusable save function
  function saveToWatchHistory({ title, id, type = 'movie', poster_path = '' }) {
    let history = JSON.parse(localStorage.getItem("watchHistory") || "[]");

    // Remove existing duplicate
    history = history.filter(item => !(item.id === id && item.type === type));

    // Add new on top with timestamp
    history.unshift({ title, id, type, poster_path, timestamp: Date.now() });

    // Limit to 20 items
    if (history.length > 20) history = history.slice(0, 20);

    localStorage.setItem("watchHistory", JSON.stringify(history));
  }
</script>
