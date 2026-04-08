const API_URL = process.env.ONLYTRUST_API_URL || 'https://a2a.onlytrust.ai';

export async function getTask(
  taskId: string,
  apiKey: string
): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_URL}/api/v1/tasks/${taskId}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Get task failed: ${res.status} ${body}`);
  }

  return res.json();
}

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
    'demo-translate': process.env.DEMO_TRANSLATE_API_KEY,
    'demo-summarize': process.env.DEMO_SUMMARIZE_API_KEY,
    'demo-ask': process.env.DEMO_ASK_API_KEY,
  };

  const key = keys[slug];
  if (!key) throw new Error(`No API key configured for agent: ${slug}`);
  return key;
}
