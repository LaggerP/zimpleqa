/**
 * Cache entry schema
 */

export interface CacheEntry {
  key: string;
  hash: string;
  code: string;
  metadata: CacheEntryMetadata;
  stats: CacheEntryStats;
}

export interface CacheEntryMetadata {
  testPath: string;
  provider: string;
  model: string;
  timestamp: number;
  ttl: number;
}

export interface CacheEntryStats {
  hits: number;
  lastUsed: number;
}
