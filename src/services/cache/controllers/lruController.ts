import { cacheRegistryRepository } from '../../../repositories/cache/registry.js'
import { FileCache } from '../types.js'
import { CacheController } from './base.js'

export interface LRUCacheControllerConfig {
  controller: 'LRU'
  maxFiles: number
}

export const getLRUCacheController = (
  config: LRUCacheControllerConfig,
): CacheController => {
  const handleGet = async (cache: FileCache, cid: string) => {
    await cacheRegistryRepository.add(cid, new Date())
  }

  const handleSet = async (cache: FileCache, cid: string) => {
    await cacheRegistryRepository.add(cid, new Date())

    const cachedFilesCount = await cacheRegistryRepository.getTotalCount()
    if (cachedFilesCount > config.maxFiles) {
      const leastRecentAccessedCID =
        await cacheRegistryRepository.getLeastRecent()

      await cache.remove(leastRecentAccessedCID)
      await cacheRegistryRepository.remove(leastRecentAccessedCID)
    }
  }

  return {
    handleGet,
    handleSet,
  }
}
