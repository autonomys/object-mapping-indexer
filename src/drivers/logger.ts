export interface Logger {
  info: (message: string) => Promise<void>;
  error: (message: string) => Promise<void>;
  warn: (message: string) => Promise<void>;
  debug: (message: string) => Promise<void>;
}

export const logger: Logger = {
  info: (message: string) => Promise.resolve(console.log(message)),
  error: (message: string) => Promise.resolve(console.error(message)),
  warn: (message: string) => Promise.resolve(console.warn(message)),
  debug: (message: string) => Promise.resolve(console.debug(message)),
};
