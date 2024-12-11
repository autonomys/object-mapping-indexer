import 'dotenv/config'
import fs from 'fs'
import { dsnFetcher } from './src/services/dsnFetcher.js'

const file = await fetch(
  'http://127.0.0.1:8090/files/bafkr6ifmvvcuuhyytms3qyxjmuz362spm3jfzf72gtgs2cgvlzjpbc6xle',
  {
    headers: {
      Authorization: 'Bearer secret',
    },
  },
)

console.log(
  await file.arrayBuffer().then((buffer) => Buffer.from(buffer).toString()),
)
