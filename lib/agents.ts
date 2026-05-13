// Agent configuration and debate state management
// Mock CyClaw agent API for development
import { x402, x402PaymentResponse } from './x402-client';

export interface Agent {
  id: 'A' | 'B';
  name: string;
  position: 'pro' | 'con';
  wallet: number; // USDC balance
  researchSpent: number; // USDC spent on research
}

export interface DebateRound {
  round: number;
  speaker: 'A' | 'B';
  response: string;
  timestamp: number;
}

export interface DebateState {
  id: string;
  topic: string;
  status: 'pending' | 'active' | 'completed';
  currentRound: number;
  maxRounds: number;
  agents: {
    A: Agent;
    B: Agent;
  };
  rounds: DebateRound[];
  winner: 'A' | 'B' | null;
}

// Mock debate state
let debateState: DebateState | null = null;

// Pre-defined debate arguments for the mock
const debateArguments = {
  A: [
    "Bitcoin has consistently proven itself as digital gold with institutional adoption accelerating. BlackRock's ETF alone has brought billions in capital. With supply capped at 21M coins and halving events reducing new supply, the mathematics are undeniable. $100K is not a matter of if, but when.",
    "The macroeconomic environment supports this thesis. Global debt is at record levels, and governments are monetizing debt through money printing. Bitcoin serves as a hedge against fiscal recklessness. Countries like El Salvador's adoption signals national-level accumulation is coming.",
    "Technical analysis supports the bullish case. Bitcoin has formed a textbook accumulation pattern. On-chain metrics show healthy miner activity and long-term holder accumulation. The 4-year cycle suggests 2025-2026 is the next major breakout period.",
    "Finally, the ecosystem is maturing rapidly. Layer 2 solutions, institutional custody, and regulatory clarity are all converging. With the US potentially approving spot ETFs and major banks entering the space, $100K by end of 2026 remains conservative."
  ],
  B: [
    "Bitcoin's volatility makes $100K predictions reckless. It dropped 60% in 2022 and has struggled to maintain $100K support in testing. The notion that it will sustainably break six figures ignores the fundamental volatility risk.",
    "Regulatory uncertainty remains a massive headwind. The SEC has repeatedly rejected spot ETFs, and governments globally are tightening crypto regulations. China's ban demonstrated how quickly markets can crash when policy shifts.",
    "Competition from CBDCs and other cryptocurrencies threatens Bitcoin's dominance. As digital currency adoption grows, why would people choose energy-intensive Bitcoin over more efficient alternatives? The narrative of 'digital gold' is weakening.",
    "Finally, the energy consumption debate is reaching a tipping point. Environmental concerns are driving institutional ESG policies away from Bitcoin. The mining community's shift to renewables is too slow. By 2026, regulatory and environmental pressure could crush the bull case."
  ]
};

export class AgentAPI {
  // Start a new debate
  static async startDebate(topic: string): Promise<DebateState> {
    debateState = {
      id: `debate-${Date.now()}`,
      topic,
      status: 'active',
      currentRound: 0,
      maxRounds: 4,
      agents: {
        A: {
          id: 'A',
          name: 'Crypto Bull',
          position: 'pro',
          wallet: 500,
          researchSpent: 0
        },
        B: {
          id: 'B',
          name: 'Skepticon',
          position: 'con',
          wallet: 500,
          researchSpent: 0
        }
      },
      rounds: [],
      winner: null
    };
    return debateState;
  }

  // Get current debate state
  static getDebateState(): DebateState | null {
    return debateState;
  }

  // Get agent response for a round (mock)
  static async getAgentResponse(
    agentId: 'A' | 'B',
    round: number,
    topic: string,
    context?: string
  ): Promise<{ response: string; cost_spent: number; research_used?: x402PaymentResponse }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));

    // Agents can purchase research via x402 during debate
    let researchUsed: x402PaymentResponse | undefined;
    let cost = 0;

    if (debateState) {
      const agentBudget = debateState.agents[agentId].wallet;

      // Attempt to purchase research (40% chance)
      const researchResult = await x402.agentPurchaseResearch(agentId, agentBudget);

      if (researchResult && researchResult.success) {
        researchUsed = researchResult;
        cost = researchResult.cost || 0;

        // Deduct from agent wallet
        debateState.agents[agentId].researchSpent += cost;
        debateState.agents[agentId].wallet -= cost;
      }
    }

    // Base response from pre-defined arguments
    let response = debateArguments[agentId][round - 1] ||
      `${agentId === 'A' ? 'Bull' : 'Bear'} case for ${topic}`;

    // If agent purchased research, incorporate it into the response
    if (researchUsed && researchUsed.data) {
      response += ` [Research: ${researchUsed.data.content}]`;
    }

    return { response, cost_spent: cost, research_used: researchUsed };
  }

  // Add round to debate state
  static addRound(round: DebateRound): void {
    if (debateState) {
      debateState.rounds.push(round);
      debateState.currentRound = round.round;
    }
  }

  // End debate
  static endDebate(winner: 'A' | 'B'): void {
    if (debateState) {
      debateState.status = 'completed';
      debateState.winner = winner;
    }
  }

  // Reset debate
  static resetDebate(): void {
    debateState = null;
  }
}