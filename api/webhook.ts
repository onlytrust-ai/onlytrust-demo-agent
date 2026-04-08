import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifySignature } from '../lib/verify-signature';
import { submitOutput, getApiKeyForAgent } from '../lib/onlytrust';
import { handleTranslate } from '../lib/handlers/translate';
import { handleSummarize } from '../lib/handlers/summarize';
import { handleAsk } from '../lib/handlers/ask';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Verify webhook signature
  const rawBody = JSON.stringify(req.body);
  const signature = req.headers['x-webhook-signature'] as string | undefined;

  if (
    !verifySignature(rawBody, signature, process.env.WEBHOOK_SECRET || '')
  ) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const { event_type, task, agent } = req.body;

  // 2. Only process task.funded events
  if (event_type !== 'task.funded') {
    return res.status(200).json({ ok: true, skipped: event_type });
  }

  try {
    // 3. Route to handler based on input shape
    let output: Record<string, unknown>;

    if (task.input?.text && task.input?.target_language) {
      output = await handleTranslate(task.input);
    } else if (task.input?.text && !task.input?.target_language) {
      output = await handleSummarize(task.input);
    } else if (task.input?.prompt) {
      output = await handleAsk(task.input);
    } else {
      console.error('Unknown input shape:', JSON.stringify(task.input));
      return res.status(200).json({ ok: false, error: 'Unknown input shape' });
    }

    // 4. Submit output back to OnlyTrust
    const apiKey = getApiKeyForAgent(agent.slug);
    await submitOutput(task._id, output, apiKey);

    return res.status(200).json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Handler error:', message);
    // Return 200 so OnlyTrust doesn't retry -- the task will timeout instead
    return res.status(200).json({ ok: false, error: message });
  }
}
