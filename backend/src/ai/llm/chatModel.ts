import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatOpenAI } from '@langchain/openai';
import { env } from '../../config/env.js';

export function createChatModel(options: {
  model: string;
  temperature?: number;
  streaming?: boolean;
}) {
  const googleApiKey = env.GEMINI_API_KEY || env.GOOGLE_API_KEY;
  const openAiApiKey =
    env.OPENAI_API_KEY && !env.OPENAI_API_KEY.startsWith('your_')
      ? env.OPENAI_API_KEY
      : undefined;
  const requestedModel = options.model.toLowerCase();
  const model = requestedModel.startsWith('gemini')
    ? options.model
    : openAiApiKey
      ? options.model
      : 'gemini-3.5-flash';

  const baseFields = {
    model,
    temperature: options.temperature ?? 0,
    ...(typeof options.streaming === 'boolean' ? { streaming: options.streaming } : {}),
  };

  if (model.toLowerCase().startsWith('gemini')) {
    return new ChatGoogleGenerativeAI({
      ...baseFields,
      ...(googleApiKey ? { apiKey: googleApiKey } : {}),
    } as any);
  }

  return new ChatOpenAI({
    ...baseFields,
    apiKey: openAiApiKey,
  });
}
