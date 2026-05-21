import { LedgerRepository } from './repository';
import { eventBus } from '../../events/event-bus';
import { EventType } from '@aptifyx/shared-types';

export class LedgerService {
  private repo = new LedgerRepository();

  async getWallet(userId: string) {
    let wallet = await this.repo.getWalletByUserId(userId);
    if (!wallet) {
      // Auto-create if it doesn't exist (e.g. for users created before Ledger was online)
      wallet = await this.repo.createWallet(userId);
    }
    return wallet;
  }

  async getTransactions(userId: string, limit?: number, offset?: number) {
    const wallet = await this.getWallet(userId);
    return this.repo.getTransactions(wallet.id, limit, offset);
  }

  async holdEscrow(customerId: string, jobId: string, amount: number) {
    await this.repo.holdEscrow(customerId, jobId, amount);
    await eventBus.publish({
      type: EventType.ESCROW_HELD,
      payload: { customerId, jobId, amount },
      timestamp: new Date().toISOString()
    });
  }

  async releaseEscrow(customerId: string, partnerId: string, jobId: string, amount: number) {
    await this.repo.releaseEscrow(customerId, partnerId, jobId, amount);
    await eventBus.publish({
      type: EventType.ESCROW_RELEASED,
      payload: { customerId, partnerId, jobId, amount },
      timestamp: new Date().toISOString()
    });
  }

  async refundEscrow(customerId: string, jobId: string, amount: number) {
    await this.repo.refundEscrow(customerId, jobId, amount);
    await eventBus.publish({
      type: EventType.ESCROW_REFUNDED,
      payload: { customerId, jobId, amount },
      timestamp: new Date().toISOString()
    });
  }
}
