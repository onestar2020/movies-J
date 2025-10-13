// === CODE PARA SA netlify/functions/tmdb.js ===

exports.handler = async function (event, context) {
  // Dito, secure na kinukuha ang API Key mula sa Netlify settings.
  const API_KEY = process.env.TMDB_API_KEY;

  // Kinukuha nito lahat ng parameters na pinasa ng website mo (e.g., endpoint, query, page).
  const params = event.queryStringParameters;
  if (!params.endpoint) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Endpoint is required' }),
    };
  }

  // Gumagawa ito ng bagong URL para kausapin ang TMDB.
  // Dinadagdag niya ang API key at lahat ng iba pang parameters.
  const searchParams = new URLSearchParams();
  searchParams.append('api_key', API_KEY);

  for (const key in params) {
    if (key !== 'endpoint') {
      searchParams.append(key, params[key]);
    }
  }

  const tmdbUrl = `https://api.themoviedb.org/3/${params.endpoint}?${searchParams.toString()}`;

  try {
    // Mula dito sa "secretong taguan", kinakausap na niya ang TMDB.
    const response = await fetch(tmdbUrl);
    const data = await response.json();

    // Ibinabalik niya ang resulta sa website mo.
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch data from TMDB' }),
    };
  }
};