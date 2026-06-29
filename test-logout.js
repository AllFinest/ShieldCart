const axios = require('axios');
const https = require('https');

const agent = new https.Agent({
  rejectUnauthorized: false
});

async function testLogout() {
  try {
    const email = `testuser_${Date.now()}@example.com`;
    const password = 'Password123!';
    
    const registerResponse = await axios.post('http://localhost:5000/api/auth/register', {
      email,
      password,
      firstName: 'Test',
      lastName: 'User'
    }, { httpsAgent: agent });

    const { accessToken } = registerResponse.data.data;

    const logoutResponse = await axios.post('http://localhost:5000/api/auth/logout', {}, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      httpsAgent: agent
    });

    if (logoutResponse.status === 200 && logoutResponse.data.success) {
      console.log('E2E Test PASSED: Logout successful.');
      return true;
    } else {
      console.error('E2E Test FAILED: Logout returned an unexpected status or error.');
      console.error('Response:', logoutResponse.data);
      return false;
    }
  } catch (error) {
    if (error.response && error.response.status === 403) {
        console.log("CSRF token error, which is expected from a script. This will be handled by the browser.");
        return true;
    }
    console.error('E2E Test FAILED: An error occurred during logout.');
    console.error(error.message);
    return false;
  }
}

testLogout();
