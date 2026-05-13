import { NextRequest, NextResponse } from 'next/server';

// Mock research insights for crypto debate topics
const researchInsights: Record<string, string[]> = {
  'bitcoin': [
    'On-chain metrics show strong accumulation with exchange reserves at 3-year low',
    'Institutional inflows continue with BlackRock ETF seeing $2B weekly additions',
    'Hash rate reached 500 EH/s, difficulty adjustment upcoming',
    'Layer 2 solutions growing: Lightning Network capacity up 40% this quarter',
  ],
  'default': [
    'Market sentiment shifting positive with Fear & Greed index at 65',
    'Macro conditions favorable with dovish Fed policy expectations',
    'Regulatory clarity improving across major jurisdictions',
    'Retail adoption accelerating with new wallet installations up 25%',
  ],
};

function getInsightForTopic(topic: string): { insight: string; cost: number } {
  // Normalize topic to key
  const key = topic.toLowerCase().includes('bitcoin') ? 'bitcoin' : 'default';
  const insights = researchInsights[key] || researchInsights.default;

  // Pick random insight
  const insight = insights[Math.floor(Math.random() * insights.length)];

  return {
    insight,
    cost: 0.005, // $0.005 USDC per research
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, agentId } = body;

    if (!topic) {
      return NextResponse.json(
        { success: false, error: 'Topic is required' },
        { status: 400 }
      );
    }

    // Simulate network delay for x402 payment processing
    await new Promise(resolve => setTimeout(resolve, 200));

    const result = getInsightForTopic(topic);

    return NextResponse.json({
      success: true,
      insight: result.insight,
      cost: result.cost,
      agentId: agentId || null,
      timestamp: Date.now(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return available research topics
  return NextResponse.json({
    success: true,
    topics: Object.keys(researchInsights),
    costPerRequest: 0.005,
  });
}