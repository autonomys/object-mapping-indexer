import Websocket from 'websocket'

export interface RpcHandler {
  method: string
  handler: (
    params: unknown[],
    connection: { connection: Websocket.connection; messageId: number },
  ) => void
}
