import { NextRequest, NextResponse } from 'next/server';
import { arcAppKit, agentBets, Bet } from '@/lib/arc-app-kit';

export const dynamic = 'force-dynamic';

export interface EscrowSettlement {
  success: boolean;
  winner: 'A' | 'B';
  totalPool: number;
  payouts: Array<{
    betId: string;
    userId: string;
    agentId: 'A' | 'B';
    betAmount: number;
    payout: number;
  }>;
  timestamp: number;
}

// POST - Settle escrow and distribute winnings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { winner } = body;

    if (!winner || (winner !== 'A' && winner !== 'B')) {
      return NextResponse.json(
        { success: false, error: 'Invalid winner' },
        { status: 400 }
      );
    }

    const bets = arcAppKit.getBetTotals();
    const totalPool = bets.A + bets.B;

    if (totalPool === 0) {
      return NextResponse.json(
        { success: false, error: 'No bets to settle' },
        { status: 400 }
      );
    }

    const winningBets = Object.entries(agentBets).filter(([id]) => id === winner);
    const winningAmount = winner === 'A' ? bets.A : bets.B;

    if (winningAmount === 0) {
      // No winners - refund everyone (shouldn't happen in practice)
      const result = await arcAppKit.settleEscrow(winner);
      return NextResponse.json({
        success: result.success,
        winner,
        totalPool,
        payouts: [],
        message: 'No winning bets - pool refunded'
      });
    }

    // Calculate payouts proportionally
    const ratio = totalPool / winningAmount;
    const escrowState = arcAppKit.getEscrowState();

    const payouts: EscrowSettlement['payouts'] = [];
    escrowState.bets
      .filter(b => b.agentId === winner)
      .forEach(bet => {
        const payout = Math.floor(bet.amount * ratio);
        payouts.push({
          betId: bet.id,
          userId: bet.userId,
          agentId: bet.agentId,
          betAmount: bet.amount,
          payout
        });
      });

    // Process settlement
    const settlement = await arcAppKit.settleEscrow(winner);

    const result: EscrowSettlement = {
      success: settlement.success || false,
      winner,
      totalPool,
      payouts,
      timestamp: Date.now()
    };

    return NextResponse.json({ success: true, result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get escrow status
export async function GET() {
  const escrowState = arcAppKit.getEscrowState();
  const bets = arcAppKit.getBetTotals();

  return NextResponse.json({
    success: true,
    escrow: {
      id: escrowState.id,
      totalAmount: escrowState.totalAmount,
      bets: escrowState.bets.length,
      settled: escrowState.settled,
      winner: escrowState.winner,
      betTotals: bets
    }
  });
}

// PUT - Reset escrow for new debate
export async function PUT() {
  arcAppKit.resetEscrow();

  return NextResponse.json({
    success: true,
    message: 'Escrow reset for new debate'
  });
}