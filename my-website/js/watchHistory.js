// ✅ js/watchHistory.js (with Safety Checks)

document.addEventListener("DOMContentLoaded", function () {
  // Get elements AFTER DOM is ready
  const historyBtn = document.querySelector('.watch-history-btn');
  const historyModal = document.getElementById('watch-history-modal');

  // *** SAFETY CHECK: Exit if essential elements for this script are missing ***
  if (!historyBtn || !historyModal) {
    // console.log("Watch history elements not found on this page."); // Optional log
    return; // Stop executing this script on pages without history elements
  }

  // Find elements inside the modal only if the modal exists
  const closeBtn = historyModal.querySelector('#close-history-modal');
  const historyList = historyModal.querySelector('#watch-history-list');
  const modalContent = historyModal.querySelector('.modal-content'); // Find modal content

  // *** More Safety Checks ***
  if (!closeBtn || !historyList || !modalContent) {
      console.error("Watch history modal is incomplete. Missing close button, list, or content area.");
      return; // Stop if modal structure is broken
  }


  const clearBtn = document.createElement('button');
  clearBtn.id = 'clear-history-btn';
  clearBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
  clearBtn.title = 'Clear Watch History';
  // Append clear button ONCE to modal content
  if (!modalContent.querySelector('#clear-history-btn')) {
      modalContent.appendChild(clearBtn);
       clearBtn.style.display = 'none'; // Initially hidden
  }


  clearBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to clear your watch history?")) {
      localStorage.removeItem("watchHistory");
      loadWatchHistory(); // Reload list after clearing
    }
  });

  function loadWatchHistory() {
    // Ensure historyList exists before modifying
    if (!historyList) return;

    let history = [];
    try {
        history = JSON.parse(localStorage.getItem("watchHistory") || "[]");
    } catch (e) {
         console.error("Error parsing watch history from localStorage:", e);
         history = []; // Reset to empty array on error
         localStorage.removeItem("watchHistory"); // Clear corrupted data
    }

    historyList.innerHTML = ''; // Clear previous list

    if (history.length === 0) {
      historyList.innerHTML = '<p style="color: gray; text-align: center; grid-column: 1 / -1; padding: 20px;">No watch history found.</p>';
      clearBtn.style.display = 'none'; // Hide clear button if list is empty
    } else {
      clearBtn.style.display = 'flex'; // Show clear button if list has items

      // Sort by timestamp descending
      const sorted = history.sort((a, b) => b.timestamp - a.timestamp);

      sorted.forEach(item => {
        // Basic check for item validity
        if (!item || !item.id || !item.title) return;

        const historyItem = document.createElement("div");
        historyItem.className = "history-item";

        const openItem = () => {
            // Ensure type is defined, default to 'movie'
            const type = item.type || 'movie';
            window.location.href = `movie.html?id=${item.id}&type=${type}`;
        };

        historyItem.addEventListener('click', openItem);

        // Use a fallback image if poster_path is missing
        const posterSrc = item.poster_path
            ? `https://image.tmdb.org/t/p/w300${item.poster_path}`
            : 'images/logo-192.png'; // Use your placeholder

        historyItem.innerHTML = `
          <img src="${posterSrc}" alt="${item.title}" loading="lazy" onerror="this.src='images/logo-192.png';"> <div class="history-item-overlay"></div>
          <p class="history-item-title">${item.title}</p>
          <div class="play-icon-overlay">
              <i class="fas fa-play"></i>
          </div>
        `;
        historyList.appendChild(historyItem);
      });
    }
  }

  // --- Modal Event Listeners (already checked that elements exist) ---
  historyBtn.addEventListener('click', () => {
    historyModal.style.display = 'flex';
    loadWatchHistory(); // Load history when modal opens
  });

  closeBtn.addEventListener('click', () => {
    historyModal.style.display = 'none';
  });

  // Close modal on overlay click
  historyModal.addEventListener('click', (event) => {
    if (event.target === historyModal) {
        historyModal.style.display = 'none';
    }
  });

}); // --- END OF DOMContentLoaded ---

// --- Global function for saving to history ---
// Ensure this function exists globally
function saveToWatchHistory({ title, id, type = 'movie', poster_path = '' }) {
    console.log("Saving to history:", { title, id, type });
    try {
        let history = JSON.parse(localStorage.getItem("watchHistory") || "[]");
        // Remove existing entry for the same item
        history = history.filter(item => !(item.id === id && item.type === type));
        // Add new item to the beginning
        history.unshift({ title, id, type, poster_path, timestamp: Date.now() });
        // Limit history size
        if (history.length > 20) {
            history = history.slice(0, 20);
        }
        localStorage.setItem("watchHistory", JSON.stringify(history));
    } catch (e) {
        console.error("Error saving watch history:", e);
    }
}
// Make it globally accessible if not already (though scripts usually share the window scope)
window.saveToWatchHistory = saveToWatchHistory;