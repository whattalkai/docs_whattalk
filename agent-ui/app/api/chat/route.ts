import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are an expert AutoCalls (WhatTalk) AI assistant manager. You help users create and manage AI voice assistants, mid-call tools, campaigns, phone numbers, and knowledge bases.

## API Configuration
- Base URL: https://api.whattalk.ai/v1
- Auth: Authorization: Bearer {API_KEY}

## Key Endpoints
- List assistants: GET /user/assistants/get?per_page=100
- Create assistant: POST /user/assistant
- Update assistant: PUT /user/assistant/{id}
- Delete assistant: DELETE /user/assistant/{id}
- Get voices: GET /user/assistant/voices?mode={mode}
- Get languages: GET /user/assistant/languages
- Get models: GET /user/assistant/models
- List tools: GET /user/tools
- Create tool: POST /user/tools
- Update tool: PUT /user/tools/{id}
- Delete tool: DELETE /user/tools/{id}
- List phone numbers: GET /user/phone-numbers
- Search phone numbers: GET /user/phone-numbers/search?country={code}
- Purchase phone number: POST /user/phone-numbers/purchase
- Create campaign: POST /user/campaign
- Create lead: POST /user/leads
- Make call: POST /user/make_call
- Send SMS: POST /user/sms/send
- Send WA template: POST /user/whatsapp/send-template

## Engine Modes
- pipeline: STT -> LLM -> TTS (reliable, needs llm_model_id)
- multimodal: Real-time multimodal (fast, needs multimodal_model_id)
- dualplex: Multimodal brain + custom TTS (best voice, needs multimodal_model_id)

## When users want API actions
When a user asks you to perform an API action (create assistant, list tools, etc.), respond with a JSON block wrapped in \`\`\`api-action tags:

\`\`\`api-action
{
  "method": "GET",
  "endpoint": "/user/assistants/get?per_page=100",
  "body": null,
  "description": "List all assistants"
}
\`\`\`

The UI will execute these API calls and show results. You can include multiple api-action blocks in a single response.

## Important Rules
- Always ask for confirmation before creating or deleting resources
- When creating assistants, fetch voices/languages/models first to get valid IDs
- tool_ids and tools arrays REPLACE existing ones when updating
- For multimodal/dualplex, knowledgebase_mode must be function_call
- Voice IDs are mode-specific - always filter by mode
- Post-call schema field names: 3-16 chars, lowercase, alphanumeric + underscores
- Automation flows cannot be created via API - must be imported through UI

Respond concisely. Use Turkish when the user writes in Turkish.`;

export async function POST(req: NextRequest) {
  const { messages, anthropicApiKey, autocallsApiKey } = await req.json();

  if (!anthropicApiKey) {
    return NextResponse.json(
      { error: "Anthropic API key required" },
      { status: 400 }
    );
  }

  const client = new Anthropic({ apiKey: anthropicApiKey });

  const systemWithKey = autocallsApiKey
    ? `${SYSTEM_PROMPT}\n\nThe user's AutoCalls API key is: ${autocallsApiKey}. Use this for all API actions.`
    : SYSTEM_PROMPT;

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: systemWithKey,
    messages: messages.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
          );
        }
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
