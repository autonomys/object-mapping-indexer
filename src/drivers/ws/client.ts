import Websocket from 'websocket'

type RPCMessage = {
  jsonrpc: string
  method: string
  params: unknown
  id: number
}

export type WS = {
  send: (message: Omit<RPCMessage, 'id'>) => Promise<unknown>
  on: (callback: (event: RPCMessage) => void) => void
  off: (callback: (event: RPCMessage) => void) => void
}

export const createWS = (endpoint: string): WS => {
  const ws = new Websocket.w3cwebsocket(endpoint)
  let onMessageCallbacks: ((event: RPCMessage) => void)[] = []
  const connected: Promise<void> = new Promise((resolve) => {
    ws.onopen = () => {
      console.log(`Connected to WebSocket (${endpoint})`)
      resolve()
    }
  })

  const send = async (message: Omit<RPCMessage, 'id'>) => {
    await connected

    const id = Math.floor(Math.random() * 65546)
    const messageWithID = { ...message, id }

    return new Promise((resolve, reject) => {
      const cb = (event: RPCMessage) => {
        try {
          if (event.id === id) {
            off(cb)
            resolve(event)
          }
        } catch (error) {
          reject(error)
        }
      }
      on(cb)

      ws.send(JSON.stringify(messageWithID))
    })
  }

  ws.onmessage = (event) => {
    onMessageCallbacks.forEach((callback) =>
      callback(JSON.parse(event.data.toString())),
    )
  }

  const on = (callback: (event: RPCMessage) => void) => {
    onMessageCallbacks.push(callback)
  }
  const off = (callback: (event: RPCMessage) => void) => {
    onMessageCallbacks = onMessageCallbacks.filter((cb) => cb !== callback)
  }

  ws.onerror = (event) => {
    const errorDetails = {
      readyState: ws.readyState,
      url: endpoint,
      message: event.message || 'Unknown error',
    }
    console.error('WebSocket connection error:', errorDetails)
  }

  return { send, on, off }
}
