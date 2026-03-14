import axios, { AxiosInstance } from 'axios';
import { JiraConfig, JiraTicketDetails, JiraAttachment } from './types.js';

export class JiraClient {
  private client: AxiosInstance;
  private config: JiraConfig;

  constructor(config: JiraConfig) {
    this.config = config;

    const auth = config.username && config.password
      ? { username: config.username, password: config.password }
      : { username: config.email!, password: config.apiToken! };

    this.client = axios.create({
      baseURL: config.baseUrl,
      auth,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
  }

  async getTicketDetails(ticketId: string): Promise<JiraTicketDetails> {
    try {
      const response = await this.client.get(`/rest/api/2/issue/${ticketId}`);
      const issue = response.data;

      const attachments = await this.getAttachments(issue);
      const figmaLinks = this.extractFigmaLinks(issue, attachments);
      const testCases = this.extractTestCases(attachments);

      return {
        key: issue.key,
        summary: issue.fields.summary || '',
        description: issue.fields.description ? this.parseDescription(issue.fields.description) : '',
        status: issue.fields.status?.name || 'Unknown',
        priority: issue.fields.priority?.name || 'None',
        assignee: issue.fields.assignee?.displayName || null,
        reporter: issue.fields.reporter?.displayName || 'Unknown',
        created: issue.fields.created,
        updated: issue.fields.updated,
        attachments,
        figmaLinks,
        testCases,
        labels: issue.fields.labels || [],
        components: issue.fields.components?.map((c: any) => c.name) || [],
        issueType: issue.fields.issuetype?.name || 'Unknown',
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch ticket ${ticketId}: ${error.message}`);
    }
  }

  private async getAttachments(issue: any): Promise<JiraAttachment[]> {
    const attachments: JiraAttachment[] = [];

    if (!issue.fields.attachment || issue.fields.attachment.length === 0) {
      return attachments;
    }

    for (const att of issue.fields.attachment) {
      attachments.push({
        id: att.id,
        filename: att.filename,
        mimeType: att.mimeType,
        size: att.size,
        content: att.content,
        created: att.created,
      });
    }

    return attachments;
  }

  async downloadAttachment(contentUrl: string): Promise<string> {
    try {
      const response = await this.client.get(contentUrl, {
        responseType: 'text',
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to download attachment: ${error.message}`);
    }
  }

  private extractFigmaLinks(issue: any, attachments: JiraAttachment[]): string[] {
    const figmaLinks: string[] = [];
    const figmaRegex = /https?:\/\/(www\.)?figma\.com\/(file|proto|design)\/[^\s)]+/gi;

    const description = issue.fields.description ? this.parseDescription(issue.fields.description) : '';
    const descriptionMatches = description.match(figmaRegex) || [];
    figmaLinks.push(...descriptionMatches);

    if (issue.fields.comment?.comments) {
      for (const comment of issue.fields.comment.comments) {
        const commentText = this.parseDescription(comment.body);
        const commentMatches = commentText.match(figmaRegex) || [];
        figmaLinks.push(...commentMatches);
      }
    }

    for (const att of attachments) {
      if (att.filename.toLowerCase().includes('figma') || att.mimeType.includes('figma')) {
        figmaLinks.push(att.content);
      }
    }

    return [...new Set(figmaLinks)];
  }

  private extractTestCases(attachments: JiraAttachment[]): string[] {
    const testCaseFiles: string[] = [];

    for (const att of attachments) {
      const filename = att.filename.toLowerCase();
      if (
        filename.includes('test') ||
        filename.includes('testcase') ||
        filename.endsWith('.xlsx') ||
        filename.endsWith('.xls') ||
        filename.endsWith('.csv') ||
        filename.endsWith('.txt') ||
        filename.endsWith('.md')
      ) {
        testCaseFiles.push(att.content);
      }
    }

    return testCaseFiles;
  }

  private parseDescription(description: any): string {
    if (typeof description === 'string') {
      return description;
    }

    if (description && description.type === 'doc' && description.content) {
      return this.parseADF(description);
    }

    return JSON.stringify(description);
  }

  private parseADF(adf: any): string {
    if (!adf || !adf.content) {
      return '';
    }

    let text = '';

    for (const node of adf.content) {
      if (node.type === 'paragraph' && node.content) {
        for (const contentNode of node.content) {
          if (contentNode.type === 'text') {
            text += contentNode.text;
          } else if (contentNode.type === 'hardBreak') {
            text += '\n';
          }
        }
        text += '\n';
      } else if (node.type === 'heading' && node.content) {
        text += '\n';
        for (const contentNode of node.content) {
          if (contentNode.type === 'text') {
            text += contentNode.text;
          }
        }
        text += '\n';
      } else if (node.type === 'bulletList' && node.content) {
        for (const listItem of node.content) {
          if (listItem.content) {
            text += '• ';
            text += this.parseADF(listItem);
          }
        }
      } else if (node.type === 'orderedList' && node.content) {
        let index = 1;
        for (const listItem of node.content) {
          if (listItem.content) {
            text += `${index}. `;
            text += this.parseADF(listItem);
            index++;
          }
        }
      } else if (node.type === 'codeBlock' && node.content) {
        text += '\n```\n';
        for (const contentNode of node.content) {
          if (contentNode.type === 'text') {
            text += contentNode.text;
          }
        }
        text += '\n```\n';
      }
    }

    return text;
  }

  async getComments(ticketId: string): Promise<string[]> {
    try {
      const response = await this.client.get(`/rest/api/2/issue/${ticketId}/comment`);
      const comments = response.data.comments || [];

      return comments.map((comment: any) => {
        const author = comment.author?.displayName || 'Unknown';
        const body = this.parseDescription(comment.body);
        const created = new Date(comment.created).toLocaleString();
        return `[${created}] ${author}: ${body}`;
      });
    } catch (error: any) {
      throw new Error(`Failed to fetch comments for ${ticketId}: ${error.message}`);
    }
  }
}
