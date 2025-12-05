import { Database } from "bun:sqlite";
import path from "path";

let dbInstance: Database | null = null;

export function getDb(): Database {
  if (!dbInstance) {
    const dbPath = path.join(process.cwd(), "pii", "db.sqlite");
    dbInstance = new Database(dbPath);
    dbInstance.exec("PRAGMA foreign_keys = ON");
  }
  return dbInstance;
}

export function closeDb(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
