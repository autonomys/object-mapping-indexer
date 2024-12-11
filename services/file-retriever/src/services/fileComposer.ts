import { FileResponse } from '../models/file.js'
import { Keyv } from 'keyv'
import { dsnFetcher } from './dsnFetcher.js'
import { createFileCache } from './fileCache/index.js'
import { LRUCache } from 'lru-cache'
import { env } from '../utils/env.js'
import { forkAsyncIterable } from '../utils/stream.js'
import { stringify } from '@autonomys/auto-utils'
import path from 'path'
import KeyvSqlite from '@keyvhq/sqlite'

const TEN_GB = 10 * 1024 ** 3
const ONE_DAY = 24 * 60 * 60 * 1000

const cacheDir = env('CACHE_DIR', {
  defaultValue: './.cache',
})

const cache = createFileCache({
  cacheDir: path.join(cacheDir, 'files'),
  pathPartitions: 3,
  stores: [
    new Keyv({
      serialize: stringify,
      store: new LRUCache<string, string>({
        maxSize: Number(
          env('CACHE_MAX_SIZE', {
            defaultValue: TEN_GB,
          }),
        ),
        maxEntrySize: Number.MAX_SAFE_INTEGER,
        sizeCalculation: (value) => {
          const { value: parsedValue } = JSON.parse(value)
          return Number(parsedValue?.size ?? 0)
        },
      }),
    }),
    new Keyv({
      store: new KeyvSqlite({
        uri: path.join(cacheDir, 'files.sqlite'),
      }),
      ttl: ONE_DAY,
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

  await cache.set(cid, {
    ...file,
    data: cachingStream,
  })

  return {
    ...file,
    data,
  }
}

export const fileComposer = {
  get,
}
