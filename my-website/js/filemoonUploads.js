const filemoonUploads = [
  {
    title: "Zombies 4: Dawn of the Vampires",
    url: "https://filemoon.to/e/uj7u5pzchgi4",
    type: "filemoon"
  },
  // Add more entries as needed
];

window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('more-upload-list');
  if (!container) return;

  filemoonUploads.forEach(movie => {
    const card = document.createElement('div');
    card.classList.add('movie-card');

    const encodedUrl = encodeURIComponent(movie.url);

    card.innerHTML = `
      <div class="movie-title">${movie.title}</div>
      <ul class="stream-list">
        <li class="filemoon-watch" data-src="${encodedUrl}">▶ Watch Now</li>
      </ul>
    `;

    container.appendChild(card);

    // Attach event directly to this card's <li>
    const watchBtn = card.querySelector('.filemoon-watch');
    watchBtn.addEventListener('click', function () {
      const filemoonUrl = this.getAttribute('data-src');
      if (filemoonUrl) {
        sessionStorage.setItem('filemoonLink', decodeURIComponent(filemoonUrl));
        window.location.href = 'filemoonMovie.html';
      } else {
        alert("Video link missing.");
      }
    });
  });
});
