import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

async function runDemo() {
  console.log('🚀 Starting Jira MCP Server Demo\n');

  const serverProcess = spawn('node', ['dist/index.js'], {
    cwd: process.cwd(),
    env: process.env,
  });

  const transport = new StdioClientTransport({
    command: 'node',
    args: ['dist/index.js'],
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
  console.log('✅ Connected to MCP server\n');

  console.log('📋 Listing available tools...\n');
  const toolsResult = await client.listTools();
  console.log('Available tools:');
  toolsResult.tools.forEach((tool, index) => {
    console.log(`  ${index + 1}. ${tool.name} - ${tool.description}`);
  });
  console.log('\n');

  console.log('🎫 Testing with ticket NGSB-10435...\n');

  try {
    console.log('📥 Fetching ticket details...\n');
    const result = await client.callTool({
      name: 'get_ticket_details',
      arguments: {
        ticket_id: 'NGSB-10435',
      },
    });

    console.log('✅ Ticket Details Retrieved:\n');
    console.log(result.content[0].text);
    console.log('\n' + '='.repeat(80) + '\n');

    console.log('🔍 Analyzing ticket for development...\n');
    const analysisResult = await client.callTool({
      name: 'analyze_ticket_for_development',
      arguments: {
        ticket_id: 'XXXXX-10435',
      },
    });

    console.log('✅ Development Analysis:\n');
    console.log(analysisResult.content[0].text);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }

  await client.close();
  serverProcess.kill();
  console.log('\n✅ Demo completed!');
  process.exit(0);
}

runDemo().catch(console.error);
