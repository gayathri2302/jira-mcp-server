#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { JiraClient } from './jira-client.js';
import { JiraConfig, JiraTicketDetails } from './types.js';

dotenv.config();

const config: JiraConfig = {
  baseUrl: process.env.JIRA_BASE_URL || `https://${process.env.JIRA_HOST}` || '',
  email: process.env.JIRA_EMAIL,
  apiToken: process.env.JIRA_API_TOKEN,
  username: process.env.JIRA_USERNAME,
  password: process.env.JIRA_PASSWORD,
  projectKey: process.env.JIRA_PROJECT_KEY,
  targetUser: process.env.JIRA_TARGET_USER,
};

const hasCloudAuth = config.baseUrl && config.email && config.apiToken;
const hasServerAuth = config.baseUrl && config.username && config.password;

if (!hasCloudAuth && !hasServerAuth) {
  console.error('Error: Missing required environment variables. Please check your .env file.');
  console.error('Required: Either (JIRA_BASE_URL/JIRA_HOST + JIRA_EMAIL + JIRA_API_TOKEN) or (JIRA_BASE_URL/JIRA_HOST + JIRA_USERNAME + JIRA_PASSWORD)');
  process.exit(1);
}

const jiraClient = new JiraClient(config);

const server = new Server(
  {
    name: 'jira-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const tools: Tool[] = [
  {
    name: 'get_ticket_details',
    description: 'Fetch comprehensive details of a Jira ticket including description, attachments, Figma links, and test cases. Use this to get all information needed to understand and implement a ticket.',
    inputSchema: {
      type: 'object',
      properties: {
        ticket_id: {
          type: 'string',
          description: 'The Jira ticket ID (e.g., XXXXX-12345)',
        },
      },
      required: ['ticket_id'],
    },
  },
  {
    name: 'analyze_ticket_for_development',
    description: 'Analyze a Jira ticket and provide a structured breakdown for development including requirements summary, technical approach, testing strategy, and extracted resources (Figma designs, test cases).',
    inputSchema: {
      type: 'object',
      properties: {
        ticket_id: {
          type: 'string',
          description: 'The Jira ticket ID to analyze',
        },
      },
      required: ['ticket_id'],
    },
  },
  {
    name: 'download_attachment',
    description: 'Download the content of a specific attachment from a Jira ticket.',
    inputSchema: {
      type: 'object',
      properties: {
        attachment_url: {
          type: 'string',
          description: 'The URL of the attachment to download',
        },
      },
      required: ['attachment_url'],
    },
  },
  {
    name: 'get_ticket_comments',
    description: 'Retrieve all comments from a Jira ticket for additional context.',
    inputSchema: {
      type: 'object',
      properties: {
        ticket_id: {
          type: 'string',
          description: 'The Jira ticket ID',
        },
      },
      required: ['ticket_id'],
    },
  },
  {
    name: 'transition_epic_issues',
    description: 'Move ALL tickets under an epic to a target status. Provide the epic key and the desired status name. Each ticket will be transitioned individually and results reported.',
    inputSchema: {
      type: 'object',
      properties: {
        epic_key: {
          type: 'string',
          description: 'The epic ticket key (e.g., XXXX-1234)',
        },
        target_status: {
          type: 'string',
          description: 'The target status to move all tickets to (e.g., "In Progress", "Done", "To Do", "QA Ready")',
        },
      },
      required: ['epic_key', 'target_status'],
    },
  },
  {
    name: 'transition_tickets',
    description: 'Move one or more specific tickets to a target status. Provide an array of ticket keys and the desired status name.',
    inputSchema: {
      type: 'object',
      properties: {
        ticket_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of ticket keys to transition (e.g., ["XXXX-101", "XXXX-102"])',
        },
        target_status: {
          type: 'string',
          description: 'The target status to move tickets to (e.g., "In Progress", "Done", "To Do", "QA Ready")',
        },
      },
      required: ['ticket_ids', 'target_status'],
    },
  },
  {
    name: 'assign_epic_issues_by_status',
    description: 'Assign all tickets under an epic to the target user specified in environment variables, filtered by ticket status.',
    inputSchema: {
      type: 'object',
      properties: {
        epic_key: {
          type: 'string',
          description: 'The epic ticket key (e.g., NGSB-1234)',
        },
        target_status: {
          type: 'string',
          description: 'The status filter to apply (e.g., "Ready for Deployment")',
        },
      },
      required: ['epic_key', 'target_status'],
    },
  },
  {
    name: 'assign_tickets',
    description: 'Assign specific tickets to the target user specified in environment variables.',
    inputSchema: {
      type: 'object',
      properties: {
        ticket_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of ticket keys (e.g., ["NGSB-101"])',
        },
      },
      required: ['ticket_ids'],
    },
  },
  {
    name: 'get_available_transitions',
    description: 'Get the list of available status transitions for a ticket. Useful to see what statuses a ticket can be moved to.',
    inputSchema: {
      type: 'object',
      properties: {
        ticket_id: {
          type: 'string',
          description: 'The Jira ticket ID (e.g., NGSB-1234)',
        },
      },
      required: ['ticket_id'],
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    throw new Error('Missing arguments');
  }

  try {
    switch (name) {
      case 'get_ticket_details': {
        const ticketId = args.ticket_id as string;
        const details = await jiraClient.getTicketDetails(ticketId);

        return {
          content: [
            {
              type: 'text',
              text: formatTicketDetails(details),
            },
          ],
        };
      }

      case 'analyze_ticket_for_development': {
        const ticketId = args.ticket_id as string;
        const details = await jiraClient.getTicketDetails(ticketId);
        const analysis = analyzeTicket(details);

        return {
          content: [
            {
              type: 'text',
              text: analysis,
            },
          ],
        };
      }

      case 'download_attachment': {
        const attachmentUrl = args.attachment_url as string;
        const content = await jiraClient.downloadAttachment(attachmentUrl);

        return {
          content: [
            {
              type: 'text',
              text: content,
            },
          ],
        };
      }

      case 'get_ticket_comments': {
        const ticketId = args.ticket_id as string;
        const comments = await jiraClient.getComments(ticketId);

        return {
          content: [
            {
              type: 'text',
              text: comments.length > 0
                ? comments.join('\n\n---\n\n')
                : 'No comments found for this ticket.',
            },
          ],
        };
      }

      case 'transition_epic_issues': {
        const epicKey = args.epic_key as string;
        const targetStatus = args.target_status as string;
        const result = await jiraClient.transitionEpicIssues(epicKey, targetStatus);

        const succeeded = result.results.filter((r) => r.success).length;
        const failed = result.results.filter((r) => !r.success).length;

        let output = `# Epic Status Transition: ${epicKey}\n\n`;
        output += `**Target Status:** ${targetStatus}\n`;
        output += `**Total Issues:** ${result.totalIssues}\n`;
        output += `**Succeeded:** ${succeeded}\n`;
        output += `**Failed:** ${failed}\n\n`;

        if (result.totalIssues === 0) {
          output += `No issues found under epic ${epicKey}.\n`;
        } else {
          output += `## Results\n\n`;
          for (const r of result.results) {
            const icon = r.success ? '✅' : '❌';
            output += `${icon} **${r.ticketId}**: ${r.previousStatus} → ${r.newStatus}`;
            if (r.error) output += ` (${r.error})`;
            output += '\n';
          }
        }

        return { content: [{ type: 'text', text: output }] };
      }

      case 'transition_tickets': {
        const ticketIds = args.ticket_ids as string[];
        const targetStatus = args.target_status as string;
        const result = await jiraClient.transitionMultipleIssues(ticketIds, targetStatus);

        const succeeded = result.results.filter((r) => r.success).length;
        const failed = result.results.filter((r) => !r.success).length;

        let output = `# Bulk Ticket Status Transition\n\n`;
        output += `**Target Status:** ${targetStatus}\n`;
        output += `**Total Tickets:** ${result.totalIssues}\n`;
        output += `**Succeeded:** ${succeeded}\n`;
        output += `**Failed:** ${failed}\n\n`;

        output += `## Results\n\n`;
        for (const r of result.results) {
          const icon = r.success ? '✅' : '❌';
          output += `${icon} **${r.ticketId}**: ${r.previousStatus} → ${r.newStatus}`;
          if (r.error) output += ` (${r.error})`;
          output += '\n';
        }

        return { content: [{ type: 'text', text: output }] };
      }

      case 'assign_epic_issues_by_status': {
        const epicKey = args.epic_key as string;
        const targetStatus = args.target_status as string;
        if (!config.targetUser) throw new Error("JIRA_TARGET_USER is not defined in environment variables");

        const result = await jiraClient.assignEpicIssuesByStatus(epicKey, targetStatus, config.targetUser);

        let output = `# Epic Status Assignment: ${epicKey}\n\n`;
        output += `**Filtered Status:** ${targetStatus}\n`;
        output += `**Target Assignee:** ${config.targetUser}\n`;
        output += `**Total Issues Segmented:** ${result.totalIssues}\n`;
        const succeeded = result.results.filter((r: any) => r.success).length;
        const failed = result.results.filter((r: any) => !r.success).length;
        output += `**Succeeded:** ${succeeded}\n**Failed:** ${failed}\n\n`;

        if (result.results.length > 0) {
          output += `## Results\n\n`;
          for (const r of result.results) {
            const icon = r.success ? '✅' : '❌';
            output += `${icon} **${r.ticketId}**: Assigned to ${r.newAssignee}`;
            if (r.error) output += ` (${r.error})`;
            output += '\n';
          }
        }
        return { content: [{ type: 'text', text: output }] };
      }

      case 'assign_tickets': {
        const ticketIds = args.ticket_ids as string[];
        if (!config.targetUser) throw new Error("JIRA_TARGET_USER is not defined in environment variables");

        const result = await jiraClient.assignMultipleIssues(ticketIds, config.targetUser);

        let output = `# Bulk Ticket Assignment\n\n`;
        output += `**Target Assignee:** ${config.targetUser}\n`;
        output += `**Total Tickets:** ${result.totalIssues}\n`;
        const succeeded = result.results.filter((r: any) => r.success).length;
        const failed = result.results.filter((r: any) => !r.success).length;
        output += `**Succeeded:** ${succeeded}\n**Failed:** ${failed}\n\n`;

        output += `## Results\n\n`;
        for (const r of result.results) {
          const icon = r.success ? '✅' : '❌';
          output += `${icon} **${r.ticketId}**: Assigned to ${r.newAssignee}`;
          if (r.error) output += ` (${r.error})`;
          output += '\n';
        }
        return { content: [{ type: 'text', text: output }] };
      }

      case 'get_available_transitions': {
        const ticketId = args.ticket_id as string;
        const transitions = await jiraClient.getTransitions(ticketId);

        let output = `# Available Transitions for ${ticketId}\n\n`;
        if (transitions.length === 0) {
          output += 'No transitions available for this ticket.\n';
        } else {
          for (const t of transitions) {
            output += `- **${t.name}** (ID: ${t.id})\n`;
          }
        }

        return { content: [{ type: 'text', text: output }] };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

function formatTicketDetails(details: JiraTicketDetails): string {
  let output = `# ${details.key}: ${details.summary}\n\n`;
  output += `**Type:** ${details.issueType}\n`;
  output += `**Status:** ${details.status}\n`;
  output += `**Priority:** ${details.priority}\n`;
  output += `**Assignee:** ${details.assignee || 'Unassigned'}\n`;
  output += `**Reporter:** ${details.reporter}\n`;
  output += `**Created:** ${new Date(details.created).toLocaleString()}\n`;
  output += `**Updated:** ${new Date(details.updated).toLocaleString()}\n\n`;

  if (details.labels.length > 0) {
    output += `**Labels:** ${details.labels.join(', ')}\n`;
  }

  if (details.components.length > 0) {
    output += `**Components:** ${details.components.join(', ')}\n`;
  }

  output += `\n## Description\n\n${details.description || 'No description provided.'}\n\n`;

  if (details.figmaLinks.length > 0) {
    output += `## Figma Designs\n\n`;
    details.figmaLinks.forEach((link, index) => {
      output += `${index + 1}. ${link}\n`;
    });
    output += '\n';
  }

  if (details.testCases.length > 0) {
    output += `## Test Case Files\n\n`;
    details.testCases.forEach((url, index) => {
      output += `${index + 1}. ${url}\n`;
    });
    output += '\n';
  }

  if (details.attachments.length > 0) {
    output += `## Attachments (${details.attachments.length})\n\n`;
    details.attachments.forEach((att, index) => {
      output += `${index + 1}. **${att.filename}** (${formatBytes(att.size)})\n`;
      output += `   - Type: ${att.mimeType}\n`;
      output += `   - URL: ${att.content}\n`;
    });
  }

  return output;
}

function analyzeTicket(details: JiraTicketDetails): string {
  let analysis = `# Development Analysis: ${details.key}\n\n`;

  analysis += `## Requirements Summary\n\n`;
  analysis += `**Ticket:** ${details.key} - ${details.summary}\n`;
  analysis += `**Type:** ${details.issueType}\n`;
  analysis += `**Priority:** ${details.priority}\n\n`;
  analysis += `${details.description || 'No description provided.'}\n\n`;

  analysis += `## Technical Resources\n\n`;

  if (details.figmaLinks.length > 0) {
    analysis += `### Design Resources (Figma)\n`;
    analysis += `Found ${details.figmaLinks.length} Figma design(s):\n\n`;
    details.figmaLinks.forEach((link, index) => {
      analysis += `${index + 1}. ${link}\n`;
    });
    analysis += `\n**Action:** Review Figma designs to understand UI/UX requirements before implementation.\n\n`;
  } else {
    analysis += `### Design Resources\nNo Figma designs found in ticket.\n\n`;
  }

  if (details.testCases.length > 0) {
    analysis += `### Test Cases\n`;
    analysis += `Found ${details.testCases.length} test case file(s):\n\n`;
    details.testCases.forEach((url, index) => {
      analysis += `${index + 1}. ${url}\n`;
    });
    analysis += `\n**Action:** Download and review test cases to understand acceptance criteria.\n\n`;
  } else {
    analysis += `### Test Cases\nNo test case files found. You may need to create test cases based on requirements.\n\n`;
  }

  if (details.attachments.length > 0) {
    analysis += `### Other Attachments (${details.attachments.length})\n`;
    details.attachments
      .filter(att =>
        !details.testCases.includes(att.content) &&
        !att.filename.toLowerCase().includes('figma')
      )
      .forEach((att, index) => {
        analysis += `${index + 1}. ${att.filename} (${att.mimeType})\n`;
      });
    analysis += '\n';
  }

  analysis += `## Development Checklist\n\n`;
  analysis += `- [ ] Review ticket description and requirements\n`;
  if (details.figmaLinks.length > 0) {
    analysis += `- [ ] Analyze Figma designs for UI/UX implementation\n`;
  }
  if (details.testCases.length > 0) {
    analysis += `- [ ] Review test cases and acceptance criteria\n`;
  }
  analysis += `- [ ] Design technical solution\n`;
  analysis += `- [ ] Implement code changes\n`;
  analysis += `- [ ] Write unit tests\n`;
  analysis += `- [ ] Write integration tests (if applicable)\n`;
  analysis += `- [ ] Manual testing against requirements\n`;
  analysis += `- [ ] Code review\n`;
  analysis += `- [ ] Update documentation\n\n`;

  analysis += `## Testing Strategy\n\n`;
  if (details.testCases.length > 0) {
    analysis += `Based on the provided test cases, ensure all scenarios are covered.\n`;
  } else {
    analysis += `Create comprehensive test cases covering:\n`;
    analysis += `- Happy path scenarios\n`;
    analysis += `- Edge cases\n`;
    analysis += `- Error handling\n`;
    analysis += `- Validation logic\n`;
  }

  return analysis;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Jira MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
