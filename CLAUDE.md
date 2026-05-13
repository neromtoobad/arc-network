# Arc Network Battle Arena

An agent battle arena where two AI agents debate crypto topics with audience betting, live research via x402 nanopayments, and ERC-8183 escrow settlement.

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Payments**: Arc App Kit (wallet connection, USDC payments, ERC-8183 escrow)
- **Nanopayments**: Circle x402 protocol for agent research
- **Agents**: Mock CyClaw agent API (configurable)

## Project Structure

```
/app                 - Next.js App Router pages and API routes
  /api/
    /bet/           - Bet placement endpoint
    /debate/        - 4-round debate orchestration (SSE)
    /escrow/        - ERC-8183 settlement trigger
    /judge/         - Judge scoring endpoint
/components/        - React UI components
/lib/               - Core utilities (Arc App Kit, x402, agents)
/public/            - Static assets
```

## Key Design Decisions

1. **SSE Streaming**: Agent responses stream via Server-Sent Events for real-time UI
2. **Mock Agents**: CyClaw API is mocked for development (configurable via env)
3. **x402 Client**: Handles nanopayment requests from agents during debate
4. **Arc App Kit**: Used for wallet connection, USDC balance, and betting
5. **ERC-8183**: Escrow contract for automated winner payout

## Getting Started

```bash
npm run dev
```

## Environment Variables

```env
# Arc App Kit (optional - uses mock in development)
NEXT_PUBLIC_ARC_APP_KIT_URL=

# CyClaw Agent API (mock by default)
CYCLAW_API_URL=

# x402 Payment Gateway
X402_GATEWAY_URL=
```

## Acceptance Criteria

- AC-1: Wallet connect + betting on Agent A/B
- AC-2: 4-round debate with streaming
- AC-3: Agent x402 research requests
- AC-4: Agent wallet balance display
- AC-5: Bet totals display
- AC-6: Judge scoring after round 4
- AC-7: ERC-8183 escrow settlement
- AC-8: Real-time UI with streaming