import { ObjectMappingListEntry } from '../models/mapping.js'
import { objectMappingRepository } from '../repositories/objectMapping.js'
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

const getObject = async (hash: string) => {
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
