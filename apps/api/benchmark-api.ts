import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const API = 'http://localhost:10000/api/v1';

async function run() {
  console.log('Starting API benchmark...');

  // Step 1: Login
  const loginBody = {
    email: 'teacher@collegea.edu',
    password: 'password123',
    role: 'TEACHER'
  };

  const startLogin = Date.now();
  const loginRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-college-id': 'college-a',
      'x-forwarded-for': '10.0.1.102'
    },
    body: JSON.stringify(loginBody)
  });
  
  const loginData = await loginRes.json() as any;
  const loginTime = Date.now() - startLogin;
  console.log(`Login status: ${loginRes.status} in ${loginTime}ms`);

  if (!loginRes.ok) {
    console.error('Login failed:', loginData);
    return;
  }

  const token = loginData.data?.accessToken;
  console.log(`Token acquired: ${!!token}`);

  // Step 2: Call /auth/me twice to see if warm queries speed up
  for (let i = 1; i <= 3; i++) {
    const startMe = Date.now();
    const meRes = await fetch(`${API}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-college-id': 'college-a'
      }
    });
    const meData = await meRes.json() as any;
    const meTime = Date.now() - startMe;
    console.log(`/auth/me (Attempt ${i}) status: ${meRes.status} in ${meTime}ms (email: ${meData.data?.email})`);
  }
}

run().catch(console.error);
