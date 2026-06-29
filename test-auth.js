const axios = require("axios");
const axiosCookieJarSupport = require("axios-cookiejar-support").wrapper;
const tough = require("tough-cookie");
async function test() {
  const jar = new tough.CookieJar();
  const api = axiosCookieJarSupport(axios.create({ baseURL: "http://localhost:5000/api", jar, withCredentials: true }));
  // Get CSRF
  const csrfRes = await api.get("/csrf-token");
  const csrfToken = csrfRes.data.csrfToken;
  api.defaults.headers.common["x-csrf-token"] = csrfToken;
  
  // Register
  try {
    const regRes = await api.post("/auth/register", { email: "tester@example.com", password: "Password123!", firstName: "Test", lastName: "User" });
    console.log("Registration successful!", regRes.data.data.user.email);
  } catch(e) {
    console.log("Registration error", e.response?.data);
  }
}
test();
