import { FileCache } from '../types'
import { CacheController } from './base'

export interface LRUCacheControllerConfig {
  controller: 'LRU'
  maxFiles: number
}

export const getLRUCacheController = (
  config: LRUCacheControllerConfig,
): CacheController => {
  const accessHistory: Map<string, Date> = new Map()

  const handleGet = async (cache: FileCache, cid: string) => {
    accessHistory.set(cid, new Date())
  }

  const handleSet = async (cache: FileCache, cid: string) => {
    accessHistory.set(cid, new Date())

    if (accessHistory.size > config.maxFiles) {
      const entries = Array.from(accessHistory.entries())

      const cidSortedByAccessTime = entries
        .sort((a, b) => a[1].getTime() - b[1].getTime())
        .map(([cid]) => cid)

      const [leastRecentAccessedCID] = cidSortedByAccessTime
      accessHistory.delete(leastRecentAccessedCID)

      await cache.remove(leastRecentAccessedCID)
    }
  }

  return {
    handleGet,
    handleSet,
  }
}
