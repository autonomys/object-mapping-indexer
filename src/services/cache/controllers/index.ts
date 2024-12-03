import { CacheConfig } from '../types'
import {
  getLRUCacheController,
  LRUCacheControllerConfig,
} from './lruController.js'
import { CacheController } from './base.js'

export type CacheControllerConfig = LRUCacheControllerConfig

export const getControllerFromConfig = (
  config: CacheConfig,
): CacheController => {
  switch (config.controller) {
    case 'LRU':
      return getLRUCacheController(config)
    default:
      throw new Error(`Unknown cache controller: ${config.controller}`)
  }
}
