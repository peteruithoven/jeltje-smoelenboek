import type { DatabaseSync } from 'node:sqlite'
import { openDatabase } from '../lib/database'

let db: DatabaseSync | undefined

export function useDb(): DatabaseSync {
  if (!db) db = openDatabase(useRuntimeConfig().dataDir)
  return db
}
