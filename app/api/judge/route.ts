import { NextRequest, NextResponse } from 'next/server';
import { AgentAPI } from '@/lib/agents';

export const dynamic = 'force-dynamic';

export interface JudgeScore {
  agentId: 'A' | 'B';
  agentName: string;
  score: number;
  breakdown: {
    argumentation: number;
    evidence: number;
    persuasiveness: number;
    rebuttal: number;
  };
  feedback: string;
}

export interface JudgeResult {
  winner: 'A' | 'B';
  scores: {
    A: JudgeScore;
    B: JudgeScore;
  };
  timestamp: number;
}

// Mock judge evaluation
function evaluateAgent(
  agentId: 'A' | 'B',
  rounds: Array<{ speaker: 'A' | 'B'; response: string; round: number }>
): JudgeScore {
  const agentRounds = rounds.filter(r => r.speaker === agentId);
  const responseLengths = agentRounds.map(r => r.response.length);
  const avgLength = responseLengths.reduce((a, b) => a + b, 0) / responseLengths.length;

  // Score based on response length and content quality (mock metrics)
  const argumentation = Math.min(10, Math.floor(5 + Math.random() * 5));
  const evidence = Math.min(10, Math.floor(avgLength / 100 + Math.random() * 3));
  const persuasiveness = Math.min(10, Math.floor(6 + Math.random() * 4));
  const rebuttal = Math.min(10, Math.floor(4 + Math.random() * 5));

  const totalScore = argumentation + evidence + persuasiveness + rebuttal;

  const agentName = agentId === 'A' ? 'Crypto Bull' : 'Skepticon';

  let feedback = '';
  if (agentId === 'A') {
    feedback = argumentation >= 7
      ? 'Strong institutional adoption arguments. Consider addressing volatility concerns more directly.'
      : 'Good macroeconomic analysis. Could strengthen technical arguments.';
  } else {
    feedback = rebuttal >= 7
      ? 'Excellent regulatory risk analysis. Consider adding more positive counterarguments.'
      : 'Valid environmental concerns. Could cite more specific examples.';
  }

  return {
    agentId,
    agentName,
    score: totalScore,
    breakdown: { argumentation, evidence, persuasiveness, rebuttal },
    feedback
  };
}

// POST - Get judge evaluation for current debate
export async function POST(request: NextRequest) {
  try {
    const debateState = AgentAPI.getDebateState();

    if (!debateState) {
      return NextResponse.json(
        { success: false, error: 'No active debate' },
        { status: 400 }
      );
    }

    if (debateState.rounds.length < 4) {
      return NextResponse.json(
        { success: false, error: 'Debate not complete' },
        { status: 400 }
      );
    }

    // Simulate judge thinking time
    await new Promise(resolve => setTimeout(resolve, 500));

    // Evaluate both agents
    const scoreA = evaluateAgent('A', debateState.rounds);
    const scoreB = evaluateAgent('B', debateState.rounds);

    // Determine winner
    const winner = scoreA.score > scoreB.score ? 'A' : 'B';

    const result: JudgeResult = {
      winner,
      scores: {
        A: scoreA,
        B: scoreB
      },
      timestamp: Date.now()
    };

    // Update debate state with winner
    AgentAPI.endDebate(winner);

    return NextResponse.json({ success: true, result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get current judge status
export async function GET() {
  const debateState = AgentAPI.getDebateState();

  if (!debateState) {
    return NextResponse.json({
      success: true,
      status: 'no_debate',
      message: 'No active debate'
    });
  }

  if (debateState.status === 'completed') {
    return NextResponse.json({
      success: true,
      status: 'completed',
      winner: debateState.winner,
      rounds: debateState.rounds.length
    });
  }

  return NextResponse.json({
    success: true,
    status: 'in_progress',
    currentRound: debateState.currentRound,
    maxRounds: debateState.maxRounds
  });
}