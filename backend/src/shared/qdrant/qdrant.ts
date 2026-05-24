import { Api } from 'qdrant-client';
import { env } from '../../config/env.js';

export const QdrantClient = new Api({ baseUrl: env.QDRANT_URL });
