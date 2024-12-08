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
import { blake3Hash } from '@webbuf/blake3'
import { WebBuf } from '@webbuf/webbuf'
import mime from 'mime-types'

const SUBSPACE_GATEWAY_URL = env('SUBSPACE_GATEWAY_URL')
const MAX_SIMULTANEOUS_FETCHES = Number(
  env('MAX_SIMULTANEOUS_FETCHES', {
    defaultValue: 10,
  }),
)

const fetchNode = async (
  cid: string,
  ignoreCidCheck = false,
): Promise<PBNode> => {
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

  const actualHash = blake3Hash(WebBuf.from(Buffer.from(blob))).toHex()

  if (objectMappingHash !== actualHash) {
    console.log(`Hash mismatch: ${objectMappingHash} !== ${actualHash}`)
  } else {
    console.log(`Hash match: ${objectMappingHash} === ${actualHash}`)
  }

  const node = decodeNode(blob)

  if (!ignoreCidCheck && cidToString(cidOfNode(node)) !== cid) {
    throw new Error(`Cid mismatch: ${cid} !== ${cidToString(cidOfNode(node))}`)
  }

  return node
}

/**
 * Fetches a file as a stream
 *
 * The approach is DFS-like though we use the
 * max simultaneous fetches to speed up the process.
 *
 * @param node - The root node of the file
 * @returns A readable stream of the file
 */
const fetchFileAsStream = (node: PBNode): ReadableStream => {
  const metadata = safeIPLDDecode(node)

  // if a file is a single node (< 64KB) no additional fetching is needed
  if (metadata?.data) {
    return new ReadableStream({
      start: async (controller) => {
        controller.enqueue(Buffer.from(metadata.data!))
        controller.close()
      },
    })
  }

  // if a file is a multi-node file, we need to fetch the nodes in the correct order
  // bearing in mind there might be multiple levels of links, we need to fetch
  // all the links from the root node first and then continue with the next level
  return new ReadableStream({
    start: async (controller) => {
      // for the first iteration, we need to fetch all the links from the root node
      let requestsPending = node.Links.map(({ Hash }) => cidToString(Hash))
      while (requestsPending.length > 0) {
        // for each iteration, we fetch the nodes in batches of MAX_SIMULTANEOUS_FETCHES
        const requestingNodes = requestsPending.slice(
          0,
          MAX_SIMULTANEOUS_FETCHES,
        )

        // we fetch the nodes in parallel
        const nodes = await Promise.all(
          requestingNodes.map(async (e) => await fetchNode(e)),
        )

        let newLinks: string[] = []
        for (const node of nodes) {
          const ipldMetadata = safeIPLDDecode(node)
          // if the node has no links or has data (is the same thing), we write into the stream
          if (ipldMetadata?.data) {
            controller.enqueue(ipldMetadata.data)
          } else {
            // if the node has links, we need to fetch them in the next iteration
            newLinks = newLinks.concat(
              node.Links.map((e) => cidToString(e.Hash)),
            )
          }
        }

        // we update the list of pending requests with the new links
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
    ? decompressFile(fetchFileAsStream(head), {
        algorithm: CompressionAlgorithm.ZLIB,
        chunkSize: COMPRESSION_CHUNK_SIZE,
        level: 9,
      })
    : fetchFileAsStream(head)

  return {
    data,
    size: nodeMetadata.size,
    mimeType: mime.lookup(nodeMetadata.name ?? '') || undefined,
    filename: nodeMetadata.name,
  }
}

export const dsnFetcher = {
  fetchFile,
  fetchNode,
}
