"use client";

import { useState, useEffect, useRef } from 'react';
import BettingPanel from '@/components/BettingPanel';
import { agentBets, WalletState } from '@/lib/arc-app-kit';

interface DebateMessage {
  type: 'start' | 'speaker' | 'response' | 'state' | 'end' | 'error';
  agent?: 'A' | 'B';
  round?: number;
  text?: string;
  completed?: boolean;
  cost_spent?: number;
  winner?: 'A' | 'B';
  debate?: any;
  message?: string;
}

interface AgentStats {
  wallet: number;
  researchSpent: number;
}

const TOPIC = "Will Bitcoin surpass $100K by end of 2026?";

export default function Arena() {
  const [debateActive, setDebateActive] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [bets, setBets] = useState({ A: 0, B: 0 });
  const [currentSpeaker, setCurrentSpeaker] = useState<'A' | 'B' | null>(null);
  const [currentResponse, setCurrentResponse] = useState('');
  const [debateHistory, setDebateHistory] = useState<Array<{ agent: 'A' | 'B'; round: number; text: string }>>([]);
  const [winner, setWinner] = useState<'A' | 'B' | null>(null);
  const [agentStats, setAgentStats] = useState<{ A: AgentStats; B: AgentStats }>({
    A: { wallet: 500, researchSpent: 0 },
    B: { wallet: 500, researchSpent: 0 }
  });
  const [loading, setLoading] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Poll for bet updates
  useEffect(() => {
    const interval = setInterval(() => {
      setBets({ A: agentBets.A, B: agentBets.B });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Cleanup SSE connection on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleStartDebate = async () => {
    setLoading(true);
    setDebateHistory([]);
    setCurrentResponse('');
    setWinner(null);
    setCurrentRound(0);

    try {
      // Use PUT with SSE for streaming
      const response = await fetch('/api/debate', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: TOPIC })
      });

      if (!response.ok) {
        throw new Error('Failed to start debate');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      setDebateActive(true);
      setLoading(false);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data: DebateMessage = JSON.parse(line.slice(6));

              switch (data.type) {
                case 'speaker':
                  setCurrentSpeaker(data.agent || null);
                  setCurrentRound(data.round || 0);
                  setCurrentResponse('');
                  break;

                case 'response':
                  setCurrentResponse(data.text || '');
                  // Update agent spending
                  if (data.cost_spent && data.agent) {
                        setAgentStats(prev => ({
                          ...prev,
                          [data.agent!]: {
                            ...prev[data.agent!],
                            researchSpent: prev[data.agent!].researchSpent + (data.cost_spent || 0)
                          }
                        }));
                      }
                  break;

                case 'state':
                  if (data.debate?.agents) {
                    setAgentStats({
                      A: {
                        wallet: data.debate.agents.A.wallet,
                        researchSpent: data.debate.agents.A.researchSpent
                      },
                      B: {
                        wallet: data.debate.agents.B.wallet,
                        researchSpent: data.debate.agents.B.researchSpent
                      }
                    });
                  }
                  break;

                case 'end':
                  setWinner(data.winner || null);
                  setDebateActive(false);
                  setCurrentSpeaker(null);
                  setCurrentResponse('');
                  if (data.debate?.rounds) {
                    const history = data.debate.rounds.map((r: any) => ({
                      agent: r.speaker,
                      round: r.round,
                      text: r.response
                    }));
                    setDebateHistory(history);
                  }
                  break;

                case 'error':
                  console.error('Debate error:', data.message);
                  setDebateActive(false);
                  break;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Debate failed:', error);
      setDebateActive(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Arc Battle Arena
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm">Powered by</span>
            <span className="font-semibold">Arc Network</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* Topic Banner */}
        <div className="bg-gradient-to-r from-purple-900/50 to-cyan-900/50 rounded-xl p-6 mb-8 text-center border border-gray-800">
          <p className="text-gray-400 text-sm mb-2">Tonight's Topic</p>
          <h2 className="text-3xl font-bold">
            &quot;{TOPIC}&quot;
          </h2>
          <p className="text-gray-500 mt-2">4 Rounds • Live Research Enabled • Audience Betting</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Arena Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Agent Cards */}
            <div className="grid grid-cols-2 gap-4">
              {/* Agent A */}
              <div className="bg-gray-900 border-2 border-purple-600/50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center font-bold text-xl">
                    A
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Crypto Bull</h3>
                    <p className="text-sm text-gray-400">Pro-Bitcoin</p>
                  </div>
                  {winner === 'A' && (
                    <span className="ml-auto bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded">
                      WINNER
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Wallet</span>
                    <span className="text-green-400">{agentStats.A.wallet} USDC</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Research Spent</span>
                    <span className="text-yellow-400">{agentStats.A.researchSpent} USDC</span>
                  </div>
                </div>
              </div>

              {/* Agent B */}
              <div className="bg-gray-900 border-2 border-cyan-600/50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-cyan-600 rounded-full flex items-center justify-center font-bold text-xl">
                    B
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Skepticon</h3>
                    <p className="text-sm text-gray-400">Bearish</p>
                  </div>
                  {winner === 'B' && (
                    <span className="ml-auto bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded">
                      WINNER
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Wallet</span>
                    <span className="text-green-400">{agentStats.B.wallet} USDC</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Research Spent</span>
                    <span className="text-yellow-400">{agentStats.B.researchSpent} USDC</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Debate Viewer */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 min-h-[400px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Debate Stage</h3>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Round</span>
                  <span className="bg-gray-800 px-3 py-1 rounded-full text-sm font-bold">
                    {debateActive ? currentRound : winner ? 'Done' : '-'} / 4
                  </span>
                </div>
              </div>

              {winner && (
                <div className="mb-4 p-4 bg-yellow-900/30 border border-yellow-600 rounded-lg text-center">
                  <p className="text-yellow-400 font-bold text-lg">
                    Winner: Agent {winner} ({winner === 'A' ? 'Crypto Bull' : 'Skepticon'})
                  </p>
                </div>
              )}

              {debateActive || currentResponse ? (
                <div className="space-y-4 max-h-[300px] overflow-y-auto">
                  {/* Debate History */}
                  {debateHistory.map((item, idx) => (
                    <div
                      key={idx}
                      className={`border-l-4 p-4 rounded-r-lg ${
                        item.agent === 'A'
                          ? 'bg-purple-900/30 border-purple-500'
                          : 'bg-cyan-900/30 border-cyan-500'
                      }`}
                    >
                      <p className={`text-sm font-medium mb-1 ${
                        item.agent === 'A' ? 'text-purple-300' : 'text-cyan-300'
                      }`}>
                        Agent {item.agent} - Round {item.round}
                      </p>
                      <p className="text-gray-300">{item.text}</p>
                    </div>
                  ))}

                  {/* Current Speaking */}
                  {currentSpeaker && (
                    <div
                      className={`border-l-4 p-4 rounded-r-lg animate-pulse ${
                        currentSpeaker === 'A'
                          ? 'bg-purple-900/30 border-purple-500'
                          : 'bg-cyan-900/30 border-cyan-500'
                      }`}
                    >
                      <p className={`text-sm font-medium mb-1 ${
                        currentSpeaker === 'A' ? 'text-purple-300' : 'text-cyan-300'
                      }`}>
                        Agent {currentSpeaker} speaking...
                      </p>
                      <p className="text-gray-300">{currentResponse}<span className="animate-pulse">|</span></p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                  {loading ? (
                    <p>Starting debate...</p>
                  ) : winner ? (
                    <p>Debate complete! Check the winner above.</p>
                  ) : (
                    <>
                      <p>Debate has not started yet</p>
                      <button
                        onClick={handleStartDebate}
                        disabled={loading}
                        className="mt-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                      >
                        {loading ? 'Starting...' : 'Start Debate'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Bet Pool Display */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 text-center">
                  <p className="text-purple-400 text-sm">Agent A Pool</p>
                  <p className="text-2xl font-bold">{bets.A} USDC</p>
                </div>
                <div className="px-6">
                  <div className="text-gray-500 text-xl font-light">Total</div>
                  <div className="text-center font-bold text-white">{bets.A + bets.B} USDC</div>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-cyan-400 text-sm">Agent B Pool</p>
                  <p className="text-2xl font-bold">{bets.B} USDC</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Betting Panel */}
            <BettingPanel debateActive={debateActive} />

            {/* Info Panel */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-3">How It Works</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-green-500">1.</span>
                  Connect your wallet and bet on the winner
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">2.</span>
                  Watch agents debate with live research
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">3.</span>
                  Judge scores each side after 4 rounds
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">4.</span>
                  Winners split the pool via escrow
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}