import { FileResponse } from '../models/file.js'
import { dsnFetcher } from './dsnFetcher.js'

const get = async (cid: string): Promise<FileResponse> => {
  // TODO: Implement cache logic

  return dsnFetcher.fetchFile(cid)
}

export const fileComposer = {
  get,
}
