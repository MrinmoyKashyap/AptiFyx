import { DomainEvent, EventType } from '@aptifyx/shared-types';
import { redisPublisher, redisSubscriber } from '../config/redis';
import { logger } from '../utils/logger';

type EventHandler<T> = (event: DomainEvent<T>) => void | Promise<void>;

class EventBus {
  private handlers: Map<EventType, EventHandler<any>[]> = new Map();

  constructor() {
    redisSubscriber.on('message', async (channel, message) => {
      try {
        const event: DomainEvent<any> = JSON.parse(message);
        const typeHandlers = this.handlers.get(event.type as EventType) || [];
        
        for (const handler of typeHandlers) {
          // Execute async to not block the redis message loop
          Promise.resolve(handler(event)).catch((err) => {
            logger.error(`Error in event handler for ${event.type}:`, err);
          });
        }
      } catch (error) {
        logger.error('Failed to parse event message', error);
      }
    });
  }

  async publish<T>(event: DomainEvent<T>): Promise<void> {
    const payload = JSON.stringify(event);
    await redisPublisher.publish(event.type, payload);
    logger.debug(`[EventBus] Published: ${event.type}`);
  }

  subscribe<T>(eventType: EventType, handler: EventHandler<T>): void {
    const existingHandlers = this.handlers.get(eventType);
    
    if (!existingHandlers || existingHandlers.length === 0) {
      this.handlers.set(eventType, [handler]);
      // Only tell Redis to subscribe if it's the first handler for this type
      redisSubscriber.subscribe(eventType, (err) => {
        if (err) {
          logger.error(`Failed to subscribe to ${eventType}`, err);
        } else {
          logger.info(`[EventBus] Subscribed to: ${eventType}`);
        }
      });
    } else {
      existingHandlers.push(handler);
    }
  }
}

export const eventBus = new EventBus();
