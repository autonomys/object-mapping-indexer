import { FileCache } from '../types'

export interface CacheController {
  handleGet: (cache: FileCache, cid: string) => Promise<void>
  handleSet: (cache: FileCache, cid: string) => Promise<void>
}
