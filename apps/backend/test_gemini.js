const axios = require('axios');
require('dotenv').config({path: '../../.env'});
const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const apiKey = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

axios.post(url, {
  contents: [{ role: 'user', parts: [{ text: 'Hello' }] }]
}).then(res => {
  console.log('Gemini success:', res.data.candidates[0].content.parts[0].text);
  process.exit(0);
}).catch(err => {
  console.error('Gemini error:', err.response ? err.response.status + ' ' + err.response.data.error?.message : err.message);
  process.exit(1);
});
