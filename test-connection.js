import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const baseUrl = `https://${process.env.JIRA_HOST}`;
const auth = {
  username: process.env.JIRA_USERNAME,
  password: process.env.JIRA_PASSWORD,
};

console.log('🔍 Testing Jira connection...\n');
console.log(`Base URL: ${baseUrl}`);
console.log(`Username: ${auth.username}\n`);

async function testConnection() {
  try {
    console.log('1️⃣ Testing authentication with /rest/api/2/myself...');
    const myselfResponse = await axios.get(`${baseUrl}/rest/api/2/myself`, {
      auth,
      headers: { 'Accept': 'application/json' },
    });
    console.log('✅ Authentication successful!');
    console.log(`   Logged in as: ${myselfResponse.data.displayName} (${myselfResponse.data.emailAddress})\n`);

    console.log('2️⃣ Searching for recent NGSB tickets...');
    const searchResponse = await axios.get(`${baseUrl}/rest/api/2/search`, {
      auth,
      headers: { 'Accept': 'application/json' },
      params: {
        jql: `project = NGSB ORDER BY updated DESC`,
        maxResults: 5,
        fields: 'key,summary,status,assignee',
      },
    });

    console.log(`✅ Found ${searchResponse.data.total} tickets in NGSB project\n`);
    console.log('Recent tickets:');
    searchResponse.data.issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue.key}: ${issue.fields.summary}`);
      console.log(`      Status: ${issue.fields.status.name}`);
      console.log(`      Assignee: ${issue.fields.assignee?.displayName || 'Unassigned'}\n`);
    });

    if (searchResponse.data.issues.length > 0) {
      const testTicket = searchResponse.data.issues[0].key;
      console.log(`3️⃣ Testing ticket details fetch for ${testTicket}...`);
      const ticketResponse = await axios.get(`${baseUrl}/rest/api/2/issue/${testTicket}`, {
        auth,
        headers: { 'Accept': 'application/json' },
      });
      console.log(`✅ Successfully fetched ${testTicket}`);
      console.log(`   Summary: ${ticketResponse.data.fields.summary}`);
      console.log(`   Description: ${ticketResponse.data.fields.description ? ticketResponse.data.fields.description.substring(0, 100) + '...' : 'No description'}`);
      console.log(`   Attachments: ${ticketResponse.data.fields.attachment?.length || 0}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Status Text: ${error.response.statusText}`);
      if (error.response.data) {
        console.error(`   Response:`, JSON.stringify(error.response.data, null, 2));
      }
    }
  }
}

testConnection();
