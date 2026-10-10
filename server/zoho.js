const axios = require('axios');
require('dotenv').config({ path: '../.env' }); // Assuming .env is at the root of the project crm-app/crm-app

let accessToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpiresAt) {
    return accessToken;
  }

  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Zoho credentials missing in .env');
  }

  try {
    const response = await axios.post('https://accounts.zoho.in/oauth/v2/token', null, {
      params: {
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken
      }
    });

    if (response.data.error) {
      throw new Error(`Zoho OAuth Error: ${response.data.error}`);
    }

    accessToken = response.data.access_token;
    // Expire 5 minutes early to be safe
    tokenExpiresAt = Date.now() + (response.data.expires_in * 1000) - 300000; 

    return accessToken;
  } catch (err) {
    console.error('Failed to get Zoho access token:', err.message);
    throw err;
  }
}

async function zohoApi(method, endpoint, params = {}, data = null) {
  const token = await getAccessToken();
  const url = `https://www.zohoapis.in/crm/v8${endpoint}`;
  
  try {
    const res = await axios({
      method,
      url,
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`
      },
      params,
      data
    });
    return res.data;
  } catch (err) {
    if (err.response) {
      console.error(`Zoho API Error (${url}):`, err.response.data);
    } else {
      console.error(`Zoho API Error (${url}):`, err.message);
    }
    throw err;
  }
}

module.exports = {
  getAccessToken,
  zohoApi
};

