interface RerankableChunk {
  content: string;
  metadata: Record<string, unknown>;
}

function tokenize(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .split(/[^a-z0-9]+/i)
      .filter((token) => token.length > 2)
  );
}

function lexicalScore(queryTerms: Set<string>, content: string): number {
  if (queryTerms.size === 0) {
    return 0;
  }

  const contentTerms = tokenize(content);
  let matches = 0;
  for (const term of queryTerms) {
    if (contentTerms.has(term)) {
      matches += 1;
    }
  }

  return matches / queryTerms.size;
}

export async function rerank<T extends RerankableChunk>(
  query: string,
  chunks: T[],
  options: { topN: number }
): Promise<T[]> {
  const queryTerms = tokenize(query);
  const topN = Math.max(1, options.topN);

  return chunks
    .map((chunk, index) => {
      const vectorScore =
        typeof chunk.metadata.relevance_score === 'number'
          ? chunk.metadata.relevance_score
          : 0;
      return {
        chunk,
        index,
        score: vectorScore + lexicalScore(queryTerms, chunk.content),
      };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, topN)
    .map(({ chunk }) => chunk);
}
