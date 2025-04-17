import { Email, Task } from "@/types";

// Mock data for email summaries
export const mockEmails: Email[] = [
  {
    id: "1",
    subject: "Project Deadline Extension",
    sender: {
      name: "Sarah Johnson",
      email: "sarah@company.com",
      avatar: "",
    },
    receivedAt: "2023-04-15T10:30:00Z",
    summary: "The deadline for the Q2 marketing project has been extended by one week to allow for additional stakeholder feedback. Please adjust your schedules accordingly.",
    read: false,
    starred: true,
    tasks: 2,
  },
  {
    id: "2",
    subject: "Team Meeting Notes",
    sender: {
      name: "Michael Chen",
      email: "michael@company.com",
      avatar: "",
    },
    receivedAt: "2023-04-15T09:15:00Z",
    summary: "Summary of our weekly team meeting including progress updates on all active projects, resource allocation discussions, and next steps for the product launch.",
    read: true,
    starred: false,
    tasks: 3,
  },
  {
    id: "3",
    subject: "Client Feedback on Proposal",
    sender: {
      name: "Jessica Williams",
      email: "jessica@client.com",
      avatar: "",
    },
    receivedAt: "2023-04-14T16:45:00Z",
    summary: "Positive feedback received on our proposal with some requested changes to the pricing structure and timeline. Client is excited to move forward once revisions are made.",
    read: true,
    starred: true,
    tasks: 1,
  },
  {
    id: "4",
    subject: "New Office Location Update",
    sender: {
      name: "Robert Taylor",
      email: "robert@company.com",
      avatar: "",
    },
    receivedAt: "2023-04-14T11:20:00Z",
    summary: "The move to our new office location is scheduled for June 15th. All employees will receive detailed instructions next week about packing procedures and logistics.",
    read: false,
    starred: false,
    tasks: 0,
  },
  {
    id: "5",
    subject: "Quarterly Budget Review",
    sender: {
      name: "Amanda Lee",
      email: "amanda@finance.com",
      avatar: "",
    },
    receivedAt: "2023-04-13T14:10:00Z",
    summary: "Finance department requests all department heads to submit Q2 budget reviews by the end of the month. Please use the attached template for consistency.",
    read: true,
    starred: false,
    tasks: 1,
  },
];

// Mock data for tasks
export const mockTasks: Task[] = [
  {
    id: "1",
    description: "Update the marketing proposal with new pricing",
    completed: false,
    dueDate: "2023-04-18T23:59:59Z",
    priority: 'high',
    source: {
      type: 'email',
      id: "1",
      subject: "Project Deadline Extension",
      sender: {
        name: "Sarah Johnson",
        email: "sarah@company.com",
        avatar: "",
      },
    },
    createdAt: "2023-04-15T10:30:00Z",
  },
  {
    id: "2",
    description: "Schedule stakeholder meeting for feedback review",
    completed: false,
    dueDate: "2023-04-20T15:00:00Z",
    priority: 'medium',
    source: {
      type: 'email',
      id: "1",
      subject: "Project Deadline Extension",
      sender: {
        name: "Sarah Johnson",
        email: "sarah@company.com",
        avatar: "",
      },
    },
    createdAt: "2023-04-15T10:30:00Z",
  },
  {
    id: "3",
    description: "Compile team meeting notes and share with department",
    completed: true,
    priority: 'medium',
    source: {
      type: 'email',
      id: "2",
      subject: "Team Meeting Notes",
      sender: {
        name: "Michael Chen",
        email: "michael@company.com",
        avatar: "",
      },
    },
    createdAt: "2023-04-15T09:15:00Z",
  },
  {
    id: "4",
    description: "Follow up with design team about project milestones",
    completed: false,
    dueDate: "2023-04-17T12:00:00Z",
    priority: 'high',
    source: {
      type: 'email',
      id: "2",
      subject: "Team Meeting Notes",
      sender: {
        name: "Michael Chen",
        email: "michael@company.com",
        avatar: "",
      },
    },
    createdAt: "2023-04-15T09:15:00Z",
  },
  {
    id: "5",
    description: "Review final project budget allocation",
    completed: false,
    dueDate: "2023-04-19T17:00:00Z",
    priority: 'high',
    source: {
      type: 'email',
      id: "2",
      subject: "Team Meeting Notes",
      sender: {
        name: "Michael Chen",
        email: "michael@company.com",
        avatar: "",
      },
    },
    createdAt: "2023-04-15T09:15:00Z",
  },
  {
    id: "6",
    description: "Revise proposal pricing structure as requested by client",
    completed: false,
    dueDate: "2023-04-16T23:59:59Z",
    priority: 'high',
    source: {
      type: 'email',
      id: "3",
      subject: "Client Feedback on Proposal",
      sender: {
        name: "Jessica Williams",
        email: "jessica@client.com",
        avatar: "",
      },
    },
    createdAt: "2023-04-14T16:45:00Z",
  },
  {
    id: "7",
    description: "Submit Q2 budget review using the provided template",
    completed: false,
    dueDate: "2023-04-30T23:59:59Z",
    priority: 'medium',
    source: {
      type: 'email',
      id: "5",
      subject: "Quarterly Budget Review",
      sender: {
        name: "Amanda Lee",
        email: "amanda@finance.com",
        avatar: "",
      },
    },
    createdAt: "2023-04-13T14:10:00Z",
  },
];

export const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDueDate = (dateString?: string) => {
  if (!dateString) return null;
  
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Check if date is today
  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }
  // Check if date is tomorrow
  else if (date.toDateString() === tomorrow.toDateString()) {
    return "Tomorrow";
  }
  // Otherwise, return formatted date
  else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
    });
  }
};
