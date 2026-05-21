export interface ChatRoom {
  id: string;
  jobId: string;
  participants: string[]; // User IDs (Customer and Partner)
  isArchived: boolean;    // Set to true after job completion and payment
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  timestamp: string;
  readBy: string[]; // Array of user IDs who have read the message
}
