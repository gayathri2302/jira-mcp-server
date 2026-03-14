# Jira MCP Server - Usage Guide

## Quick Start Example

Once you have the MCP server configured with Claude Desktop, you can interact with Jira tickets naturally. Here's how to use it for development:

### Example: Analyzing Ticket XXXX-12345

**Step 1: Get Ticket Details**
```
Get all details for ticket XXXX-12345
```

The MCP server will fetch:
- Complete ticket description
- All attachments
- Figma design links (automatically extracted)
- Test case files (automatically identified)
- Comments and additional context

**Step 2: Analyze for Development**
```
Analyze XXXX-12345 for development
```

This provides:
- Requirements summary
- Technical resources breakdown
- Development checklist
- Testing strategy
- Links to Figma designs and test cases

**Step 3: Access Specific Resources**

Download test cases:
```
Download the test case attachment from XXXX-12345
```

View Figma designs:
```
Show me the Figma links for XXXX-12345
```

Get additional context:
```
Show me all comments on XXXX-12345
```

## Workflow for Development

### 1. Understand Requirements
```
Analyze ticket XXXX-12345 for development
```

### 2. Review Design
The MCP server automatically extracts Figma links. You can then:
- Open the Figma designs in your browser
- Ask Claude to help interpret the designs
- Discuss implementation approach

### 3. Review Test Cases
```
Download the test case files from XXXX-12345
```

Claude can help you:
- Parse test case files
- Create automated tests based on test cases
- Ensure all scenarios are covered

### 4. Implement Code
With all context available, you can ask Claude to:
```
Based on ticket XXXX-12345, implement the feature following the Figma design and test cases
```

### 5. Write Tests
```
Write comprehensive tests for XXXX-12345 based on the test case file
```

## Advanced Usage

### Multi-Ticket Analysis
```
Compare requirements for XXXX-12345 and XXXX-12345
```

### Dependency Checking
```
Get details for XXXX-12345 and check if there are any related tickets mentioned
```

### Documentation Generation
```
Generate technical documentation for the implementation of XXXX-12345
```

## Common Commands

| Command | Description |
|---------|-------------|
| `Get details for ticket [ID]` | Fetch complete ticket information |
| `Analyze [ID] for development` | Get structured development guidance |
| `Show Figma designs for [ID]` | List all Figma links |
| `Download test cases from [ID]` | Get test case files |
| `Show comments on [ID]` | View all ticket comments |
| `What attachments are on [ID]?` | List all attachments |

## Integration with Development Workflow

### With VS Code/Windsurf
1. Open your project
2. Ask Claude to analyze the ticket
3. Claude can directly edit files based on requirements
4. Review Figma designs alongside code
5. Implement tests based on test cases

### With Git Workflow
```
1. Analyze ticket XXXX-12345
2. Create a feature branch for XXXX-12345
3. Implement the feature based on the analysis
4. Write tests according to test cases
5. Commit with reference to XXXX-12345
```

## Tips for Best Results

1. **Be Specific**: Use exact ticket IDs (e.g., XXXX-12345)
2. **Start with Analysis**: Always analyze before implementing
3. **Review Resources**: Check Figma and test cases before coding
4. **Iterative Approach**: Break large tickets into smaller tasks
5. **Use Comments**: Ticket comments often have important clarifications

## Troubleshooting

### Ticket Not Found
- Verify the ticket ID is correct
- Ensure you have permission to view the ticket
- Check that the ticket exists in your Jira instance

### Missing Figma Links
- Figma links must be in the description or comments
- Links should be in format: `https://figma.com/file/...`
- Check attachments for Figma-related files

### Test Cases Not Detected
The server looks for files with:
- "test" or "testcase" in filename
- Extensions: .xlsx, .xls, .csv, .txt, .md
- Ensure test cases are attached to the ticket

## Example Session

```
You: Get details for XXXX-12345

Claude: [Fetches ticket details including description, attachments, Figma links, test cases]

You: Based on this ticket, what should I implement?

Claude: [Provides analysis with requirements, technical approach, and resources]

You: Show me the Figma design

Claude: [Lists Figma links extracted from the ticket]

You: Implement the feature according to the design and test cases

Claude: [Implements code based on all available context]

You: Write tests for this implementation

Claude: [Creates tests based on test case files and requirements]
```

## Security Best Practices

- Never share your `.env` file
- Keep API tokens secure
- Don't commit credentials to git
- Regularly rotate API tokens
- Use read-only tokens when possible

## Next Steps

After setting up the MCP server:
1. Test with a known ticket ID
2. Verify Figma links are extracted correctly
3. Check test case detection
4. Integrate into your development workflow
5. Customize the analysis format if needed

For issues or questions, refer to the main README.md or create an issue on GitHub.
