import { createFileCache } from './services/cache/index.js'

const cache = createFileCache({
  policy: 'lru',
  maxFiles: 1000,
  targetFilesCount: 64 ** 4 * 10_000,
  cacheDir: '/Users/kodai/Desktop/test',
  maxFilesPerDirectory: 10_000,
})

console.log(cache.cidToFilePath('123456789101112131415'))
