import { eventBus } from './events/event-bus';
import { EventType, JobBroadcastPayload } from '@aptifyx/shared-types';
import { SocketManager } from './sockets/socket-manager';
import { LedgerService } from './modules/ledger/service';
import { ChatService } from './modules/chat/service';
import { logger } from './utils/logger';

export const setupEventHandlers = (socketManager: SocketManager) => {
  const ledgerService = new LedgerService();
  const chatService = new ChatService();

  // Handle Location Updates
  eventBus.subscribe(EventType.PARTNER_LOCATION_UPDATE, (event) => {
    const { partnerId, longitude, latitude } = event.payload;
    socketManager.emitTracking(partnerId, { partnerId, longitude, latitude });
  });

  // Handle Job Broadcast
  eventBus.subscribe<JobBroadcastPayload>(EventType.JOB_BROADCASTED, (event) => {
    const { jobId, customerId, matchedPartnerIds, radiusKm } = event.payload;
    // Notify all matched partners via WebSocket
    for (const partnerId of matchedPartnerIds) {
      socketManager.notifyUser(partnerId, 'job:broadcasted', {
        jobId,
        customerId,
        radiusKm
      });
    }
  });

  // Handle Job Acceptance -> Hold Escrow, Create Chat, Notify Customer
  eventBus.subscribe(EventType.JOB_ACCEPTED, async (event) => {
    const { jobId, customerId, partnerId, amount } = event.payload;
    try {
      await ledgerService.holdEscrow(customerId, jobId, amount);
      await chatService.getOrCreateRoom(jobId, [customerId, partnerId]);
      socketManager.notifyUser(customerId, 'job:accepted', { jobId, partnerId });
    } catch (error) {
      logger.error(\`Failed to process JOB_ACCEPTED for \${jobId}\`, error);
    }
  });

  // Handle Job Start
  eventBus.subscribe(EventType.JOB_STARTED, (event) => {
    const { jobId, customerId } = event.payload;
    socketManager.notifyUser(customerId, 'job:started', { jobId });
  });

  // Handle Job Completion
  eventBus.subscribe(EventType.JOB_COMPLETED, (event) => {
    const { jobId, customerId } = event.payload;
    socketManager.notifyUser(customerId, 'job:completed', { jobId });
  });

  // Handle Job Confirmation -> Release Escrow, Archive Chat
  eventBus.subscribe(EventType.JOB_CONFIRMED, async (event) => {
    const { jobId, customerId, partnerId, amount } = event.payload;
    try {
      await ledgerService.releaseEscrow(customerId, partnerId, jobId, amount);
      await chatService.archiveRoom(jobId);
      socketManager.notifyUser(partnerId, 'job:confirmed', { jobId });
    } catch (error) {
      logger.error(\`Failed to process JOB_CONFIRMED for \${jobId}\`, error);
    }
  });

  // Handle Job Cancellation -> Refund Escrow
  eventBus.subscribe(EventType.JOB_CANCELLED, async (event) => {
    const { jobId, customerId, partnerId, amount } = event.payload;
    try {
      await ledgerService.refundEscrow(customerId, jobId, amount);
      // Notify both parties
      socketManager.notifyUser(customerId, 'job:cancelled', { jobId });
      if (partnerId) {
        socketManager.notifyUser(partnerId, 'job:cancelled', { jobId });
      }
    } catch (error) {
      // It might fail if escrow wasn't held yet, which is fine, just log
      logger.debug(\`Escrow refund skipped or failed for \${jobId}\`);
    }
  });

  // Handle Chat Messages
  eventBus.subscribe(EventType.CHAT_MESSAGE_SENT, (event) => {
    const { roomId, senderId, content, timestamp } = event.payload;
    socketManager.emitToChat(roomId, 'chat:message', { senderId, content, timestamp });
  });
};
