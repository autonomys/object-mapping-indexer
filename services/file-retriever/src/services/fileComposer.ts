import { FileResponse } from '../models/file.js'
import { Keyv } from 'keyv'
import { dsnFetcher } from './dsnFetcher.js'
import { createFileCache } from './fileCache/index.js'
import { LRUCache } from 'lru-cache'
import { forkAsyncIterable } from '../utils/stream.js'
import { stringify } from '@autonomys/auto-utils'
import path from 'path'
import KeyvSqlite from '@keyvhq/sqlite'
import { config } from '../config.js'

const cache = createFileCache({
  cacheDir: path.join(config.cacheDir, 'files'),
  pathPartitions: 3,
  stores: [
    new Keyv({
      serialize: stringify,
      store: new LRUCache<string, string>({
        maxSize: Number(config.cacheMaxSize),
        maxEntrySize: Number.MAX_SAFE_INTEGER,
        sizeCalculation: (value) => {
          const { value: parsedValue } = JSON.parse(value)
          return Number(parsedValue?.size ?? 0)
        },
      }),
    }),
    new Keyv({
      store: new KeyvSqlite({
        uri: path.join(config.cacheDir, 'files.sqlite'),
      }),
      ttl: Number(config.cacheTTL),
      serialize: stringify,
    }),
  ],
})

const get = async (cid: string): Promise<FileResponse> => {
  const cachedFile = await cache.get(cid)
  if (cachedFile) {
    return cachedFile
  }

  const file = await dsnFetcher.fetchFile(cid)

  const [data, cachingStream] = await forkAsyncIterable(file.data)

  // Non-blocking cache set
  cache
    .set(cid, {
      ...file,
      data: cachingStream,
    })
    .catch((e) => {
      console.error('Error caching file', e)
    })

  return {
    ...file,
    data,
  }
}

export const fileComposer = {
  get,
}
