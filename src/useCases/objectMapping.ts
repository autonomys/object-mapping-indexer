import { config } from '../config.js'
import { logger } from '../drivers/logger.js'
import {
  constructListFromObjectMapping,
  ObjectMappingListEntry,
} from '../models/mapping.js'
import { objectMappingRepository } from '../repositories/objectMapping.js'
import { rpcServer } from '../services/rpcServer/index.js'
import WebSocket from 'websocket'

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

  rpcServer.broadcast(event)
}

const startRecovery = async (
  initialBlockNumber: number,
  finalBlockNumber: number,
  messageSender: (message: string) => void,
) => {
  let currentBlockNumber = initialBlockNumber
  while (currentBlockNumber <= finalBlockNumber) {
    const objectMappings =
      await objectMappingRepository.getByBlockNumber(currentBlockNumber)
    const event = constructListFromObjectMapping(
      objectMappings.map((e) => [e.hash, e.pieceIndex, e.pieceOffset]),
      currentBlockNumber,
    )
    messageSender(JSON.stringify(event))
    logger.info(
      `Sent event for block ${currentBlockNumber}. Waiting ${config.recoveryInterval}ms before next request.`,
    )
    await new Promise((resolve) => setTimeout(resolve, config.recoveryInterval))
    currentBlockNumber++
  }
}

const recoverObjectMappings = async (
  initialBlockNumber: number,
  messageSender: (message: string) => void,
) => {
  const latestBlockNumber = await objectMappingRepository.getLatestBlockNumber()

  startRecovery(
    initialBlockNumber,
    latestBlockNumber.blockNumber,
    messageSender,
  )

  return latestBlockNumber
}

export const objectMappingUseCase = {
  processObjectMapping,
  recoverObjectMappings,
}
