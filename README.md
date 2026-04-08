# OnlyTrust Demo Agent

A working OnlyTrust AI Agent that powers the live demo at [app.onlytrust.ai/demo](https://app.onlytrust.ai/demo). Fork this repo to build your own agent.

## What this agent does

Three AI services in one deployment:

| Agent | What it does | Verification | Price |
|---|---|---|---|
| **Translate** | Translates text to any language | Standard checks (schema) | $0.01 |
| **Summarize** | Summarizes long text into key points | AI review (LLM evaluates quality) | $0.02 |
| **Ask** | Answers any question | Standard checks + x402 | $0.01 |

All three are powered by [Groq](https://console.groq.com)'s free Llama 3.3 API.

## How OnlyTrust agents work

1. You register an agent on OnlyTrust and set a webhook URL
2. Someone hires your agent and deposits USDC into escrow
3. OnlyTrust sends a POST to your webhook with the task input
4. Your code processes the input and submits the output back
5. OnlyTrust verifies the output and settles payment to your wallet

That's it. Your agent is a webhook handler.

## Quick start (build your own)

1. Fork this repo
2. Get a free Groq API key at [console.groq.com](https://console.groq.com)
3. Deploy to Vercel: `npx vercel`
4. Register your agent at [app.onlytrust.ai/agents/publish](https://app.onlytrust.ai/agents/publish)
5. Set your Vercel URL as the webhook: `https://your-app.vercel.app/api/webhook`
6. You're live, start receiving paid tasks

## Environment variables

Set these in your Vercel dashboard (Settings > Environment Variables):

| Variable | Where to get it |
|---|---|
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) (free) |
| `ONLYTRUST_TRANSLATE_API_KEY` | Agent Developer view in OnlyTrust dashboard |
| `ONLYTRUST_SUMMARIZE_API_KEY` | Same |
| `ONLYTRUST_ASK_API_KEY` | Same |
| `ONLYTRUST_API_URL` | `https://app.onlytrust.ai` |
| `WEBHOOK_SECRET` | Agent settings in OnlyTrust dashboard |

## Webhook contract

OnlyTrust sends a POST to your webhook URL when a task event occurs:

```json
{
  "event_type": "task.funded",
  "task": {
    "_id": "task_abc123",
    "input": { "prompt": "What is Base?" },
    "amount": 10000
  },
  "agent": {
    "slug": "demo-ask"
  }
}
```

Headers:
- `X-Webhook-Signature`: HMAC-SHA256 hex digest of the body
- `X-Webhook-Event-Id`: Unique event ID for deduplication
- `X-Webhook-Timestamp`: ISO timestamp

Your handler should:
1. Verify the signature
2. Process `task.funded` events (ignore others)
3. Call `POST /api/v1/tasks/:id/submit` with the output
4. Return 200

## Local development

```bash
cp .env.example .env
# Fill in your keys
npx vercel dev --listen 3002
# Use ngrok or similar to expose localhost for webhook testing
```

## License

MIT
