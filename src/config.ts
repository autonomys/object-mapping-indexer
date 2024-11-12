import { env, notNaN } from './utils/env.js'

export const config = {
  port: env('PORT', '3000'),
  requestSizeLimit: env('REQUEST_SIZE_LIMIT', '200mb'),
  corsAllowOrigins: env('CORS_ALLOW_ORIGINS', ''),
  rpcUrl: env('RPC_URL'),
  recoveryInterval: notNaN(Number(env('RECOVERY_INTERVAL', '10'))),
}
