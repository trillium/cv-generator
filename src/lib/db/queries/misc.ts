import { getDb } from "../client";
import type {
  DbTechnicalCategory,
  DbTechnicalBubble,
  DbEducationRecord,
  DbLanguage,
} from "../types";

export function getTechnicalCategories(
  resumeId: number,
): DbTechnicalCategory[] {
  const db = getDb();
  const query = db.query(
    "SELECT * FROM technical_categories WHERE resume_id = ? ORDER BY order_index",
  );
  return query.all(resumeId) as DbTechnicalCategory[];
}

export function getTechnicalBubbles(categoryId: number): DbTechnicalBubble[] {
  const db = getDb();
  const query = db.query(
    "SELECT * FROM technical_bubbles WHERE technical_category_id = ? ORDER BY order_index",
  );
  return query.all(categoryId) as DbTechnicalBubble[];
}

export function getEducation(resumeId: number): DbEducationRecord[] {
  const db = getDb();
  const query = db.query(
    "SELECT * FROM education_records WHERE resume_id = ? ORDER BY order_index",
  );
  return query.all(resumeId) as DbEducationRecord[];
}

export function getLanguages(resumeId: number): DbLanguage[] {
  const db = getDb();
  const query = db.query(
    "SELECT * FROM languages WHERE resume_id = ? ORDER BY order_index",
  );
  return query.all(resumeId) as DbLanguage[];
}
