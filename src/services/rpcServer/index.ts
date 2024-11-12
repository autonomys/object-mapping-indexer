import { WsServer } from '../../drivers/ws/types.js'
import { ObjectMappingListEntry } from '../../models/mapping.js'
import { RpcHandler } from './types.js'
import { logger } from '../../drivers/logger.js'

const serverState: {
  wsServer: WsServer | null
  handlers: RpcHandler[]
} = {
  wsServer: null,
  handlers: [],
}

const init = (broadcastServer: WsServer) => {
  serverState.wsServer = broadcastServer

  serverState.wsServer.onMessage((msg, { connection }) => {
    const handler = serverState.handlers.find(
      (handler) => msg.method === handler.method,
    )
    if (handler) {
      logger.debug(`Passing message to handler: ${msg.method}`)
      handler.handler(msg.params, { connection, messageId: msg.id })
    } else {
      logger.debug(`Received message with unknown method: ${msg.method}`)
      connection.sendUTF(JSON.stringify({ error: 'Method not found' }))
    }
  })
}

export const broadcast = (objectMapping: ObjectMappingListEntry) => {
  if (!serverState.wsServer) {
    throw new Error('Object mapping broadcaster not initialized')
  }

  logger.debug(`Broadcasting object mapping: ${JSON.stringify(objectMapping)}`)
  serverState.wsServer.broadcastMessage(objectMapping)
}

export const addRpcHandler = (handler: RpcHandler) => {
  serverState.handlers.push(handler)
}

export const rpcServer = {
  init,
  broadcast,
  addRpcHandler,
}
