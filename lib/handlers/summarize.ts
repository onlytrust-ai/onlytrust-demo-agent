import { chatCompletion } from '../groq';

export async function handleSummarize(input: {
  text: string;
  max_sentences?: number;
}) {
  const limit = input.max_sentences || 3;
  const systemPrompt = `You are a summarizer. Summarize the user's text in ${limit} sentences or fewer.
Respond with JSON only, no other text:
{"summary": "...", "key_points": ["point 1", "point 2", ...], "word_count": number}`;

  const raw = await chatCompletion(systemPrompt, input.text);
  return JSON.parse(raw);
}
