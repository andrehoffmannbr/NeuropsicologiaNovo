import fetch from 'node-fetch';

const url = 'https://viiukipyuimjandushqh.supabase.co/functions/v1/refresh-views';
const options = {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpaXVraXB5dWltamFuZHVzaHFoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQ4NTQ1NywiZXhwIjoyMDY3MDYxNDU3fQ.Ow2Y3HgKXxyXxGZVvVW4z4wXjzHmxQ5gJ5vK5jK5q5g',
    'Content-Type': 'application/json'
  }
};

try {
  console.log('Enviando requisição...');
  const response = await fetch(url, options);
  console.log('Status:', response.status);
  
  const data = await response.text();
  console.log('Resposta:', data);
} catch (error) {
  console.error('Erro:', error);
} 