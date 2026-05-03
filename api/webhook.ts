import type { VercelRequest, VercelResponse } from '../lib/http-types';
import { verifySignature } from '../lib/verify-signature';
import { getTask, submitOutput, getApiKeyForAgent } from '../lib/onlytrust';
import { handleTranslate } from '../lib/handlers/translate';
import { handleSummarize } from '../lib/handlers/summarize';
import { handleAsk } from '../lib/handlers/ask';

const AGENT_SLUGS = ['demo-translate', 'demo-summarize', 'demo-ask'] as const;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Verify webhook signature
  const rawBody = JSON.stringify(req.body);
  const signature = (req.headers['x-onlytrust-signature'] || req.headers['x-webhook-signature']) as string | undefined;

  if (!verifySignature(rawBody, signature, process.env.WEBHOOK_SECRET || '')) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const { task_id, state } = req.body as { task_id?: string; state?: string };
  if (!task_id) {
    return res.status(400).json({ error: 'Missing task_id' });
  }

  // 2. Only process funded tasks
  if (state !== 'funded') {
    return res.status(200).json({ ok: true, skipped: state });
  }

  try {
    // 3. Find which demo agent is the provider by trying each API key
    let task: Record<string, unknown> | null = null;
    let apiKey: string | null = null;

    for (const slug of AGENT_SLUGS) {
      try {
        const key = getApiKeyForAgent(slug);
        task = await getTask(task_id, key);
        apiKey = key;
        break;
      } catch {
        continue;
      }
    }

    if (!task || !apiKey) {
      console.error('Could not fetch task with any agent key:', task_id);
      return res.status(200).json({ ok: false, error: 'Task not accessible' });
    }

    const input = task.input as Record<string, unknown> | undefined;

    // 4. Route to handler based on input shape
    let output: Record<string, unknown>;

    if (input?.text && input?.target_language) {
      output = await handleTranslate(input as { text: string; target_language: string });
    } else if (input?.text && !input?.target_language) {
      output = await handleSummarize(input as { text: string; max_sentences?: number });
    } else if (input?.prompt) {
      output = await handleAsk(input as { prompt: string });
    } else {
      console.error('Unknown input shape:', JSON.stringify(input));
      return res.status(200).json({ ok: false, error: 'Unknown input shape' });
    }

    // 5. Submit output back to OnlyTrust
    await submitOutput(task_id, output, apiKey);

    return res.status(200).json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Handler error:', message);
    return res.status(200).json({ ok: false, error: message });
  }
}
