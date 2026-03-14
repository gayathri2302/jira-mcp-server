export interface JiraConfig {
  baseUrl: string;
  email?: string;
  apiToken?: string;
  username?: string;
  password?: string;
  projectKey?: string;
}

export interface JiraAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  content: string;
  created: string;
}

export interface JiraTicketDetails {
  key: string;
  summary: string;
  description: string;
  status: string;
  priority: string;
  assignee: string | null;
  reporter: string;
  created: string;
  updated: string;
  attachments: JiraAttachment[];
  figmaLinks: string[];
  testCases: string[];
  labels: string[];
  components: string[];
  issueType: string;
}

export interface AnalyzedTicket extends JiraTicketDetails {
  analysis: {
    requirementsSummary: string;
    technicalApproach: string;
    testingStrategy: string;
    figmaDesigns: string[];
    extractedTestCases: string[];
  };
}
