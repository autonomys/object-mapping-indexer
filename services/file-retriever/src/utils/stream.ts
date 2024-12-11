import { PassThrough, Readable } from 'stream'

export async function forkAsyncIterable(
  asyncIterable: AsyncIterable<Buffer>,
): Promise<[Readable, Readable]> {
  const passThrough1 = new PassThrough()
  const passThrough2 = new PassThrough()

  ;(async () => {
    for await (const chunk of asyncIterable) {
      passThrough1.write(chunk)
      passThrough2.write(chunk)
    }
    passThrough1.end()
    passThrough2.end()
  })()

  return [passThrough1, passThrough2]
}
