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
    card.innerHTML = `
      <div class="movie-title">${movie.title}</div>
      <ul class="stream-list">
        <li data-src="filemoonMovie.html?src=${encodeURIComponent(movie.url)}">▶ Watch Now</li>
      </ul>
    `;
    container.appendChild(card);
  });

  // Attach click handlers
  document.querySelectorAll('.stream-list li').forEach(li => {
    li.addEventListener('click', function () {
      const src = this.getAttribute('data-src');
      if (src) {
       window.location.href = src;

      }
    });
  });
});
