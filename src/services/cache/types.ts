export interface BaseCacheConfig {
  estimatedTotalSize: number
  cacheDir: string
  maxFilesPerDirectory: number
}

export interface LRUCacheConfig extends BaseCacheConfig {
  policy: 'lru'
  maxFiles: number
}

export type CacheConfig = LRUCacheConfig
