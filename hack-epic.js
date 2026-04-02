import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runEpicSync() {
  console.log('🚀 Starting Epic Status Transition\n');

  const serverProcess = spawn('node', ['--loader', 'ts-node/esm', path.join(__dirname, 'src', 'index.ts')], {
    cwd: __dirname,
    env: process.env,
  });

  const transport = new StdioClientTransport({
    command: 'node',
    args: ['--loader', 'ts-node/esm', path.join(__dirname, 'src', 'index.ts')],
    env: process.env,
  });

  const client = new Client(
    {
      name: 'jira-demo-client',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

  await client.connect(transport);
  console.log('✅ Connected to MCP server');

  try {
    console.log('📥 Calling assign_epic_issues_by_status for NGSB-10316...\n');
    const result = await client.callTool({
      // name: 'transition_tickets',
      name: 'assign_epic_issues_by_status',
      // name: 'transition_epic_issues',
      arguments: {
        // epic_id: 'NGSB-10318',
        // ticket_ids: ['XXXX-10368'],
        // target_status: 'CR Pass',
        epic_key: 'XXXX-10318',
        // ticket_ids: ['NGSB-10368'],
        target_status: "Ready For Deployment"
      },
    });

    console.log('✅ Transition Result:\n');
    console.log(result.content[0].text);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }

  await client.close();
  serverProcess.kill();
  console.log('\n✅ Script completed!');
  process.exit(0);
}

runEpicSync().catch(console.error);
