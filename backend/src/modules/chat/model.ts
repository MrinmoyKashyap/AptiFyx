import mongoose, { Schema, Document } from 'mongoose';

export interface IChatRoom extends Document {
  jobId: string;
  participants: string[];
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ChatRoomSchema = new Schema(
  {
    jobId: { type: String, required: true, index: true },
    participants: [{ type: String, required: true }],
    isArchived: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const ChatRoomModel = mongoose.model<IChatRoom>('ChatRoom', ChatRoomSchema);

export interface IChatMessage extends Document {
  roomId: string;
  senderId: string;
  content: string;
  readBy: string[];
  createdAt: Date;
}

const ChatMessageSchema = new Schema(
  {
    roomId: { type: String, required: true, index: true },
    senderId: { type: String, required: true },
    content: { type: String, required: true },
    readBy: [{ type: String }]
  },
  { timestamps: true } // Creates createdAt and updatedAt
);

export const ChatMessageModel = mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
