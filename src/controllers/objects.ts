import express from 'express'
import { rpcServer } from '../services/rpcServer/index.js'
import { objectMappingUseCase } from '../useCases/objectMapping.js'
import z from 'zod'
import { logger } from '../drivers/logger.js'

export const objectsController = express.Router()

objectsController.get('/:cid', async (req, res) => {
  const { cid } = req.params

  if (!cid) {
    res.status(400).json({ error: 'Missing cid' })
    return
  }

  const object = await objectMappingUseCase.getObject(cid)

  res.json(object)

  return
})

objectsController.get('/by-block/:blockNumber', async (req, res) => {
  const { blockNumber } = req.params

  const parsedBlockNumber = parseInt(blockNumber)
  if (!blockNumber || isNaN(parsedBlockNumber)) {
    res.status(400).json({ error: 'Missing or invalid blockNumber' })
    return
  }

  const objects = await objectMappingUseCase.getObjectByBlock(parsedBlockNumber)

  res.json(objects)
})

rpcServer.addRpcHandler({
  method: 'recover_object_mappings',
  handler: async (params, { connection, messageId }) => {
    const { data } = z.object({ blockNumber: z.number() }).safeParse(params)
    if (!data) {
      connection.sendUTF(JSON.stringify({ error: 'Missing blockNumber' }))
      return
    }

    await objectMappingUseCase.recoverObjectMappings(
      data.blockNumber,
      (message) => connection.sendUTF(message),
    )

    connection.sendUTF(JSON.stringify({ success: true, id: messageId }))
  },
})

logger.info('Object controller initialized')
