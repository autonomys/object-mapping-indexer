export type FileResponse = {
  data: AsyncIterable<Buffer>
  mimeType?: string
  filename?: string
  size?: bigint
}
