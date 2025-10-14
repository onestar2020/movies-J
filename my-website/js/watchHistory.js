document.addEventListener("DOMContentLoaded", function () {
  const historyBtn = document.querySelector('.watch-history-btn');
  const historyModal = document.getElementById('watch-history-modal');
  const closeBtn = document.getElementById('close-history-modal');
  const historyList = document.getElementById('watch-history-list');

  // Create Clear History Button
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
      historyList.innerHTML = '<p style="color: gray; text-align: center;">No watch history found.</p>';
      return;
    }

    const sorted = history.sort((a, b) => b.timestamp - a.timestamp);
    historyList.appendChild(clearBtn);

    sorted.forEach(item => {
      const div = document.createElement("div");
      div.className = "history-item";
      div.style.cssText = `
    display: flex;
    flex-direction: column; /* Para magkapatong ang image, title, at button */
    align-items: center;
    text-align: center;
    gap: 8px; /* Espasyo sa pagitan ng image at text */
`;

      const img = document.createElement('img');
      img.src = item.poster_path
        ? `https://image.tmdb.org/t/p/w200${item.poster_path}`
        : 'https://via.placeholder.com/120x180?text=No+Image';
      img.alt = item.title;
      img.style.cssText = `
        width: 80px;
        border-radius: 6px;
        cursor: pointer;
      `;

      const detailsDiv = document.createElement('div');
      detailsDiv.style.flex = '1';

      const title = document.createElement('h4');
      title.textContent = item.title;
      title.style.margin = '0';

      const resumeBtn = document.createElement('button');
      resumeBtn.textContent = '▶ Resume';
      resumeBtn.style.cssText = `
        margin-top: 5px;
        padding: 5px 10px;
        background-color: #1976D2;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      `;

      const openItem = () => {
        if (item.type === 'upload') {
          showUploadModal(item.id);
        } else {
          window.location.href = `movie.html?id=${item.id}&type=${item.type || 'movie'}`;
        }
      };

      img.addEventListener('click', openItem);
      resumeBtn.addEventListener('click', openItem);

      detailsDiv.appendChild(title);
      detailsDiv.appendChild(resumeBtn);
      div.appendChild(img);
      div.appendChild(detailsDiv);
      historyList.appendChild(div);
    });
  }

  historyBtn.addEventListener('click', () => {
    historyModal.style.display = 'flex';
    loadWatchHistory();
  });

  closeBtn.addEventListener('click', () => {
    historyModal.style.display = 'none';
  });
});

// ✅ Global function for saving to history
function saveToWatchHistory({ title, id, type = 'movie', poster_path = '' }) {
  let history = JSON.parse(localStorage.getItem("watchHistory") || "[]");
  history = history.filter(item => !(item.id === id && item.type === type));
  history.unshift({ title, id, type, poster_path, timestamp: Date.now() });
  if (history.length > 20) history = history.slice(0, 20);
  localStorage.setItem("watchHistory", JSON.stringify(history));
}
