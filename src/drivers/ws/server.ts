import Websocket, { server } from "websocket";
import http from "http";
import { Message, messageSchema } from "../../models/message.js";
import { Serializable } from "../../utils/types.js";
import { config } from "../../config.js";

export interface BroadcastServer {
  broadcastMessage: (message: Serializable) => void;
  onMessage: (callback: (message: Message) => void) => void;
}

export const createBroadcastServer = (
  app: Express.Application
): BroadcastServer => {
  const messageCallbacks: ((message: Message) => void)[] = [];

  const httpServer = http.createServer(app);
  const ws = new Websocket.server({
    keepaliveInterval: 10_000,
    keepalive: true,
    httpServer: http.createServer(app),
    autoAcceptConnections: false,
  });

  const processMessage = (message: Message) => {
    messageCallbacks.forEach((callback) => callback(message));
  };

  ws.on("close", (connection, reason, description) => {
    console.log(
      `Connection closed from (${connection.remoteAddress}): ${reason} ${description}`
    );
  });

  ws.on("request", (request) => {
    console.log(`Request from ${request.remoteAddress}`);
    request.accept();
  });

  ws.on("connect", (connection) => {
    connection.on("message", (message) => {
      try {
        const parsedMessage =
          message.type === "utf8"
            ? JSON.parse(message.utf8Data)
            : JSON.parse(Buffer.from(message.binaryData).toString("utf-8"));

        const parsed = messageSchema.safeParse(parsedMessage);
        if (!parsed.success) {
          connection.send(JSON.stringify({ error: "Invalid message" }));
          return;
        }

        processMessage(parsed.data);
      } catch (error) {
        console.error(error);
      }
    });
  });

  ws.mount({ httpServer });

  const onMessage = (callback: (message: Message) => void) => {
    messageCallbacks.push(callback);
  };

  const broadcastMessage = (message: Record<string, unknown>) => {
    ws.broadcast(JSON.stringify(message));
  };

  const port = config.port;
  httpServer.listen(port, () => {
    console.log(`Websocket server running at ws://localhost:${port}`);
  });

  return {
    broadcastMessage,
    onMessage,
  };
};
