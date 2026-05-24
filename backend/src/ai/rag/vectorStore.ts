import { QdrantClient } from '../../shared/qdrant/qdrant.js';
import { Distance } from 'qdrant-client';

export async function upsertPoints(
  collectionName: string,
  points: Array<{ id: string; vector: number[]; payload: Record<string, unknown> }>
): Promise<void> {
  if (points.length === 0) return;

  // Ensure collection exists
  try {
    await QdrantClient.collections.getCollection(collectionName);
  } catch {
    const firstVectorSize = points[0]?.vector?.length || 3072;
    await QdrantClient.collections.createCollection(collectionName, {
      vectors: {
        size: firstVectorSize,
        distance: Distance.Cosine,
      },
    });
  }

  const batchSize = 100;
  for (let i = 0; i < points.length; i += batchSize) {
    const batch = points.slice(i, i + batchSize);
    
    // Construct PointStruct array matching PointStruct interface in qdrant-client
    const pointsData = batch.map(p => ({
      id: p.id,
      vector: p.vector,
      payload: p.payload,
    }));

    await QdrantClient.collections.upsertPoints(collectionName, {
      points: pointsData,
    });
  }
}

export async function deletePointsByFilter(
  collectionName: string,
  filter: { document_id?: string; user_id?: string }
): Promise<void> {
  const qdrantFilter: any = {
    must: [],
  };

  if (filter.document_id) {
    qdrantFilter.must.push({
      key: 'document_id',
      match: { value: filter.document_id },
    });
  }

  if (filter.user_id) {
    qdrantFilter.must.push({
      key: 'user_id',
      match: { value: filter.user_id },
    });
  }

  await QdrantClient.collections.deletePoints(collectionName, {
    filter: qdrantFilter,
  });
}
