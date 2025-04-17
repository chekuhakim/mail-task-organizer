
/**
 * This is a mock implementation of the Gemini AI processing module.
 * In a real implementation, this would connect to the Google Gemini API.
 */

import { Email, Task } from "@/types";

export interface EmailProcessingResult {
  summary: string;
  tasks: Pick<Task, 'description' | 'priority'>[];
}

/**
 * Mocks processing an email with Gemini AI.
 * In a real implementation, this would send the email content to Gemini API 
 * and receive back a summary and extracted tasks.
 */
export async function processEmailWithAI(email: {
  subject: string;
  body: string;
  sender: { name: string; email: string };
}): Promise<EmailProcessingResult> {
  // This is a mock function that simulates the delay of an API call
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Generate a fake summary based on the subject
  const summary = `This is an AI-generated summary of an email about "${email.subject}". 
    The email contains important information from ${email.sender.name} that would 
    normally be processed by Gemini AI to extract key details and action items.`;
  
  // Generate fake tasks based on the subject
  const tasks: EmailProcessingResult['tasks'] = [
    {
      description: `Review information about "${email.subject}"`,
      priority: 'medium',
    },
    {
      description: `Follow up with ${email.sender.name} about next steps`,
      priority: 'high',
    }
  ];
  
  return { summary, tasks };
}

export const promptTemplate = `
Please analyze the following email and:
1. Generate a concise summary (max 2 sentences)
2. Extract any actionable tasks or requests
3. Assign a priority to each task (low, medium, high) based on urgency

EMAIL DETAILS:
Subject: {{subject}}
From: {{sender}}
Date: {{date}}

CONTENT:
{{body}}

RESPONSE FORMAT:
{
  "summary": "Brief summary of the email",
  "tasks": [
    {
      "description": "Task description",
      "priority": "low|medium|high"
    }
  ]
}
`;
