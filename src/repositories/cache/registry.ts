import { getDB } from '../../drivers/sqlite.js'
import { Keyv } from 'keyv'
import { createCache } from 'cache-manager'

const cache = createCache({
  stores: [new Keyv()],
})

const registry = {
  initialized: false,
}

const ensureTable = async () => {
  const db = await getDB()
  if (registry.initialized) {
    return db
  }

  await db.exec(`
    CREATE TABLE IF NOT EXISTS cache_registry (
      cid TEXT PRIMARY KEY,
      date TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_date ON cache_registry (date);
  `)
  registry.initialized = true

  return db
}

const add = async (cid: string, date: Date) => {
  const db = await ensureTable()
  await db.run(
    'INSERT OR REPLACE INTO cache_registry (cid, date) VALUES (?, ?)',
    [cid, date],
  )
}

const remove = async (cid: string) => {
  const db = await ensureTable()
  await db.run('DELETE FROM cache_registry WHERE cid = ?', [cid])
}

const getLeastRecent = async () => {
  const db = await ensureTable()
  const row = await db.get(
    'SELECT cid FROM cache_registry ORDER BY date ASC LIMIT 1',
  )

  return row ? row.cid : null
}

const getTotalCount = async () => {
  const db = await ensureTable()
  const count = await db.get('SELECT COUNT(*) as count FROM cache_registry')
  return count ? count.count : 0
}

export const cacheRegistryRepository = {
  add,
  remove,
  getLeastRecent,
  getTotalCount,
}
