// netlify/functions/tmdb.js (FINAL VERSION)

exports.handler = async function (event, context) {
  // 1. Kunin ang TMDB API Key mula sa Environment Variable
  const API_KEY = process.env.TMDB_API_KEY;

  // 2. Kunin lahat ng parameters mula sa request (e.g., endpoint, query, page)
  const params = event.queryStringParameters;
  if (!params.endpoint) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Endpoint is required' }),
    };
  }

  // 3. Buuin ang TMDB URL
  // Gumamit ng URLSearchParams para mas malinis at safe
  const searchParams = new URLSearchParams();
  searchParams.append('api_key', API_KEY);

  for (const key in params) {
    if (key !== 'endpoint') {
      searchParams.append(key, params[key]);
    }
  }
  
  const tmdbUrl = `https://api.themoviedb.org/3/${params.endpoint}?${searchParams.toString()}`;

  try {
    // 4. Tawagin ang TMDB API mula sa server-side
    const response = await fetch(tmdbUrl);
    const data = await response.json();

    // 5. Ibalik ang resulta sa iyong frontend website
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