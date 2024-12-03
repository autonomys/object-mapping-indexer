import { CacheConfig } from './types'
import fsPromises from 'fs/promises'
import { Stream } from 'stream'
import fs from 'fs'
import path from 'path'

export const createFileCache = (config: CacheConfig) => {
  const get = async (cid: string) => {
    const stats = await fsPromises
      .stat(path.join(config.cacheDir, cid))
      .catch(() => null)

    if (!stats) {
      return null
    }

    return fs.createReadStream(path.join(config.cacheDir, cid))
  }

  const set = async (cid: string, data: Buffer | Stream) => {
    const tempFilePath = path.join(config.cacheDir, `${cid}.tmp`)
    await fsPromises.writeFile(tempFilePath, data)
    await fsPromises.rename(tempFilePath, path.join(config.cacheDir, cid))
  }

  return {
    get,
    set,
  }
}
