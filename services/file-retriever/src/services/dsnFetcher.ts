import { FileResponse } from '../models/file.js'
import {
  blake3HashFromCid,
  stringToCid,
  decodeNode,
  MetadataType,
  cidToString,
} from '@autonomys/auto-dag-data'
import { PBNode } from '@ipld/dag-pb'
import { env } from '../utils/env.js'
import { HttpError } from '../http/middlewares/error.js'
import { safeIPLDDecode } from '../utils/dagData.js'
import mime from 'mime-types'

const SUBSPACE_GATEWAY_URL = env('SUBSPACE_GATEWAY_URL')
const MAX_SIMULTANEOUS_FETCHES = 10

const fetchNode = async (cid: string): Promise<PBNode> => {
  const objectMappingHash = blake3HashFromCid(stringToCid(cid))
  const response = await fetch(
    `${SUBSPACE_GATEWAY_URL}/objects/${objectMappingHash}`,
  )
  if (!response.ok) {
    throw new HttpError(500, 'Internal server error: Failed to fetch node')
  }

  const blob = await response.arrayBuffer()

  return decodeNode(blob)
}

const createReadStream = (node: PBNode): ReadableStream => {
  const metadata = safeIPLDDecode(node)
  if (metadata?.data) {
    return new ReadableStream({
      start: async (controller) => {
        controller.enqueue(metadata.data)
        controller.close()
      },
    })
  }

  return new ReadableStream({
    start: async (controller) => {
      let requestsPending = node.Links.map(({ Hash }) => cidToString(Hash))
      while (requestsPending.length > 0) {
        const requestingNodes = requestsPending.slice(
          0,
          MAX_SIMULTANEOUS_FETCHES,
        )

        const nodes = await Promise.all(
          requestingNodes.map((e) => fetchNode(e)),
        )

        const links = nodes
          .map((e) => {
            const ipldMetadata = safeIPLDDecode(e)

            if (ipldMetadata?.type === MetadataType.FileChunk) {
              controller.enqueue(ipldMetadata.data)
              return []
            } else {
              return e.Links.map((e) => cidToString(e.Hash))
            }
          })
          .flat()

        requestsPending = [
          ...links,
          ...requestsPending.slice(MAX_SIMULTANEOUS_FETCHES),
        ]
      }
    },
  })
}

const fetchFile = async (cid: string): Promise<FileResponse> => {
  const head = await fetchNode(cid)
  const nodeMetadata = safeIPLDDecode(head)

  if (!nodeMetadata) {
    throw new HttpError(400, 'Bad request: Not a valid auto-dag-data IPLD node')
  }
  if (nodeMetadata?.type !== MetadataType.File) {
    throw new HttpError(400, 'Bad request: Not a file')
  }

  return {
    data: createReadStream(head),
    size: nodeMetadata.size,
    mimeType: mime.lookup(nodeMetadata.name ?? '') || undefined,
    filename: nodeMetadata.name,
  }
}

export const dsnFetcher = {
  fetchFile,
}
