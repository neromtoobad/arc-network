I'll fetch the Arc App Kit documentation first to understand the SDK's capabilities before planning.


Let me search more specifically for these technologies.



I'm unable to fetch external documentation at this time. The web search and fetch tools are returning empty results. 

Based on the user request and general knowledge of these technologies, I'll proceed with the planning using the information provided:

- **Arc Network / Arc App Kit**: A platform for building LLM apps with payment integrations
- **x402 Protocol**: A payment protocol by Circle for nanopayments (micropayments) over HTTP
- **ERC-8183**: An Ethereum standard for escrow contracts
- **CyClaw**: A platform for hosting AI agents

Let me now create the implementation plan based on this context and the detailed requirements provided.

---

## Goal
Build an agent battle arena where two AI agents debate a crypto topic across 4 rounds, with audience betting, live research payments via x402, and automated judge scoring with ERC-8183 escrow settlement.

## Context
- **Stack**: Next.js frontend, CyClaw-hosted agents, Arc App Kit for payments, Circle x402 for agent micropayments
- **Core Flow**: 
  1. Two agents debate a crypto topic for 4 rounds
  2. Each agent has a USDC wallet and can pay for live research via x402
  3. Audience bets USDC on the winner using Arc App Kit
  4. A judge agent scores both sides
  5. ERC-8183 escrow settlement distributes winnings on Arc Network

## Acceptance Criteria
- AC-1: Users can connect a wallet and place bets on Agent A or Agent B before/during the debate
- AC-2: Two agents conduct a 4-round debate on a crypto topic with streaming responses
- AC-3: Each agent can initiate live research requests (x402 micropayments) during their turn
- AC-4: Real-time display of agent wallet balances and spending on research
- AC-5: Real-time display of bet totals for each side
- AC-6: A judge agent evaluates both sides and produces scores after round 4
- AC-7: ERC-8183 escrow releases winnings to the winning side's bettors based on bet proportion
- AC-8: Frontend shows live streaming text, bet amounts, agent spending, and round indicators

## Implementation Notes

### Technical Approach
- **Agent Hosting**: CyClaw agent API endpoints (mock for now, configurable)
- **Payments**: Arc App Kit `Payment` component for betting, x402 client for agent research
- **Escrow**: ERC-8183 contract interaction via Arc App Kit's contract interface
- **Streaming**: Server-Sent Events (SSE) for real-time agent responses

### Key Files to Create/Modify
1. `/app/page.tsx` - Main arena UI with debate viewer, betting panel, agent stats
2. `/app/api/debate/route.ts` - 4-round debate orchestration with streaming
3. `/app/api/bet/route.ts` - Bet placement via Arc App Kit
4. `/app/api/judge/route.ts` - Judge scoring after debate
5. `/app/api/escrow/route.ts` - ERC-8183 settlement triggering
6. `/lib/arc-app-kit.ts` - Arc App Kit SDK wrapper (payment, wallet, escrow)
7. `/lib/x402-client.ts` - Circle x402 nanopayment client for agent research
8. `/lib/agents.ts` - Agent configuration and debate state management
9. `/components/Arena.tsx` - Main debate visualizer
10. `/components/BettingPanel.tsx` - Arc App Kit payment integration
11. `/components/AgentStats.tsx` - Real-time wallet balance and spending display
12. `/components/JudgeScore.tsx` - Score display and winner announcement

### Implementation Sequence
1. Set up Next.js project with Arc App Kit SDK
2. Create wallet connection and USDC balance display
3. Build betting panel with Arc App Kit Payment component
4. Implement SSE endpoint for streaming agent responses
5. Integrate x402 client for agent research requests
6. Build judge agent scoring logic
7. Implement ERC-8183 escrow settlement flow
8. Wire up real-time UI updates

### Verification Commands
- `npm run dev` - Start Next.js dev server
- Check wallet connection via Arc App Kit debug panel
- Place test bet and verify on-chain transaction
- Trigger debate and verify streaming responses
- Complete debate and verify escrow settlement

### Edge Cases
- Handle agent x402 payment failures gracefully (decrement available research budget)
- Handle wallet disconnection mid-debate
- Handle judge timeout or failure
- Handle escrow settlement failures with retry logic

## Out of Scope
- Multi-chain support beyond Arc Network
- Agent model fine-tuning or training
- Persistence of debate history
- Real-time chat between audience and agents

---