import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { env } from '../../config/env.js';

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const apiKey = env.GEMINI_API_KEY || env.GOOGLE_API_KEY;
  
  const embeddings = new GoogleGenerativeAIEmbeddings(
    apiKey ? { apiKey, modelName: env.EMBEDDING_MODEL } : { modelName: env.EMBEDDING_MODEL }
  );

  const batchSize = Number(env.EMBEDDING_BATCH_SIZE) || 100;
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchResults = await embeddings.embedDocuments(batch);
    results.push(...batchResults);
  }

  return results;
}
