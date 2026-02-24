import { getDb } from '../client'
import type { DbProject, DbProjectBubble, DbProjectLine, DbProjectLink } from '../types'

export async function getProjects(resumeId: number): Promise<DbProject[]> {
  const db = await getDb()
  const query = db.query('SELECT * FROM projects WHERE resume_id = ? ORDER BY order_index')
  return query.all(resumeId) as DbProject[]
}

export async function getProjectBubbles(projectId: number): Promise<DbProjectBubble[]> {
  const db = await getDb()
  const query = db.query('SELECT * FROM project_bubbles WHERE project_id = ? ORDER BY order_index')
  return query.all(projectId) as DbProjectBubble[]
}

export async function getProjectLines(projectId: number): Promise<DbProjectLine[]> {
  const db = await getDb()
  const query = db.query('SELECT * FROM project_lines WHERE project_id = ? ORDER BY order_index')
  return query.all(projectId) as DbProjectLine[]
}

export async function getProjectLinks(projectId: number): Promise<DbProjectLink[]> {
  const db = await getDb()
  const query = db.query('SELECT * FROM project_links WHERE project_id = ? ORDER BY order_index')
  return query.all(projectId) as DbProjectLink[]
}
