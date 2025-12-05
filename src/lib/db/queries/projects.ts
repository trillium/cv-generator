import { getDb } from "../client";
import type {
  DbProject,
  DbProjectBubble,
  DbProjectLine,
  DbProjectLink,
} from "../types";

export function getProjects(resumeId: number): DbProject[] {
  const db = getDb();
  const query = db.query(
    "SELECT * FROM projects WHERE resume_id = ? ORDER BY order_index",
  );
  return query.all(resumeId) as DbProject[];
}

export function getProjectBubbles(projectId: number): DbProjectBubble[] {
  const db = getDb();
  const query = db.query(
    "SELECT * FROM project_bubbles WHERE project_id = ? ORDER BY order_index",
  );
  return query.all(projectId) as DbProjectBubble[];
}

export function getProjectLines(projectId: number): DbProjectLine[] {
  const db = getDb();
  const query = db.query(
    "SELECT * FROM project_lines WHERE project_id = ? ORDER BY order_index",
  );
  return query.all(projectId) as DbProjectLine[];
}

export function getProjectLinks(projectId: number): DbProjectLink[] {
  const db = getDb();
  const query = db.query(
    "SELECT * FROM project_links WHERE project_id = ? ORDER BY order_index",
  );
  return query.all(projectId) as DbProjectLink[];
}
