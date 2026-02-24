import { getDb } from '../client'
import type {
  DbEducationRecord,
  DbLanguage,
  DbTechnicalBubble,
  DbTechnicalCategory,
} from '../types'

export async function getTechnicalCategories(resumeId: number): Promise<DbTechnicalCategory[]> {
  const db = await getDb()
  const query = db.query(
    'SELECT * FROM technical_categories WHERE resume_id = ? ORDER BY order_index',
  )
  return query.all(resumeId) as DbTechnicalCategory[]
}

export async function getTechnicalBubbles(categoryId: number): Promise<DbTechnicalBubble[]> {
  const db = await getDb()
  const query = db.query(
    'SELECT * FROM technical_bubbles WHERE technical_category_id = ? ORDER BY order_index',
  )
  return query.all(categoryId) as DbTechnicalBubble[]
}

export async function getEducation(resumeId: number): Promise<DbEducationRecord[]> {
  const db = await getDb()
  const query = db.query('SELECT * FROM education_records WHERE resume_id = ? ORDER BY order_index')
  return query.all(resumeId) as DbEducationRecord[]
}

export async function getLanguages(resumeId: number): Promise<DbLanguage[]> {
  const db = await getDb()
  const query = db.query('SELECT * FROM languages WHERE resume_id = ? ORDER BY order_index')
  return query.all(resumeId) as DbLanguage[]
}
