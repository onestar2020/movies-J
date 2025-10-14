document.addEventListener("DOMContentLoaded", function () {
  const historyBtn = document.querySelector('.watch-history-btn');
  const historyModal = document.getElementById('watch-history-modal');
  const closeBtn = document.getElementById('close-history-modal');
  const historyList = document.getElementById('watch-history-list');

  // --- Create the Modern Clear History Button (once) ---
  const clearBtn = document.createElement('button');
  clearBtn.id = 'clear-history-btn'; // ID for CSS styling
  clearBtn.textContent = '🗑️';        // Icon as text
  clearBtn.title = 'Clear Watch History'; // Tooltip on hover

  clearBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to clear your watch history?")) {
      localStorage.removeItem("watchHistory");
      loadWatchHistory(); // Reload the list to show it's empty
    }
  });

  function loadWatchHistory() {
    const history = JSON.parse(localStorage.getItem("watchHistory") || "[]");
    historyList.innerHTML = ''; // Clear previous items

    // Show or hide the clear button based on history content
    if (history.length === 0) {
      historyList.innerHTML = '<p style="color: gray; text-align: center; grid-column: 1 / -1;">No watch history found.</p>';
      clearBtn.style.display = 'none'; // Hide button if no history
      return;
    } else {
      clearBtn.style.display = 'flex'; // Show button if there is history
    }

    const sorted = history.sort((a, b) => b.timestamp - a.timestamp);

    sorted.forEach(item => {
      const div = document.createElement("div");
      div.className = "history-item";
      // This style is for the container of each movie in the history
      div.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 8px;
      `;

      const img = document.createElement('img');
      img.src = item.poster_path
        ? `https://image.tmdb.org/t/p/w200${item.poster_path}`
        : 'images/logo.png'; // Fallback image
      img.alt = item.title;
      // Improved image style to fill the grid cell
      img.style.cssText = `
        width: 100%;
        height: auto;
        aspect-ratio: 2 / 3; /* Maintain movie poster aspect ratio */
        object-fit: cover;
        border-radius: 6px;
        cursor: pointer;
        transition: transform 0.2s ease;
      `;
      img.onmouseover = () => { img.style.transform = 'scale(1.05)'; };
      img.onmouseout = () => { img.style.transform = 'scale(1)'; };

      const detailsDiv = document.createElement('div');
      
      const title = document.createElement('p'); // Use <p> for better semantics
      title.textContent = item.title;
      title.style.cssText = `
        font-size: 0.9rem;
        font-weight: 500;
        margin: 0;
        width: 100%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      `;

      const resumeBtn = document.createElement('button');
      resumeBtn.textContent = '▶ Resume';
      resumeBtn.style.cssText = `
        margin-top: 5px;
        padding: 6px 12px;
        background-color: #1976D2;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        width: 100%;
        font-size: 0.8rem;
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

  // --- Modal Event Listeners ---
  historyBtn.addEventListener('click', () => {
    // Attach the clear button to the modal content before showing it
    historyModal.querySelector('.modal-content').appendChild(clearBtn);
    historyModal.style.display = 'flex';
    loadWatchHistory();
  });

  closeBtn.addEventListener('click', () => {
    historyModal.style.display = 'none';
  });

  // Close modal if clicking outside the content
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