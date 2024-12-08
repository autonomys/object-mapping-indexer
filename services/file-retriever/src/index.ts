import 'dotenv/config'
import express, { Application } from 'express'
import cors from 'cors'
import { env } from './utils/env.js'
import { fileRouter } from './http/controllers/file.js'

const app: Application = express()

app.use(
  cors({
    origin: env('CORS_ORIGIN', {
      defaultValue: '*',
    }),
  }),
)

app.use('/files', fileRouter)

const port = Number(env('FILE_RETRIEVER_PORT', { defaultValue: 8090 }))

app.listen(port, () => {
  console.log(`File retriever service is running on port ${port}`)
})
