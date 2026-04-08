import { chatCompletion } from '../groq';

export async function handleTranslate(input: {
  text: string;
  target_language: string;
}) {
  const systemPrompt = `You are a translator. Translate the user's text to ${input.target_language}.
Respond with JSON only, no other text:
{"translated_text": "...", "source_language": "detected source language", "target_language": "${input.target_language}"}`;

  const raw = await chatCompletion(systemPrompt, input.text);
  return JSON.parse(raw);
}
