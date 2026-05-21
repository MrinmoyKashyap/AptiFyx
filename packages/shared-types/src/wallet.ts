export enum TransactionType {
  CREDIT = 'credit',                   // Deposit to wallet
  DEBIT = 'debit',                     // Withdrawal from wallet
  ESCROW_HOLD = 'escrow_hold',         // Move funds to escrow (Customer created job)
  ESCROW_RELEASE = 'escrow_release',   // Move funds from escrow to Partner (Job confirmed)
  ESCROW_REFUND = 'escrow_refund',     // Move funds from escrow back to Customer (Job cancelled)
  SIGNUP_BONUS = 'signup_bonus'        // Initial virtual balance
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;      // Available balance
  escrowHeld: number;   // Funds currently held for active jobs
  currency: string;     // Default to 'AFX'
  createdAt: string;
}

export interface Transaction {
  id: string;
  walletId: string;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  relatedJobId?: string;
  description?: string;
  createdAt: string;
}
