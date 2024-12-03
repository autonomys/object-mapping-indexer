import { CacheConfig } from './types'
import fsPromises from 'fs/promises'
import { Stream } from 'stream'
import fs from 'fs'
import path from 'path'

const BASE_64_BASE = 64
const CHARS_PER_PARTITION = 2

export const createFileCache = (config: CacheConfig) => {
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

  const get = async (cid: string) => {
    const stats = await fsPromises.stat(cidToFilePath(cid)).catch(() => null)

    if (!stats) {
      return null
    }

    return fs.createReadStream(path.join(config.cacheDir, cidToFilePath(cid)))
  }

  const set = async (cid: string, data: Buffer | Stream) => {
    const filePath = cidToFilePath(cid)
    const tempFilePath = `${filePath}.tmp`

    await fsPromises.writeFile(tempFilePath, data)
    await fsPromises.rename(tempFilePath, filePath)
  }

  return {
    get,
    set,
    cidToFilePath,
  }
}
