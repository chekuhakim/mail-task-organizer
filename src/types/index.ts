
// Email types
export type EmailSender = {
  name: string;
  email: string;
  avatar?: string;
};

export type Email = {
  id: string;
  subject: string;
  sender: EmailSender;
  receivedAt: string;
  summary: string;
  body?: string;
  read: boolean;
  starred: boolean;
  tasks: number;
};

// Task types
export type TaskPriority = 'low' | 'medium' | 'high';

export type TaskSource = {
  type: 'email';
  id: string;
  subject: string;
  sender: EmailSender;
};

export type Task = {
  id: string;
  description: string;
  completed: boolean;
  dueDate?: string;
  priority: TaskPriority;
  source: TaskSource;
  createdAt: string;
};

// Email server connection settings
export type EmailProtocol = 'imap' | 'pop3';

export type EmailFetchFrequency = '6h' | '12h' | '24h';

export type EmailSettings = {
  protocol: EmailProtocol;
  server: string;
  port: string;
  username: string;
  password: string;
  useSSL: boolean;
  fetchFrequency: EmailFetchFrequency;
};

// AI processing settings
export type AISettings = {
  processEmailBody: boolean;
  extractActionItems: boolean;
  markEmailAsRead: boolean;
};

// User settings
export type AppSettings = {
  email: EmailSettings;
  ai: AISettings;
};
