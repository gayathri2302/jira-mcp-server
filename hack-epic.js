import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runEpicSync() {
  console.log('🚀 Starting Epic Status Transition\n');

  const serverProcess = spawn('node', [path.join(__dirname, 'dist', 'index.js')], {
    cwd: __dirname,
    env: process.env,
  });

  const transport = new StdioClientTransport({
    command: 'node',
    args: [path.join(__dirname, 'dist', 'index.js')],
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
    console.log('📥 Calling transition_epic_issues for XXXX-10316...\n');
    const result = await client.callTool({
      name: 'transition_tickets',
      // name: 'transition_epic_issues',
      arguments: {
        // epic_id: 'XXXX-10316',
        ticket_ids: ['XXXX-10368'],
        target_status: 'CR Pass'
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
