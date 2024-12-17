import { env } from './utils/env'

const TEN_GB = 10 * 1024 ** 3
const ONE_DAY = 24 * 60 * 60 * 1000

export const config = {
  logLevel: env('LOG_LEVEL', { defaultValue: 'info' }),
  corsOrigin: env('CORS_ORIGIN', { defaultValue: '*' }),
  port: env('FILE_RETRIEVER_PORT', { defaultValue: 8090 }),
  apiSecret: env('API_SECRET'),
  subspaceGatewayUrl: env('SUBSPACE_GATEWAY_URL'),
  maxSimultaneousFetches: Number(
    env('MAX_SIMULTANEOUS_FETCHES', {
      defaultValue: 10,
    }),
  ),
  cacheDir: env('CACHE_DIR', { defaultValue: './.cache' }),
  cacheMaxSize: env('CACHE_MAX_SIZE', { defaultValue: TEN_GB }),
  cacheTTL: env('CACHE_TTL', { defaultValue: ONE_DAY }),
}
