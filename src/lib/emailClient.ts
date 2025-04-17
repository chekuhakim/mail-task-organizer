
/**
 * This is a mock implementation of the email client module.
 * In a real implementation, this would connect to an email server via IMAP/POP3.
 */

import { Email, EmailSettings } from "@/types";
import { mockEmails } from "./mockData";

export interface FetchEmailsResult {
  success: boolean;
  emails: Email[];
  error?: string;
}

/**
 * Mocks connecting to an email server and fetching emails.
 * In a real implementation, this would use IMAP/POP3 libraries
 * to actually connect to an email server.
 */
export async function fetchEmails(settings: EmailSettings): Promise<FetchEmailsResult> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Mock successful connection
  if (settings.server && settings.username && settings.password) {
    return {
      success: true,
      emails: mockEmails,
    };
  } 
  
  // Mock connection failure
  return {
    success: false,
    emails: [],
    error: "Failed to connect to email server. Please check your credentials.",
  };
}

/**
 * Mocks testing email server connection.
 * In a real implementation, this would attempt to establish a connection
 * to the email server using the provided credentials.
 */
export async function testEmailConnection(settings: EmailSettings): Promise<{
  success: boolean;
  message: string;
}> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Mock successful connection if credentials are provided
  if (settings.server && settings.port && settings.username && settings.password) {
    return {
      success: true,
      message: `Successfully connected to ${settings.server} using ${settings.protocol.toUpperCase()}.`,
    };
  }
  
  // Mock connection failure
  return {
    success: false,
    message: "Failed to connect to email server. Please check your credentials.",
  };
}

/**
 * Mocks marking an email as read on the server.
 * In a real implementation, this would use IMAP to update the email flags.
 */
export async function markEmailAsRead(emailId: string, settings: EmailSettings): Promise<boolean> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock success (always returns true in mock)
  return true;
}
