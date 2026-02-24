declare module 'bun:sqlite' {
  export class Database {
    constructor(path: string)
    exec(sql: string): void
    query(sql: string): {
      all(...params: unknown[]): Record<string, unknown>[]
      get(...params: unknown[]): Record<string, unknown> | null
    }
    close(): void
  }
}
