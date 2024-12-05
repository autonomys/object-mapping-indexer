import 'dotenv/config.js'
import express from 'express'
import cors from 'cors'
import { config } from './config.js'
import { objectsController } from './controllers/objects.js'
import { createWsServer } from './drivers/ws/server.js'
import { rpcServer } from './drivers/rpcServer/index.js'
import { createObjectMappingListener } from './services/objectMappingListener/index.js'

const createServer = () => {
  const app = express()

  // Increase the limit to 10MB (adjust as needed)
  app.use(express.json({ limit: config.requestSizeLimit }))
  app.use(
    express.urlencoded({ limit: config.requestSizeLimit, extended: true }),
  )
  if (config.corsAllowOrigins) {
    app.use(cors({ origin: config.corsAllowOrigins }))
  }

  app.use('/objects', objectsController)

  return app
}

const expressServer = createServer()
const objectMappingListener = createObjectMappingListener()
const websocketServer = createWsServer(expressServer)

objectMappingListener.start()
rpcServer.init(websocketServer)
