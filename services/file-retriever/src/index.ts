import 'dotenv/config'
import express, { Application } from 'express'
import cors from 'cors'
import { fileRouter } from './http/controllers/file.js'
import { nodeRouter } from './http/controllers/node.js'
import { config } from './config.js'

const app: Application = express()

if (config.corsOrigin) {
  app.use(cors({ origin: config.corsOrigin }))
}

app.use('/files', fileRouter)
app.use('/nodes', nodeRouter)

app.listen(config.port, () => {
  console.log(`File retriever service is running on port ${config.port}`)
})
