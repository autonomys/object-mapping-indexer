import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.js'
import { fileComposer } from '../../services/fileComposer.js'
import { pipeline } from 'stream'

const fileRouter = Router()

fileRouter.get('/:cid', authMiddleware, async (req, res) => {
  const cid = req.params.cid

  const file = await fileComposer.get(cid)

  if (file.mimeType) {
    res.set('Content-Type', file.mimeType)
  }
  if (file.filename) {
    res.set('Content-Disposition', `attachment; filename="${file.filename}"`)
  }
  if (file.size) {
    res.set('Content-Length', file.size.toString())
  }

  pipeline(file.data, res, (err) => {
    if (err) {
      if (res.headersSent) return
      console.error('Error streaming data:', err)
      res.status(500).json({
        error: 'Failed to stream data',
        details: err.message,
      })
    }
  })
})

export { fileRouter }
