import { JiraClient } from './src/jira-client.js';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  baseUrl: process.env.JIRA_BASE_URL || `https://${process.env.JIRA_HOST}` || '',
  email: process.env.JIRA_EMAIL,
  apiToken: process.env.JIRA_API_TOKEN,
  username: process.env.JIRA_USERNAME,
  password: process.env.JIRA_PASSWORD,
  targetUser: process.env.JIRA_TARGET_USER,
  projectKey: process.env.JIRA_PROJECT_KEY,
};

const client = new JiraClient(config);

async function check() {
  const issues = await client.getEpicIssues('NGSB-10316');
  console.log(`Found ${issues.length} issues under epic NGSB-10316:`);
  issues.forEach(issue => {
    console.log(`- ${issue.key}: Status: "${issue.status}"`);
  });
}

check().catch(console.error);
