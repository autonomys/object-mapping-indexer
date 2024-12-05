import { Handler, NextFunction, Request, Response } from 'express'
import { env } from '../../utils/env.js'

const API_SECRET = env('API_SECRET')

export const authMiddleware: Handler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const header = req.headers.authorization

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

  if (token !== API_SECRET) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  next()
}
