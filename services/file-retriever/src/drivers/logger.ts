import { createLogger, format, transports } from 'winston'
import { config } from '../config.js'

export interface Logger {
  info: (message: string) => Promise<void>
  error: (message: string) => Promise<void>
  warn: (message: string) => Promise<void>
  debug: (message: string) => Promise<void>
}

const winstonLogger = createLogger({
  level: config.logLevel,
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console()],
})

export const logger: Logger = {
  info: async (message: string) => {
    winstonLogger.info(message)
  },
  error: async (message: string) => {
    winstonLogger.error(message)
  },
  warn: async (message: string) => {
    winstonLogger.warn(message)
  },
  debug: async (message: string) => {
    winstonLogger.debug(message)
  },
}
