# Jira MCP Server

A Model Context Protocol (MCP) server that integrates with Jira to fetch comprehensive ticket details, including descriptions, attachments, Figma designs, and test cases. This server enables AI assistants to automatically analyze Jira tickets and assist with development tasks.

## Features

- **Complete Ticket Details**: Fetch all ticket information including summary, description, status, priority, assignee, and more
- **Attachment Handling**: Automatically extract and categorize attachments
- **Figma Integration**: Detect and extract Figma design links from ticket descriptions and comments
- **Test Case Extraction**: Identify and extract test case files from attachments
- **Development Analysis**: Analyze tickets and provide structured development guidance
- **Comment Retrieval**: Access all ticket comments for additional context

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd jira-mcp-server
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and add your Jira credentials:
```env
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-api-token-here
JIRA_PROJECT_KEY=NGSB  # Optional: default project key
```

### Getting Your Jira API Token

1. Log in to your Atlassian account
2. Go to https://id.atlassian.com/manage-profile/security/api-tokens
3. Click "Create API token"
4. Give it a label (e.g., "MCP Server")
5. Copy the token and add it to your `.env` file

## Usage with Claude Desktop

Add this server to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "jira": {
      "command": "node",
      "args": ["/absolute/path/to/jira-mcp-server/dist/index.js"],
      "env": {
        "JIRA_BASE_URL": "https://your-domain.atlassian.net",
        "JIRA_EMAIL": "your-email@example.com",
        "JIRA_API_TOKEN": "your-api-token-here"
      }
    }
  }
}
```

## Available Tools

### 1. `get_ticket_details`
Fetch comprehensive details of a Jira ticket.

**Parameters:**
- `ticket_id` (string): The Jira ticket ID (e.g., "NGSB-10435")

**Returns:** Complete ticket information including description, attachments, Figma links, and test cases.

### 2. `analyze_ticket_for_development`
Analyze a ticket and provide structured development guidance.

**Parameters:**
- `ticket_id` (string): The Jira ticket ID

**Returns:** Development analysis with requirements summary, technical resources, checklist, and testing strategy.

### 3. `download_attachment`
Download the content of a specific attachment.

**Parameters:**
- `attachment_url` (string): The URL of the attachment

**Returns:** The attachment content as text.

### 4. `get_ticket_comments`
Retrieve all comments from a ticket.

**Parameters:**
- `ticket_id` (string): The Jira ticket ID

**Returns:** All comments with author and timestamp information.

## Example Usage

Once configured with Claude Desktop, you can use natural language commands like:

- "Get details for ticket NGSB-10435"
- "Analyze NGSB-10435 for development"
- "Show me the test cases for NGSB-10435"
- "What are the Figma designs for this ticket?"

The MCP server will automatically:
1. Fetch the ticket details from Jira
2. Extract Figma links from description and comments
3. Identify test case files from attachments
4. Provide structured analysis for development

## Development

### Build
```bash
npm run build
```

### Watch mode (for development)
```bash
npm run watch
```

### Run in development mode
```bash
npm run dev
```

## Security Notes

- **Never commit your `.env` file** - it contains sensitive credentials
- The `.env` file is already included in `.gitignore`
- Use environment variables or secure secret management in production
- API tokens should be treated as passwords

## Troubleshooting

### "Missing required environment variables" error
Make sure your `.env` file exists and contains all required variables:
- `JIRA_BASE_URL`
- `JIRA_EMAIL`
- `JIRA_API_TOKEN`

### "Failed to fetch ticket" error
- Verify your Jira credentials are correct
- Ensure the ticket ID exists and you have permission to view it
- Check that your Jira base URL is correct (should end with `.atlassian.net`)

### Connection issues
- Verify your internet connection
- Check if your organization uses a proxy or VPN
- Ensure your API token hasn't expired

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
