import { chatCompletion } from '../groq';

export async function handleAsk(input: { prompt: string }) {
  const systemPrompt = `You are a helpful assistant. Answer the user's question clearly and concisely.
Respond with JSON only, no other text:
{"answer": "...", "model": "llama-3.3-70b-versatile"}`;

  const raw = await chatCompletion(systemPrompt, input.prompt);
  return JSON.parse(raw);
}
