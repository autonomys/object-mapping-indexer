import Websocket from 'websocket'
import { Message, messageSchema } from '../../models/message.js'
import { config } from '../../config.js'
import { logger } from '../logger.js'
import { MessageCallback, WsServer } from './types.js'
import http from 'http'

export const createWsServer = (app: Express.Application): WsServer => {
  const messageCallbacks: MessageCallback[] = []

  const httpServer = http.createServer(app)
  const ws = new Websocket.server({
    keepaliveInterval: 10_000,
    keepalive: true,
    httpServer: http.createServer(app),
    autoAcceptConnections: false,
  })

  const processMessage = (
    message: Message,
    connection: Websocket.connection,
  ) => {
    messageCallbacks.forEach((callback) => callback(message, { connection }))
  }

  ws.on('close', (connection, reason, description) => {
    logger.debug(
      `Connection closed from (${connection.remoteAddress}): ${reason} ${description}`,
    )
  })

  ws.on('request', (req) => {
    req.accept()
  })

  ws.on('connect', (connection) => {
    connection.on('message', (message) => {
      try {
        const parsedMessage =
          message.type === 'utf8'
            ? JSON.parse(message.utf8Data)
            : JSON.parse(Buffer.from(message.binaryData).toString('utf-8'))

        const parsed = messageSchema.safeParse(parsedMessage)
        if (!parsed.success) {
          connection.send(JSON.stringify({ error: 'Invalid message' }))
          return
        }

        processMessage(parsed.data, connection)
      } catch (error) {
        console.error(error)
      }
    })
  })

  ws.mount({ httpServer })

  const onMessage = (callback: MessageCallback) => {
    messageCallbacks.push(callback)
  }

  const broadcastMessage = (message: Record<string, unknown>) => {
    ws.broadcast(JSON.stringify(message))
  }

  const port = config.port
  httpServer.listen(port, () => {
    logger.info(`Websocket server running at ws://localhost:${port}`)
  })

  return {
    broadcastMessage,
    onMessage,
  }
}
