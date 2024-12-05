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

app.use(fileRouter)

app.listen(Number(env('PORT', { defaultValue: 3000 })), () => {
  console.log(`File retriever service is running on port ${env('PORT')}`)
})
