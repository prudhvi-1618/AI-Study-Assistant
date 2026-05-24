import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

export async function splitText(
  text: string,
  options?: { chunkSize?: number; chunkOverlap?: number }
): Promise<string[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: options?.chunkSize ?? 1000,
    chunkOverlap: options?.chunkOverlap ?? 200,
    separators: ['\n\n', '\n', ' ', ''],
  });

  return splitter.splitText(text);
}
