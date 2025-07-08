// Initialize Watch History
document.addEventListener("DOMContentLoaded", function () {
  const historyBtn = document.querySelector('.watch-history-btn');
  const historyModal = document.getElementById('watch-history-modal');
  const closeBtn = document.getElementById('close-history-modal');
  const historyList = document.getElementById('watch-history-list');

  // Load from localStorage
  function loadWatchHistory() {
    const history = JSON.parse(localStorage.getItem('watchHistory')) || [];
    historyList.innerHTML = '';

    if (history.length === 0) {
      historyList.innerHTML = '<p style="color: gray; text-align: center;">No watch history found.</p>';
      return;
    }

    history.reverse().forEach(item => {
      const div = document.createElement('div');
      div.className = 'history-item';
      div.innerHTML = `
        <img src="${item.img}" alt="${item.title}" />
        <div>
          <h4>${item.title}</h4>
          <button onclick="location.href='movie.html?id=${item.id}&type=${item.type}'">▶ Resume</button>
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
