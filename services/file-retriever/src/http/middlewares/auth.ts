import { Handler, NextFunction, Request, Response } from 'express'
import { config } from '../../config.js'

export const authMiddleware: Handler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const header =
    typeof req.query.api_key === 'string'
      ? req.query.api_key
      : req.headers.authorization

  if (!header) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  // Extract 'Bearer $token'
  const token = header.split(' ')[1]
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  if (token !== config.apiSecret) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  next()
}
