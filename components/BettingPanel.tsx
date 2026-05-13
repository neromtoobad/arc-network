"use client";

import { useState, useEffect } from 'react';
import { arcAppKit, agentBets, WalletState } from '@/lib/arc-app-kit';

interface BettingPanelProps {
  debateActive: boolean;
  onBetPlaced?: () => void;
}

export default function BettingPanel({ debateActive, onBetPlaced }: BettingPanelProps) {
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [betAmount, setBetAmount] = useState<string>('10');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bets, setBets] = useState({ A: 0, B: 0 });

  useEffect(() => {
    // Initial wallet state
    setWallet(arcAppKit.getWalletState());

    // Subscribe to wallet changes
    const unsubscribe = arcAppKit.subscribe((state) => {
      setWallet(state);
    });

    // Poll for bet updates
    const interval = setInterval(() => {
      setBets(arcAppKit.getBetTotals());
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      await arcAppKit.connect();
    } catch (err) {
      setError('Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleBet = async (agentId: 'A' | 'B') => {
    if (!wallet?.connected) {
      setError('Please connect your wallet first');
      return;
    }

    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await arcAppKit.placeBet(agentId, amount);
      if (result.success) {
        setBets(arcAppKit.getBetTotals());
        onBetPlaced?.();
      } else {
        setError(result.error || 'Failed to place bet');
      }
    } catch (err) {
      setError('Failed to place bet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 w-full max-w-sm">
      <h2 className="text-lg font-semibold text-white mb-4">Place Your Bet</h2>

      {/* Wallet Status */}
      {!wallet?.connected ? (
        <div className="text-center mb-4">
          <p className="text-gray-400 mb-2">Connect your wallet to bet</p>
          <button
            onClick={handleConnect}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Connecting...' : 'Connect Wallet'}
          </button>
        </div>
      ) : (
        <div className="mb-4 p-3 bg-gray-800 rounded-lg">
          <p className="text-gray-400 text-sm">Your Balance</p>
          <p className="text-2xl font-bold text-green-400">{wallet.balance.toFixed(2)} USDC</p>
          <p className="text-xs text-gray-500 mt-1 truncate">{wallet.address}</p>
        </div>
      )}

      {/* Bet Amount Input */}
      {wallet?.connected && (
        <div className="mb-4">
          <label className="block text-gray-400 text-sm mb-2">Bet Amount (USDC)</label>
          <input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            min="1"
            step="1"
            className="w-full bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-2 bg-red-900/50 border border-red-700 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Bet Buttons */}
      {wallet?.connected && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleBet('A')}
            disabled={loading || debateActive}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-medium transition-colors"
          >
            <span className="block text-sm opacity-75">Bet on</span>
            <span className="block font-bold">Agent A</span>
          </button>
          <button
            onClick={() => handleBet('B')}
            disabled={loading || debateActive}
            className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-medium transition-colors"
          >
            <span className="block text-sm opacity-75">Bet on</span>
            <span className="block font-bold">Agent B</span>
          </button>
        </div>
      )}

      {/* Bet Totals */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-gray-400 text-sm mb-2">Total Pool</p>
        <div className="flex justify-between items-center">
          <div className="text-center flex-1">
            <p className="text-xs text-purple-400">Agent A</p>
            <p className="text-lg font-bold text-white">{bets.A} USDC</p>
          </div>
          <div className="px-4 text-gray-500">vs</div>
          <div className="text-center flex-1">
            <p className="text-xs text-cyan-400">Agent B</p>
            <p className="text-lg font-bold text-white">{bets.B} USDC</p>
          </div>
        </div>
      </div>

      {debateActive && (
        <p className="text-yellow-500 text-xs mt-3 text-center">
          Debate in progress - no new bets accepted
        </p>
      )}
    </div>
  );
}