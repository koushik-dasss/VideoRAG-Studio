const axios = require('axios');
require('dotenv').config({path: '../../.env'});
const apiKey = process.env.GEMINI_API_KEY;

axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
  .then(res => {
    const models = res.data.models.map(m => m.name);
    console.log('Available models:', models.join(', '));
  })
  .catch(err => {
    console.error('Error fetching models:', err.response ? err.response.data : err.message);
  });
