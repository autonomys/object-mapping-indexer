import { open, Database } from 'sqlite'
import sqlite3 from 'sqlite3'
import fs from 'fs'
import path from 'path'

let db: Database | null = null

export const getDB = async (
  filename: string = './.cache/metadata.sqlite',
): Promise<Database> => {
  if (db) return db
  db = await initDB(filename)
  return db
}

export const initDB = async (
  filename: string = './.cache/cache.sqlite',
): Promise<Database> => {
  fs.mkdirSync(path.dirname(filename), { recursive: true })

  const db = await open({
    filename,
    driver: sqlite3.Database,
  })

  return db
}
