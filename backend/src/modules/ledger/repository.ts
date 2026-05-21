import { pgPool } from '../../config/postgres';
import { Wallet, Transaction, TransactionType } from '@aptifyx/shared-types';

export class LedgerRepository {
  async getWalletByUserId(userId: string): Promise<Wallet | null> {
    const query = `
      SELECT id, user_id as "userId", balance, escrow_held as "escrowHeld", currency, created_at as "createdAt"
      FROM wallets WHERE user_id = $1
    `;
    const { rows } = await pgPool.query(query, [userId]);
    return rows[0] || null;
  }

  async getTransactions(walletId: string, limit: number = 20, offset: number = 0): Promise<Transaction[]> {
    const query = `
      SELECT id, wallet_id as "walletId", type, amount, balance_after as "balanceAfter", related_job_id as "relatedJobId", description, created_at as "createdAt"
      FROM transactions WHERE wallet_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const { rows } = await pgPool.query(query, [walletId, limit, offset]);
    return rows;
  }

  async createWallet(userId: string, initialBalance: number = 10000.00): Promise<Wallet> {
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      
      const insertWallet = `
        INSERT INTO wallets (user_id, balance)
        VALUES ($1, $2)
        RETURNING id, user_id as "userId", balance, escrow_held as "escrowHeld", currency, created_at as "createdAt"
      `;
      const { rows: walletRows } = await client.query(insertWallet, [userId, initialBalance]);
      const wallet = walletRows[0];

      if (initialBalance > 0) {
        const insertTx = `
          INSERT INTO transactions (wallet_id, type, amount, balance_after, description)
          VALUES ($1, $2, $3, $4, $5)
        `;
        await client.query(insertTx, [wallet.id, TransactionType.SIGNUP_BONUS, initialBalance, initialBalance, 'Initial signup bonus']);
      }

      await client.query('COMMIT');
      return wallet;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async holdEscrow(customerId: string, jobId: string, amount: number): Promise<void> {
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');

      const lockWallet = `SELECT id, balance FROM wallets WHERE user_id = $1 FOR UPDATE`;
      const { rows } = await client.query(lockWallet, [customerId]);
      
      if (!rows.length) throw new Error('Customer wallet not found');
      const wallet = rows[0];

      if (wallet.balance < amount) throw new Error('Insufficient balance');

      const newBalance = Number(wallet.balance) - amount;

      const updateWallet = `
        UPDATE wallets 
        SET balance = balance - $1, escrow_held = escrow_held + $1
        WHERE user_id = $2
        RETURNING escrow_held
      `;
      await client.query(updateWallet, [amount, customerId]);

      const insertTx = `
        INSERT INTO transactions (wallet_id, type, amount, balance_after, related_job_id, description)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      await client.query(insertTx, [
        wallet.id, 
        TransactionType.ESCROW_HOLD, 
        amount, 
        newBalance, 
        jobId, 
        \`Funds held in escrow for job \${jobId}\`
      ]);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async releaseEscrow(customerId: string, partnerId: string, jobId: string, amount: number): Promise<void> {
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');

      // 1. Release from Customer Escrow
      const lockCustomerWallet = `SELECT id, escrow_held, balance FROM wallets WHERE user_id = $1 FOR UPDATE`;
      const { rows: custRows } = await client.query(lockCustomerWallet, [customerId]);
      if (!custRows.length) throw new Error('Customer wallet not found');
      
      if (Number(custRows[0].escrow_held) < amount) {
        throw new Error('Insufficient escrow held');
      }

      await client.query(`UPDATE wallets SET escrow_held = escrow_held - $1 WHERE user_id = $2`, [amount, customerId]);
      
      await client.query(`
        INSERT INTO transactions (wallet_id, type, amount, balance_after, related_job_id, description)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        custRows[0].id, 
        TransactionType.ESCROW_RELEASE, 
        amount, 
        custRows[0].balance, 
        jobId, 
        \`Escrow released to partner for job \${jobId}\`
      ]);

      // 2. Add to Partner Balance
      const lockPartnerWallet = `SELECT id, balance FROM wallets WHERE user_id = $1 FOR UPDATE`;
      const { rows: partnerRows } = await client.query(lockPartnerWallet, [partnerId]);
      if (!partnerRows.length) throw new Error('Partner wallet not found');

      const newPartnerBalance = Number(partnerRows[0].balance) + amount;
      await client.query(`UPDATE wallets SET balance = balance + $1 WHERE user_id = $2`, [amount, partnerId]);

      await client.query(`
        INSERT INTO transactions (wallet_id, type, amount, balance_after, related_job_id, description)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        partnerRows[0].id, 
        TransactionType.CREDIT, 
        amount, 
        newPartnerBalance, 
        jobId, 
        \`Payment received for job \${jobId}\`
      ]);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async refundEscrow(customerId: string, jobId: string, amount: number): Promise<void> {
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');

      const lockWallet = `SELECT id, escrow_held, balance FROM wallets WHERE user_id = $1 FOR UPDATE`;
      const { rows } = await client.query(lockWallet, [customerId]);
      if (!rows.length) throw new Error('Customer wallet not found');
      const wallet = rows[0];

      if (Number(wallet.escrow_held) < amount) throw new Error('Insufficient escrow held');

      const newBalance = Number(wallet.balance) + amount;

      await client.query(`
        UPDATE wallets 
        SET balance = balance + $1, escrow_held = escrow_held - $1
        WHERE user_id = $2
      `, [amount, customerId]);

      await client.query(`
        INSERT INTO transactions (wallet_id, type, amount, balance_after, related_job_id, description)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        wallet.id, 
        TransactionType.ESCROW_REFUND, 
        amount, 
        newBalance, 
        jobId, 
        \`Escrow refunded for cancelled job \${jobId}\`
      ]);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
