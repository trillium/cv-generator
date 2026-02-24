import path from 'node:path'

// biome-ignore lint/suspicious/noExplicitAny: database instance type unknown
let dbInstance: any = null

export async function getDb() {
  if (!dbInstance) {
    const { Database } = await import('bun:sqlite')
    const dbPath = path.join(process.cwd(), 'pii', 'db.sqlite')
    dbInstance = new Database(dbPath)
    dbInstance.exec('PRAGMA foreign_keys = ON')
  }
  return dbInstance
}

export function closeDb(): void {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
}
