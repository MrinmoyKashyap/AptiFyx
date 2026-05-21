import { ChatRoomModel, ChatMessageModel, IChatRoom } from './model';
import { eventBus } from '../../events/event-bus';
import { EventType } from '@aptifyx/shared-types';

export class ChatService {
  async getOrCreateRoom(jobId: string, participants: string[]): Promise<IChatRoom> {
    let room = await ChatRoomModel.findOne({ jobId });
    if (!room) {
      room = new ChatRoomModel({ jobId, participants });
      await room.save();
    }
    return room;
  }

  async getMyRooms(userId: string) {
    return ChatRoomModel.find({ participants: userId }).sort({ updatedAt: -1 });
  }

  async getMessages(roomId: string, limit: number = 50, offset: number = 0) {
    return ChatMessageModel.find({ roomId })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);
  }

  async sendMessage(roomId: string, senderId: string, content: string) {
    const room = await ChatRoomModel.findById(roomId);
    if (!room) throw new Error('Room not found');
    if (room.isArchived) throw new Error('Cannot send messages to an archived chat');
    if (!room.participants.includes(senderId)) throw new Error('Unauthorized');

    const msg = new ChatMessageModel({
      roomId,
      senderId,
      content,
      readBy: [senderId]
    });
    
    await msg.save();
    
    // Update room updatedAt for sorting
    room.updatedAt = new Date();
    await room.save();

    // Broadcast via pub/sub so socket manager can push to clients
    await eventBus.publish({
      type: EventType.CHAT_MESSAGE_SENT,
      payload: { 
        roomId, 
        messageId: msg.id,
        senderId, 
        content, 
        timestamp: msg.createdAt 
      },
      timestamp: new Date().toISOString()
    });

    return msg;
  }

  async archiveRoom(jobId: string) {
    await ChatRoomModel.updateMany({ jobId }, { $set: { isArchived: true } });
  }
}
