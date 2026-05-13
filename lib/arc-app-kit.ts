// Arc App Kit SDK wrapper - provides wallet connection, USDC payments, and ERC-8183 escrow
// Mock implementation for development

export interface WalletState {
  address: string | null;
  connected: boolean;
  balance: number; // USDC
}

export interface Bet {
  id: string;
  userId: string;
  agentId: 'A' | 'B';
  amount: number;
  timestamp: number;
}

export interface EscrowState {
  id: string;
  totalAmount: number;
  bets: Bet[];
  settled: boolean;
  winner: 'A' | 'B' | null;
}

// Mock wallet state
let mockWallet: WalletState = {
  address: null,
  connected: false,
  balance: 1000, // Start with 1000 USDC for testing
};

// Mock escrow pool
let mockEscrow: EscrowState = {
  id: 'escrow-1',
  totalAmount: 0,
  bets: [],
  settled: false,
  winner: null,
};

// Agent betting totals
export const agentBets = {
  A: 0,
  B: 0,
};

export class ArcAppKit {
  private listeners: Set<(state: WalletState) => void> = new Set();

  // Connect wallet (mock)
  async connect(): Promise<WalletState> {
    // Simulate wallet connection
    await new Promise((resolve) => setTimeout(resolve, 500));
    mockWallet = {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      connected: true,
      balance: 1000,
    };
    this.notifyListeners();
    return mockWallet;
  }

  // Disconnect wallet
  async disconnect(): Promise<void> {
    mockWallet = {
      address: null,
      connected: false,
      balance: 0,
    };
    this.notifyListeners();
  }

  // Get current wallet state
  getWalletState(): WalletState {
    return mockWallet;
  }

  // Subscribe to wallet changes
  subscribe(listener: (state: WalletState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Place a bet
  async placeBet(agentId: 'A' | 'B', amount: number): Promise<{ success: boolean; bet?: Bet; error?: string }> {
    if (!mockWallet.connected) {
      return { success: false, error: 'Wallet not connected' };
    }
    if (amount > mockWallet.balance) {
      return { success: false, error: 'Insufficient balance' };
    }
    if (amount <= 0) {
      return { success: false, error: 'Amount must be positive' };
    }

    // Deduct from wallet and add to escrow
    mockWallet.balance -= amount;
    const bet: Bet = {
      id: `bet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: mockWallet.address!,
      agentId,
      amount,
      timestamp: Date.now(),
    };

    mockEscrow.bets.push(bet);
    mockEscrow.totalAmount += amount;
    agentBets[agentId] += amount;

    this.notifyListeners();
    return { success: true, bet };
  }

  // Get bet totals for each agent
  getBetTotals(): { A: number; B: number } {
    return { A: agentBets.A, B: agentBets.B };
  }

  // Get escrow state
  getEscrowState(): EscrowState {
    return mockEscrow;
  }

  // Settle escrow - distribute winnings to winning side bettors
  async settleEscrow(winner: 'A' | 'B'): Promise<{ success: boolean; payouts?: Record<string, number>; error?: string }> {
    if (mockEscrow.settled) {
      return { success: false, error: 'Escrow already settled' };
    }

    const winningBets = mockEscrow.bets.filter((b) => b.agentId === winner);
    const totalWinningAmount = winningBets.reduce((sum, b) => sum + b.amount, 0);

    if (totalWinningAmount === 0) {
      // No winners - refund everyone
      const refunds: Record<string, number> = {};
      mockEscrow.bets.forEach((b) => {
        refunds[b.userId] = (refunds[b.userId] || 0) + b.amount;
        mockWallet.balance += b.amount;
      });
      mockEscrow.settled = true;
      mockEscrow.winner = winner;
      this.notifyListeners();
      return { success: true, payouts: refunds };
    }

    // Calculate payouts proportionally
    const payouts: Record<string, number> = {};
    const ratio = mockEscrow.totalAmount / totalWinningAmount;

    winningBets.forEach((b) => {
      const payout = Math.floor(b.amount * ratio);
      payouts[b.userId] = (payouts[b.userId] || 0) + payout;
      mockWallet.balance += payout;
    });

    mockEscrow.settled = true;
    mockEscrow.winner = winner;
    this.notifyListeners();
    return { success: true, payouts };
  }

  // Reset escrow for new round
  resetEscrow(): void {
    mockEscrow = {
      id: `escrow-${Date.now()}`,
      totalAmount: 0,
      bets: [],
      settled: false,
      winner: null,
    };
    agentBets.A = 0;
    agentBets.B = 0;
    this.notifyListeners();
  }

  // Add funds (for testing)
  async addFunds(amount: number): Promise<void> {
    mockWallet.balance += amount;
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(mockWallet));
  }
}

// Export singleton instance
export const arcAppKit = new ArcAppKit();