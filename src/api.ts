import express from "express";
import cors from "cors";
import { config } from "./config";
import { objectsController } from "./controllers/objects";

const createServer = async () => {
  const app = express();
  const port = Number(process.env.PORT) || 3000;

  // Increase the limit to 10MB (adjust as needed)
  app.use(express.json({ limit: config.requestSizeLimit }));
  app.use(
    express.urlencoded({ limit: config.requestSizeLimit, extended: true })
  );
  config.corsAllowOrigins && app.use(cors({ origin: config.corsAllowOrigins }));

  app.use("/objects", objectsController);

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });

  return app;
};

createServer();
