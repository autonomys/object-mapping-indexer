import Websocket from "websocket";

type RPCMessage = {
  jsonrpc: string;
  method: string;
  params: any[] | Record<string, any>;
  id: number;
};

export type WS = {
  send: (message: Omit<RPCMessage, "id">) => Promise<any>;
  on: (callback: (event: RPCMessage) => void) => void;
  off: (callback: (event: RPCMessage) => void) => void;
};

export const createWS = (endpoint: string): WS => {
  let ws = new Websocket.w3cwebsocket(endpoint);
  let onMessageCallbacks: ((event: RPCMessage) => void)[] = [];
  let connected: Promise<true> = new Promise((resolve) => {
    ws.onopen = () => {
      console.log(`Connected to WebSocket (${endpoint})`);
      resolve(true);
    };
  });

  const send = async (message: Omit<RPCMessage, "id">) => {
    await connected;

    const id = Math.floor(Math.random() * 65546);
    const messageWithID = { ...message, id };

    return new Promise((resolve, reject) => {
      const cb = (event: RPCMessage) => {
        try {
          if (event.id === id) {
            off(cb);
            resolve(event);
          }
        } catch (error) {
          reject(error);
        }
      };
      on(cb);

      ws.send(JSON.stringify(messageWithID));
    });
  };

  ws.onmessage = (event) => {
    onMessageCallbacks.forEach((callback) =>
      callback(JSON.parse(event.data.toString()))
    );
  };

  const on = (callback: (event: RPCMessage) => void) => {
    onMessageCallbacks.push(callback);
  };
  const off = (callback: (event: RPCMessage) => void) => {
    onMessageCallbacks = onMessageCallbacks.filter((cb) => cb !== callback);
  };

  ws.onerror = (event) => {
    console.error(`WebSocket error: ${event}`);
  };

  return { send, on, off };
};
