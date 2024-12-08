import { FileResponse } from '../models/file.js'
import {
  blake3HashFromCid,
  stringToCid,
  decodeNode,
  MetadataType,
  cidToString,
  CompressionAlgorithm,
  COMPRESSION_CHUNK_SIZE,
  cidOfNode,
  decompressFile,
} from '@autonomys/auto-dag-data'
import { PBNode } from '@ipld/dag-pb'
import { env } from '../utils/env.js'
import { HttpError } from '../http/middlewares/error.js'
import { safeIPLDDecode } from '../utils/dagData.js'
import mime from 'mime-types'

const SUBSPACE_GATEWAY_URL = env('SUBSPACE_GATEWAY_URL')
const MAX_SIMULTANEOUS_FETCHES = Number(
  env('MAX_SIMULTANEOUS_FETCHES', {
    defaultValue: 10,
  }),
)

const fetchNode = async (cid: string): Promise<PBNode> => {
  const objectMappingHash = Buffer.from(
    blake3HashFromCid(stringToCid(cid)),
  ).toString('hex')
  const response = await fetch(
    `${SUBSPACE_GATEWAY_URL}/data/${objectMappingHash}`,
  )
  if (!response.ok) {
    console.error('Failed to fetch node', response)
    throw new HttpError(500, 'Internal server error: Failed to fetch node')
  }

  const blob = await response.arrayBuffer()

  const node = decodeNode(blob)

  if (cidToString(cidOfNode(node)) !== cid) {
    throw new Error(`Cid mismatch: ${cid} !== ${cidToString(cidOfNode(node))}`)
  }

  return node
}

const createReadStream = (node: PBNode): ReadableStream => {
  const metadata = safeIPLDDecode(node)

  if (metadata?.data) {
    return new ReadableStream({
      start: async (controller) => {
        const asyncIterator = [Buffer.from(metadata.data!)]

        for await (const chunk of asyncIterator) {
          controller.enqueue(chunk)
        }

        controller.close()
      },
    })
  }

  return new ReadableStream({
    start: async (controller) => {
      let requestsPending = node.Links.map(({ Hash }) => cidToString(Hash))
      console.log(`Initial links: ${requestsPending}`)
      while (requestsPending.length > 0) {
        const requestingNodes = requestsPending.slice(
          0,
          MAX_SIMULTANEOUS_FETCHES,
        )

        const nodes = await Promise.all(
          requestingNodes.map(async (e, sortIndex) => ({
            sortIndex,
            node: await fetchNode(e),
          })),
        )

        const sortedNodes = nodes
          .sort((a, b) => a.sortIndex - b.sortIndex)
          .map((e) => e.node)

        let newLinks: string[] = []
        for (const node of sortedNodes) {
          const ipldMetadata = safeIPLDDecode(node)
          if (ipldMetadata?.data) {
            controller.enqueue(ipldMetadata.data)
          } else {
            newLinks = newLinks.concat(
              node.Links.map((e) => cidToString(e.Hash)),
            )
          }
        }

        requestsPending = [
          ...newLinks,
          ...requestsPending.slice(MAX_SIMULTANEOUS_FETCHES),
        ]
      }
      controller.close()
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

  const isCompressedAndNotEncrypted =
    nodeMetadata.uploadOptions?.encryption === undefined &&
    nodeMetadata.uploadOptions?.compression?.algorithm ===
      CompressionAlgorithm.ZLIB

  const data = isCompressedAndNotEncrypted
    ? decompressFile(createReadStream(head), {
        algorithm: CompressionAlgorithm.ZLIB,
        chunkSize: COMPRESSION_CHUNK_SIZE,
        level: 9,
      })
    : createReadStream(head)

  return {
    data,
    size: nodeMetadata.size,
    mimeType: mime.lookup(nodeMetadata.name ?? '') || undefined,
    filename: nodeMetadata.name,
  }
}

export const dsnFetcher = {
  fetchFile,
}
