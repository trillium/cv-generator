import { getDb } from "../client";
import type {
  DbWorkExperience,
  DbWorkExperienceBubble,
  DbWorkExperienceLine,
} from "../types";

export function getWorkExperiences(resumeId: number): DbWorkExperience[] {
  const db = getDb();
  const query = db.query(
    "SELECT * FROM work_experiences WHERE resume_id = ? ORDER BY order_index",
  );
  return query.all(resumeId) as DbWorkExperience[];
}

export function getWorkExperienceBubbles(
  workExperienceId: number,
): DbWorkExperienceBubble[] {
  const db = getDb();
  const query = db.query(
    "SELECT * FROM work_experience_bubbles WHERE work_experience_id = ? ORDER BY order_index",
  );
  return query.all(workExperienceId) as DbWorkExperienceBubble[];
}

export function getWorkExperienceLines(
  workExperienceId: number,
): DbWorkExperienceLine[] {
  const db = getDb();
  const query = db.query(
    "SELECT * FROM work_experience_lines WHERE work_experience_id = ? ORDER BY order_index",
  );
  return query.all(workExperienceId) as DbWorkExperienceLine[];
}
