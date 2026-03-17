/**
 * Cryptographic utilities for hashing and key generation
 */

import { createHash } from 'crypto';

export class HashGenerator {
  /**
   * Generate SHA-256 hash from content
   */
  static generateHash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * Generate cache key from test metadata
   */
  static generateCacheKey(testPath: string, provider: string, model: string): string {
    const combined = `${testPath}-${provider}-${model}`;
    return this.generateHash(combined);
  }

  /**
   * Generate hash from multiple parameters
   */
  static generateMultiHash(...params: string[]): string {
    const combined = params.join('-');
    return this.generateHash(combined);
  }
}
