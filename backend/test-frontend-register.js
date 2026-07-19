const axios = require('axios');

async function testFrontendRegister() {
  try {
    const res = await axios.post('http://localhost:3001/users/register', {
      email: 'testfrontend@example.com',
      password: 'Password123!',
      user: 'Test Frontend'
    });
    console.log('Success:', res.data);
  } catch (error) {
    console.error('Error Status:', error.response?.status);
    console.error('Error Data:', error.response?.data);
  }
}

testFrontendRegister();
