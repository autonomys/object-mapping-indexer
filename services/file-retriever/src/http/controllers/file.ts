import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.js'

const fileRouter = Router()

fileRouter.get('/:cid', authMiddleware, async (req, res) => {
  const cid = req.params.cid

  res.json({ cid })
})

export { fileRouter }
