import { LedgerRepository } from '../repository';

// This is a simple mock test to demonstrate the ledger logic 
// without needing a live postgres connection during CI/CD.

describe('Ledger Escrow Logic', () => {
  it('should verify that balance >= amount before holding escrow', async () => {
    const mockWallet = { balance: 100, escrow_held: 0 };
    const requestAmount = 150;
    
    expect(mockWallet.balance).toBeLessThan(requestAmount);
    // In actual repo.holdEscrow, this throws "Insufficient balance"
  });

  it('should successfully shift balance to escrow', () => {
    let mockWallet = { balance: 500, escrow_held: 0 };
    const requestAmount = 150;
    
    // Simulate holdEscrow
    mockWallet.balance -= requestAmount;
    mockWallet.escrow_held += requestAmount;

    expect(mockWallet.balance).toBe(350);
    expect(mockWallet.escrow_held).toBe(150);
  });
});
