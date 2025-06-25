let uploads = [];

async function loadUploadsFromSheet() {
  try {
    const res = await fetch('https://opensheet.elk.sh/14n8-JDwTp5Q2RUTuAjOQtm8WWCxiAVcNNqnTxW1Js80/Uploads');
    const data = await res.json();

    uploads = data
      .filter(movie => movie.title && movie.id)
      .map(movie => ({
        title: movie.title,
        id: movie.id
      }));

    // After loading, call the function to display uploaded movies
    if (typeof loadUploadedMovies === 'function') {
      loadUploadedMovies();
    }
  } catch (error) {
    console.error('Failed to load uploads from sheet:', error);
  }
}

loadUploadsFromSheet();
