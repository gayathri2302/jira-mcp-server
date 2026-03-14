import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const baseUrl = `https://${process.env.JIRA_HOST}`;

console.log('🔍 Testing different authentication methods...\n');
console.log(`Base URL: ${baseUrl}`);
console.log(`Username: ${process.env.JIRA_USERNAME}\n`);

// Test 1: Basic Auth
async function testBasicAuth() {
  console.log('1️⃣ Testing Basic Authentication...');
  try {
    const response = await axios.get(`${baseUrl}/rest/api/2/myself`, {
      auth: {
        username: process.env.JIRA_USERNAME,
        password: process.env.JIRA_PASSWORD,
      },
      headers: { 
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    console.log('✅ Basic Auth successful!');
    console.log(`   User: ${response.data.displayName}\n`);
    return true;
  } catch (error) {
    console.log('❌ Basic Auth failed');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Message: ${error.response?.data?.errorMessages || error.message}\n`);
    return false;
  }
}

// Test 2: Session-based auth
async function testSessionAuth() {
  console.log('2️⃣ Testing Session-based Authentication...');
  try {
    const sessionResponse = await axios.post(
      `${baseUrl}/rest/auth/1/session`,
      {
        username: process.env.JIRA_USERNAME,
        password: process.env.JIRA_PASSWORD,
      },
      {
        headers: { 
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );
    
    const sessionCookie = sessionResponse.headers['set-cookie'];
    console.log('✅ Session created successfully!');
    
    // Test the session
    const testResponse = await axios.get(`${baseUrl}/rest/api/2/myself`, {
      headers: { 
        'Accept': 'application/json',
        'Cookie': sessionCookie.join('; '),
      },
    });
    
    console.log(`✅ Session Auth successful!`);
    console.log(`   User: ${testResponse.data.displayName}\n`);
    return { success: true, cookie: sessionCookie };
  } catch (error) {
    console.log('❌ Session Auth failed');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Message: ${error.response?.data?.errorMessages || error.message}\n`);
    return { success: false };
  }
}

// Test 3: Try with different headers
async function testWithHeaders() {
  console.log('3️⃣ Testing with X-Atlassian-Token header...');
  try {
    const response = await axios.get(`${baseUrl}/rest/api/2/myself`, {
      auth: {
        username: process.env.JIRA_USERNAME,
        password: process.env.JIRA_PASSWORD,
      },
      headers: { 
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Atlassian-Token': 'no-check',
      },
    });
    console.log('✅ Auth with headers successful!');
    console.log(`   User: ${response.data.displayName}\n`);
    return true;
  } catch (error) {
    console.log('❌ Auth with headers failed');
    console.log(`   Status: ${error.response?.status}\n`);
    return false;
  }
}

async function runTests() {
  const basicAuthWorks = await testBasicAuth();
  
  if (!basicAuthWorks) {
    const sessionAuth = await testSessionAuth();
    
    if (!sessionAuth.success) {
      await testWithHeaders();
    }
  }
  
  console.log('\n💡 Recommendation:');
  if (basicAuthWorks) {
    console.log('   Use Basic Authentication (current implementation)');
  } else {
    console.log('   Consider using Session-based authentication or check credentials');
    console.log('   You may need to verify:');
    console.log('   - Username and password are correct');
    console.log('   - Your account has API access enabled');
    console.log('   - There are no IP restrictions');
    console.log('   - CAPTCHA is not required for your account');
  }
}

runTests();
