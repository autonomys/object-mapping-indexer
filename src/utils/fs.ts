import fsPromises from 'fs/promises'
import path from 'path'
import { Stream } from 'stream'

export const writeFile = async (
  filepath: string,
  data: Buffer | Stream,
  ensureDirectoryExistance: boolean = true,
) => {
  const tempFilePath = `${filepath}.tmp`

  if (ensureDirectoryExistance) {
    await fsPromises.mkdir(path.dirname(tempFilePath), { recursive: true })
  }

  await fsPromises.writeFile(tempFilePath, data)
  await fsPromises.rename(tempFilePath, filepath)
}
