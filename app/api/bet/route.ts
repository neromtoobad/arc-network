import { NextRequest, NextResponse } from 'next/server';
import { arcAppKit, agentBets } from '@/lib/arc-app-kit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, agentId, amount, address } = body;

    if (action === 'placeBet') {
      if (!agentId || !amount || !address) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400 }
        );
      }

      if (agentId !== 'A' && agentId !== 'B') {
        return NextResponse.json(
          { success: false, error: 'Invalid agentId' },
          { status: 400 }
        );
      }

      const result = await arcAppKit.placeBet(agentId, amount);
      return NextResponse.json(result);
    }

    if (action === 'getBets') {
      const bets = arcAppKit.getBetTotals();
      return NextResponse.json({ success: true, bets });
    }

    if (action === 'getWallet') {
      const wallet = arcAppKit.getWalletState();
      return NextResponse.json({ success: true, wallet });
    }

    return NextResponse.json(
      { success: false, error: 'Unknown action' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const bets = arcAppKit.getBetTotals();
  const wallet = arcAppKit.getWalletState();
  return NextResponse.json({
    success: true,
    bets,
    wallet,
  });
}