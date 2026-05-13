import { NextRequest } from 'next/server';
import { AgentAPI, DebateState } from '@/lib/agents';

export const dynamic = 'force-dynamic';

// Start a new debate
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic } = body;

    if (!topic) {
      return new Response(JSON.stringify({ error: 'Topic is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const debateState = await AgentAPI.startDebate(topic);
    return new Response(JSON.stringify({ success: true, debate: debateState }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Get debate state
export async function GET() {
  const debateState = AgentAPI.getDebateState();
  return new Response(JSON.stringify({ success: true, debate: debateState }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

// SSE endpoint for streaming debate
export async function PUT(request: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const body = await request.json();
        const { topic, judgeScore } = body;

        // Start the debate
        const debateState = await AgentAPI.startDebate(topic);

        // Send initial state
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'start', debate: debateState })}\n\n`));

        // Conduct 4 rounds of debate
        for (let round = 1; round <= 4; round++) {
          // Determine speakers - alternating
          const speakers: Array<'A' | 'B'> = round % 2 === 1 ? ['A', 'B'] : ['B', 'A'];

          for (const speaker of speakers) {
            // Notify who's speaking
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'speaker', agent: speaker, round })}\n\n`));

            // Get agent response with research from /api/research endpoint
            const { response, cost_spent, research_used } = await AgentAPI.getAgentResponse(speaker, round, topic);

            // Call /api/research once per round and deduct from agent wallet
            let researchInsight = null;
            let researchCost = 0;
            try {
              const researchRes = await fetch('http://localhost:3000/api/research', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, agentId: speaker })
              });
              const researchData = await researchRes.json();
              if (researchData.success) {
                researchInsight = researchData.insight;
                researchCost = researchData.cost || 0;

                // Deduct $0.005 from agent wallet in debate state
                const state = AgentAPI.getDebateState();
                if (state && state.agents[speaker].wallet >= researchCost) {
                  state.agents[speaker].wallet -= researchCost;
                  state.agents[speaker].researchSpent += researchCost;
                }
              }
            } catch (e) {
              // Research call failed, continue without research
            }

            // Add round to state
            AgentAPI.addRound({
              round,
              speaker,
              response,
              timestamp: Date.now()
            });

            // Append research insight to response
            const fullResponse = researchInsight
              ? `${response} [Research: ${researchInsight}]`
              : response;

            // Stream the response word by word for effect
            const words = fullResponse.split(' ');
            let currentText = '';
            for (let i = 0; i < words.length; i++) {
              currentText += (i > 0 ? ' ' : '') + words[i];
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'response',
                agent: speaker,
                round,
                research: research_used?.data || null,
                text: currentText,
                completed: i === words.length - 1,
                cost_spent
              })}\n\n`));

              // Small delay between words for streaming effect
              await new Promise(resolve => setTimeout(resolve, 30));
            }

            // Get updated state after round
            const updatedState = AgentAPI.getDebateState();
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'state', debate: updatedState })}\n\n`));
          }

          // Brief pause between rounds
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // End debate and determine winner
        const finalState = AgentAPI.getDebateState();

        // Simple mock judge scoring based on argument quality
        // In real implementation, this would call the judge API
        const winner = determineWinner(finalState!);
        AgentAPI.endDebate(winner);

        const finalDebateState = AgentAPI.getDebateState();
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'end', winner, debate: finalDebateState })}\n\n`));

        controller.close();
      } catch (error) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Debate failed' })}\n\n`));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}

// Mock winner determination - based on research spending and response length
function determineWinner(debate: DebateState): 'A' | 'B' {
  const agentAResponses = debate.rounds.filter(r => r.speaker === 'A');
  const agentBResponses = debate.rounds.filter(r => r.speaker === 'B');

  const aLength = agentAResponses.reduce((sum, r) => sum + r.response.length, 0);
  const bLength = agentBResponses.reduce((sum, r) => sum + r.response.length, 0);

  // Add some randomness
  const aScore = aLength + Math.random() * 100;
  const bScore = bLength + Math.random() * 100;

  return aScore > bScore ? 'A' : 'B';
}