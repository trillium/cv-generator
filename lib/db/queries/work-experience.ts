import { getDb } from "../client";
import type {
  DbWorkExperience,
  DbWorkExperienceBubble,
  DbWorkExperienceLine,
} from "../types";

export async function getWorkExperiences(
  resumeId: number,
): Promise<DbWorkExperience[]> {
  const db = await getDb();
  const query = db.query(
    "SELECT * FROM work_experiences WHERE resume_id = ? ORDER BY order_index",
  );
  return query.all(resumeId) as DbWorkExperience[];
}

export async function getWorkExperienceBubbles(
  workExperienceId: number,
): Promise<DbWorkExperienceBubble[]> {
  const db = await getDb();
  const query = db.query(
    "SELECT * FROM work_experience_bubbles WHERE work_experience_id = ? ORDER BY order_index",
  );
  return query.all(workExperienceId) as DbWorkExperienceBubble[];
}

export async function getWorkExperienceLines(
  workExperienceId: number,
): Promise<DbWorkExperienceLine[]> {
  const db = await getDb();
  const query = db.query(
    "SELECT * FROM work_experience_lines WHERE work_experience_id = ? ORDER BY order_index",
  );
  return query.all(workExperienceId) as DbWorkExperienceLine[];
}
