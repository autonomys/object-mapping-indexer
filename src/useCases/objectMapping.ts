import { ObjectMappingListEntry } from '../models/mapping.js'
import { objectMappingRepository } from '../repositories/objectMapping.js'
import { blake3HashFromCid, stringToCid } from '@autonomys/auto-dag-data'
import { objectMappingRouter } from '../services/objectMappingRouter/index.js'

const processObjectMapping = async (event: ObjectMappingListEntry) => {
  await Promise.all([
    objectMappingRepository.saveObjectMappings(
      event.v0.objects.map((e) => ({
        hash: e[0],
        pieceIndex: e[1],
        pieceOffset: e[2],
        blockNumber: event.blockNumber,
      })),
    ),
  ])

  objectMappingRouter.emitObjectMappings(event)
}

const getObject = async (cid: string) => {
  const hash = Buffer.from(blake3HashFromCid(stringToCid(cid))).toString('hex')
  const objectMapping = await objectMappingRepository.getByHash(hash)

  return objectMapping
}

const getObjectByBlock = async (blockNumber: number) => {
  return objectMappingRepository.getByBlockNumber(blockNumber)
}

export const objectMappingUseCase = {
  processObjectMapping,
  getObject,
  getObjectByBlock,
}
