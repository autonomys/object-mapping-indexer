import 'dotenv/config'
import { createFileCache } from './services/cache/index.js'
import { createCache } from 'cache-manager'
import { Keyv } from 'keyv'
import { LRUCache } from 'lru-cache'

const cache = createFileCache({
  controller: 'LRU',
  maxFiles: 1,
  targetFilesCount: 64 ** 4 * 10_000,
  cacheDir: './.cache/files',
  maxFilesPerDirectory: 10_000,
})

async function main() {
  const keyv = new Keyv({ store: new LRUCache({ maxSize: 1, ttl: 60_000 }) })

  const cache = createCache({ stores: [keyv] })

  await cache.set('123', 'test')
  await cache.set('124', 'test')

  console.log(await cache.get('123'))
  console.log(await cache.get('124'))
}

main()
