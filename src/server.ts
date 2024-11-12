import "dotenv/config";
import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { objectsController } from "./controllers/objects.js";
import http from "http";
import { createBroadcastServer } from "./drivers/ws/server.js";
import { objectMapiingBroadcaster } from "./services/objectMappingBroadcaster.js";
import { createObjectMappingListener } from "./services/objectMappingListener.js";

const createServer = () => {
  const app = express();
  const port = Number(process.env.PORT) || 3000;

  // Increase the limit to 10MB (adjust as needed)
  app.use(express.json({ limit: config.requestSizeLimit }));
  app.use(
    express.urlencoded({ limit: config.requestSizeLimit, extended: true })
  );
  config.corsAllowOrigins && app.use(cors({ origin: config.corsAllowOrigins }));

  app.use("/objects", objectsController);

  return app;
};

const websocketServer = createBroadcastServer(createServer());

const objectMappingListener = createObjectMappingListener();
objectMappingListener.start();

objectMapiingBroadcaster.init(websocketServer);
