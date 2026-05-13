## Goal
Confirm that agent x402 micropayments for live research during debate turns are fully functional.

## Context
The x402 micropayment feature is already implemented across the codebase:
- **lib/x402-client.ts**: Mock x402 client with `agentPurchaseResearch()` (40% chance/turn, 1-3 USDC)
- **lib/agents.ts:106-117**: Integrates x402 calls, deducts costs from agent wallet
- **lib/agents.ts:124-126**: Incorporates research data into agent responses
- **app/api/debate/route.ts:85-88**: Streams research data to frontend via SSE
- **app/page.tsx:286-288,314-316**: Displays wallet and Research Spent

## Acceptance Criteria
- AC-1: Agents have USDC wallets (500 USDC each) that decrease when purchasing research
- AC-2: Agents can purchase research during debate turns via x402 mock
- AC-3: Research data appears in agent responses with "[Research: ...]" suffix
- AC-4: Frontend displays Research Spent updating in real-time during debate

## Implementation Notes
**No new code required** - the feature exists and functions as specified. Mock research topics available:
- btc-price-forecast, market-sentiment, regulatory-update
- mining-dynamics, institutional-flows, competition-analysis

## Verification
```bash
npm run dev
# Start debate, watch agent wallet decrease and Research Spent increase
```

## Out of Scope
- Real x402 payment gateway integration
- Additional research topics