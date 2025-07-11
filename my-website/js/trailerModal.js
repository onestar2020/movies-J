let trailerIndex = 0;
let trailerList = [];

function openTrailerModal() {
  document.getElementById('trailer-modal').style.display = 'flex';
  playTrailer(trailerList[trailerIndex]);
}

function closeTrailerModal() {
  document.getElementById('trailer-modal').style.display = 'none';
  document.getElementById('trailer-iframe').src = '';
}

function loadNextTrailer() {
  trailerIndex = (trailerIndex + 1) % trailerList.length;
  playTrailer(trailerList[trailerIndex]);
}

function playTrailer(data) {
  const { title, trailerId, movieUrl } = data;
  document.getElementById('trailer-title').innerText = title;
  document.getElementById('trailer-iframe').src = `https://www.youtube.com/embed/${trailerId}?autoplay=1&rel=0`;
  document.getElementById('watch-full-btn').onclick = () => {
    window.location.href = movieUrl;
  };
}

function initTrailerPopup() {
  if (sessionStorage.getItem("trailer_shown")) return;
  sessionStorage.setItem("trailer_shown", "yes");

  trailerList = [
    {
      title: "The Batman",
      trailerId: "mqqft2x_Aa4",
      movieUrl: "/movie.html?id=12345"
    },
    {
      title: "John Wick",
      trailerId: "2AUmvWm5ZDQ",
      movieUrl: "/movie.html?id=67890"
    }
  ];

  openTrailerModal();
}

window.addEventListener('load', initTrailerPopup);
