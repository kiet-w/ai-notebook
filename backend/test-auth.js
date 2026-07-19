const axios = require('axios');

async function run() {
  const api = axios.create({ baseURL: 'http://localhost:3001' });
  const random = Math.floor(Math.random() * 100000);
  const email = `test${random}@example.com`;
  const password = 'Password123!';
  const user = `testuser${random}`;

  console.log(`--- REGISTER ---`);
  try {
    const res = await api.post('/users/register', { email, password, user });
    console.log('Register Success:', res.data);
    console.log('Cookies received:', res.headers['set-cookie']);
  } catch (err) {
    console.error('Register Error:', err.response?.data || err.message);
  }

  console.log(`\n--- LOGIN ---`);
  try {
    const res = await api.post('/users/login', { email, password });
    console.log('Login Success:', res.data);
    console.log('Cookies received:', res.headers['set-cookie']);
  } catch (err) {
    console.error('Login Error:', err.response?.data || err.message);
  }

  console.log(`\n--- LOGIN WRONG PASSWORD ---`);
  try {
    const res = await api.post('/users/login', { email, password: 'wrongpassword' });
    console.log('Login Success:', res.data);
  } catch (err) {
    console.error('Login Error (Expected):', err.response?.data || err.message);
  }
}

run();
