export type FileResponse = {
  data: Buffer | ReadableStream | AsyncIterable<Buffer>
  mimeType?: string
  filename?: string
  size?: bigint
}
