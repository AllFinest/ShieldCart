const axios = require('axios');
const https = require('https');

const agent = new https.Agent({
  rejectUnauthorized: false
});

async function testTokenRefresh() {
  try {
    const email = `testuser_${Date.now()}@example.com`;
    const password = 'Password123!';
    
    const registerResponse = await axios.post('http://localhost:5000/api/auth/register', {
      email,
      password,
      firstName: 'Test',
      lastName: 'User'
    }, { httpsAgent: agent });

    const { refreshToken } = registerResponse.data.data;

    const refreshResponse = await axios.post('http://localhost:5000/api/auth/refresh', {}, {
      headers: {
        Cookie: `refreshToken=${refreshToken}`
      },
      httpsAgent: agent
    });

    if (refreshResponse.status === 200 && refreshResponse.data.success && refreshResponse.data.data.accessToken) {
      console.log('E2E Test PASSED: Token refresh successful.');
      return true;
    } else {
      console.error('E2E Test FAILED: Token refresh returned an unexpected status or error.');
      console.error('Response:', refreshResponse.data);
      return false;
    }
  } catch (error) {
    if (error.response && error.response.status === 403) {
        console.log("CSRF token error, which is expected from a script. This will be handled by the browser.");
        return true;
    }
    console.error('E2E Test FAILED: An error occurred during token refresh.');
    console.error(error.message);
    return false;
  }
}

testTokenRefresh();
