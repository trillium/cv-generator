import { getDb } from "../client";
import type {
  DbResume,
  DbHeader,
  DbHeaderResumeLine,
  DbHeaderTitleLine,
  DbProfile,
  DbProfileLine,
  DbProfileLink,
  DbCareerSummaryItem,
  DbCoverLetterLine,
} from "../types";

export function getResume(resumeId: number): DbResume | null {
  const db = getDb();
  const query = db.query("SELECT * FROM resumes WHERE id = ?");
  return query.get(resumeId) as DbResume | null;
}

export function getHeader(resumeId: number): DbHeader | null {
  const db = getDb();
  const query = db.query("SELECT * FROM headers WHERE resume_id = ?");
  return query.get(resumeId) as DbHeader | null;
}

export function getHeaderResumeLines(headerId: number): DbHeaderResumeLine[] {
  const db = getDb();
  const query = db.query(
    "SELECT * FROM header_resume_lines WHERE header_id = ? ORDER BY order_index",
  );
  return query.all(headerId) as DbHeaderResumeLine[];
}

export function getHeaderTitleLines(headerId: number): DbHeaderTitleLine[] {
  const db = getDb();
  const query = db.query(
    "SELECT * FROM header_title_lines WHERE header_id = ? ORDER BY order_index",
  );
  return query.all(headerId) as DbHeaderTitleLine[];
}

export function getProfile(resumeId: number): DbProfile | null {
  const db = getDb();
  const query = db.query("SELECT * FROM profiles WHERE resume_id = ?");
  return query.get(resumeId) as DbProfile | null;
}

export function getProfileLines(profileId: number): DbProfileLine[] {
  const db = getDb();
  const query = db.query(
    "SELECT * FROM profile_lines WHERE profile_id = ? ORDER BY order_index",
  );
  return query.all(profileId) as DbProfileLine[];
}

export function getProfileLinks(profileId: number): DbProfileLink[] {
  const db = getDb();
  const query = db.query(
    "SELECT * FROM profile_links WHERE profile_id = ? ORDER BY order_index",
  );
  return query.all(profileId) as DbProfileLink[];
}

export function getCareerSummary(resumeId: number): DbCareerSummaryItem[] {
  const db = getDb();
  const query = db.query(
    "SELECT * FROM career_summary_items WHERE resume_id = ? ORDER BY order_index",
  );
  return query.all(resumeId) as DbCareerSummaryItem[];
}

export function getCoverLetter(resumeId: number): DbCoverLetterLine[] {
  const db = getDb();
  const query = db.query(
    "SELECT * FROM cover_letter_lines WHERE resume_id = ? ORDER BY order_index",
  );
  return query.all(resumeId) as DbCoverLetterLine[];
}
