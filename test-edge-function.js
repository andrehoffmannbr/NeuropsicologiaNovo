const https = require('https');

const options = {
  hostname: 'viiukipyuimjandushqh.supabase.co',
  path: '/functions/v1/refresh-views',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer np_refresh_views_2024_7e9a1b3c4d5f6g7h8i9j0k',
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response:', data);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.end(); 