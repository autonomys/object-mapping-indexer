import http from 'http'

export const requestToJSON = (request: http.IncomingMessage) => {
  return new Promise((resolve, reject) => {
    let body = ''

    request.on('data', (chunk: Buffer) => {
      console.log('chunk', chunk.toString())
      body += chunk.toString()
    })

    request.on('end', (...params) => {
      console.log('end', params)
      resolve(JSON.parse(body))
    })
  })
}
