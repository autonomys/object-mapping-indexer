import fsPromises from 'fs/promises'
import { Stream } from 'stream'
import fs from 'fs'
import path from 'path'
import { createCache } from 'cache-manager'
import { writeFile } from '../../utils/fs'
import { BaseCacheConfig } from './types'
import { logger } from '../../drivers/logger'

const BASE_64_BASE = 64
const CHARS_PER_PARTITION = 2

type FileCacheEntry = {
  path: string
  size: number
}

type UncheckedFileCacheEntry = FileCacheEntry | null | undefined

export const createFileCache = (config: BaseCacheConfig) => {
  const cidToFilePath = (cid: string) => {
    const partitions = Math.ceil(
      Math.log(config.targetFilesCount / config.maxFilesPerDirectory) /
        Math.log(BASE_64_BASE) /
        CHARS_PER_PARTITION,
    )

    let filePath = ''
    let head = cid
    for (let i = 0; i < partitions; i++) {
      filePath = path.join(filePath, `${head.slice(-CHARS_PER_PARTITION)}/`)
      head = head.slice(0, -CHARS_PER_PARTITION)
    }
    filePath = path.join(filePath, head)

    return path.join(config.cacheDir, filePath)
  }

  const filepathCache = createCache({
    stores: config.stores,
  })

  const get = async (cid: string): Promise<fs.ReadStream | null> => {
    const data: UncheckedFileCacheEntry = await filepathCache.get(cid)
    if (!data) {
      return null
    }

    return fs.createReadStream(data.path)
  }

  const set = async (cid: string, data: Buffer | Stream) => {
    const filePath = cidToFilePath(cid)

    const cachePromise = filepathCache.set(cid, {
      path: filePath,
    })

    await Promise.all([cachePromise, writeFile(filePath, data)])
  }

  const remove = async (cid: string) => {
    const data: UncheckedFileCacheEntry = await filepathCache.get(cid)
    if (!data) {
      return
    }

    await Promise.all([filepathCache.del(cid), fsPromises.rm(data.path)])
  }

  filepathCache.on('del', async ({ key, error }) => {
    if (error) {
      logger.error(`Error deleting file cache entry for ${key}: ${error}`)
    } else {
      await fsPromises.rm(cidToFilePath(key))
    }
  })

  const cache = {
    get,
    set,
    remove,
  }

  return cache
}
