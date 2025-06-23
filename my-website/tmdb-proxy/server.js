const express = require('express');
const fetch = require('node-fetch');
const app = express();

const API_KEY = 'YOUR_TMDB_API_KEY'; // 🔁 Replace with your real TMDB API key

app.use(express.json());
app.use(express.static('public'));

app.get('/api/:path/:media/:time', async (req, res) => {
  const { path, media, time } = req.params;
  const page = req.query.page || 1;
  const url = `https://api.themoviedb.org/3/${path}/${media}/${time}?api_key=${API_KEY}&page=${page}`;

  try {
    const result = await fetch(url);
    const data = await result.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'TMDB request failed.' });
  }
});

app.get('/api/search/:query', async (req, res) => {
  const query = encodeURIComponent(req.params.query);
  const url = `https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&query=${query}`;

  try {
    const result = await fetch(url);
    const data = await result.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Search failed.' });
  }
});

app.get('/api/videos/:type/:id', async (req, res) => {
  const { type, id } = req.params;
  const url = `https://api.themoviedb.org/3/${type}/${id}/videos?api_key=${API_KEY}`;

  try {
    const result = await fetch(url);
    const data = await result.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Video fetch failed.' });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log('TMDB Proxy server running...');
});
