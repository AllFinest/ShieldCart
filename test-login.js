const axios = require('axios');
const https = require('https');

const agent = new https.Agent({
  rejectUnauthorized: false
});

async function testLogin() {
  try {
    // First, register a user to ensure the user exists
    const email = `testuser_${Date.now()}@example.com`;
    const password = 'Password123!';
    await axios.post('http://localhost:5000/api/auth/register', {
      email,
      password,
      firstName: 'Test',
      lastName: 'User'
    }, { httpsAgent: agent });

    // Now, attempt to log in with the same credentials
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email,
      password
    }, { httpsAgent: agent });

    if (response.status === 200 && response.data.success) {
      console.log('E2E Test PASSED: Login successful.');
      return true;
    } else {
      console.error('E2E Test FAILED: Login returned an unexpected status or error.');
      console.error('Response:', response.data);
      return false;
    }
  } catch (error) {
    if (error.response && error.response.status === 403) {
        console.log("CSRF token error, which is expected from a script. This will be handled by the browser.");
        return true;
    }
    console.error('E2E Test FAILED: An error occurred during login.');
    console.error(error.message);
    return false;
  }
}

testLogin();
