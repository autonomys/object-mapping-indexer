import { v4 } from 'uuid'
import Websocket from 'websocket'
import {
  constructListFromObjectMapping,
  ObjectMappingListEntry,
} from '../../models/mapping.js'
import { objectMappingUseCase } from '../../useCases/objectMapping.js'
import { config } from '../../config.js'
import { logger } from '../../drivers/logger.js'

type RouterState = {
  objectMappingsSubscriptions: Map<string, Websocket.connection>
  recoverObjectMappingsSubscriptions: Map<
    string,
    { connection: Websocket.connection; blockNumber: number }
  >
}

const state: RouterState = {
  objectMappingsSubscriptions: new Map(),
  recoverObjectMappingsSubscriptions: new Map(),
}

const subscribeObjectMappings = (connection: Websocket.connection) => {
  const subscriptionId = v4()
  logger.info(`IP (${connection.remoteAddress}) subscribing to object mappings`)
  state.objectMappingsSubscriptions.set(subscriptionId, connection)
  return subscriptionId
}

const unsubscribeObjectMappings = (subscriptionId: string) => {
  const connection = state.objectMappingsSubscriptions.get(subscriptionId)
  if (connection) {
    logger.info(
      `IP (${connection.remoteAddress}) unsubscribing from object mappings: ${subscriptionId}`,
    )
    state.objectMappingsSubscriptions.delete(subscriptionId)
  }
}

const emitObjectMappings = (event: ObjectMappingListEntry) => {
  Array.from(state.objectMappingsSubscriptions.entries()).forEach(
    ([subscriptionId, connection]) => {
      if (connection.socket.readyState === 'open') {
        connection.sendUTF(
          JSON.stringify({
            subscriptionId,
            result: event,
          }),
        )
      } else {
        logger.warn(
          `IP (${connection.remoteAddress}) object mappings subscription ${subscriptionId} socket is ${connection.socket.readyState}`,
        )
        logger.debug(
          `Removing subscription ${subscriptionId} from object mappings`,
        )
        state.objectMappingsSubscriptions.delete(subscriptionId)
      }
    },
  )
}

const subscribeRecoverObjectMappings = (
  connection: Websocket.connection,
  blockNumber: number,
) => {
  logger.info(
    `IP (${connection.remoteAddress}) subscribing to recover object mappings`,
  )
  const subscriptionId = v4()
  state.recoverObjectMappingsSubscriptions.set(subscriptionId, {
    connection,
    blockNumber,
  })

  return subscriptionId
}

const unsubscribeRecoverObjectMappings = (subscriptionId: string) => {
  const wasSubscribed =
    state.recoverObjectMappingsSubscriptions.has(subscriptionId)
  if (wasSubscribed) {
    const { connection } =
      state.recoverObjectMappingsSubscriptions.get(subscriptionId)!
    logger.info(
      `IP (${connection.remoteAddress}) unsubscribing from recover object mappings: ${subscriptionId}`,
    )
    state.recoverObjectMappingsSubscriptions.delete(subscriptionId)
  }
}

const emitRecoverObjectMappings = async () => {
  const recovering = Array.from(
    state.recoverObjectMappingsSubscriptions.entries(),
  )

  const promises = recovering.map(
    async ([subscriptionId, { connection, blockNumber }]) => {
      logger.debug(`Emitting recover object mappings for ${subscriptionId}`)
      const objectMappings =
        await objectMappingUseCase.getObjectByBlock(blockNumber)
      state.recoverObjectMappingsSubscriptions.set(subscriptionId, {
        connection,
        blockNumber: blockNumber + 1,
      })
      const result = constructListFromObjectMapping(
        objectMappings.map((e) => [e.hash, e.pieceIndex, e.pieceOffset]),
        blockNumber,
      )
      connection.sendUTF(JSON.stringify({ subscriptionId, result }))
    },
  )

  await Promise.all(promises)
}

const recoveryLoop = async () => {
  await emitRecoverObjectMappings()
  setTimeout(recoveryLoop, config.recoveryInterval)
}

setTimeout(recoveryLoop)

export const objectMappingRouter = {
  subscribeObjectMappings,
  unsubscribeObjectMappings,
  emitObjectMappings,
  subscribeRecoverObjectMappings,
  unsubscribeRecoverObjectMappings,
}
