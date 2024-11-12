import { Message } from '../../models/message'
import Websocket from 'websocket'
import { Serializable } from '../../utils/types'

export interface WsServer {
  broadcastMessage: (message: Serializable) => void
  onMessage: (cb: MessageCallback) => void
}

export type MessageCallback = (
  message: Message,
  connection: { connection: Websocket.connection },
) => void
