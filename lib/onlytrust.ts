const API_URL = process.env.ONLYTRUST_API_URL || 'https://app.onlytrust.ai';

export async function submitOutput(
  taskId: string,
  output: Record<string, unknown>,
  apiKey: string
): Promise<void> {
  const res = await fetch(`${API_URL}/api/v1/tasks/${taskId}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ output }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Submit failed: ${res.status} ${body}`);
  }
}

export function getApiKeyForAgent(slug: string): string {
  const keys: Record<string, string | undefined> = {
    'demo-translate': process.env.ONLYTRUST_TRANSLATE_API_KEY,
    'demo-summarize': process.env.ONLYTRUST_SUMMARIZE_API_KEY,
    'demo-ask': process.env.ONLYTRUST_ASK_API_KEY,
  };

  const key = keys[slug];
  if (!key) throw new Error(`No API key configured for agent: ${slug}`);
  return key;
}
