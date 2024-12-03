import { Stream } from 'stream'
import { CacheControllerConfig } from './controllers'

export interface BaseCacheConfig {
  targetFilesCount: number
  cacheDir: string
  maxFilesPerDirectory: number
}

export interface LRUCacheConfig extends BaseCacheConfig {
  controller: 'lru'
  maxFiles: number
}

export type CacheConfig = BaseCacheConfig & CacheControllerConfig

export interface FileCache {
  get: (cid: string) => Promise<Buffer | Stream | null>
  set: (cid: string, data: Buffer | Stream) => Promise<void>
  remove: (cid: string) => Promise<void>
}
