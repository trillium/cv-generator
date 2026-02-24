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

export async function getResume(resumeId: number): Promise<DbResume | null> {
  const db = await getDb();
  const query = db.query("SELECT * FROM resumes WHERE id = ?");
  return query.get(resumeId) as DbResume | null;
}

export async function getHeader(resumeId: number): Promise<DbHeader | null> {
  const db = await getDb();
  const query = db.query("SELECT * FROM headers WHERE resume_id = ?");
  return query.get(resumeId) as DbHeader | null;
}

export async function getHeaderResumeLines(
  headerId: number,
): Promise<DbHeaderResumeLine[]> {
  const db = await getDb();
  const query = db.query(
    "SELECT * FROM header_resume_lines WHERE header_id = ? ORDER BY order_index",
  );
  return query.all(headerId) as DbHeaderResumeLine[];
}

export async function getHeaderTitleLines(
  headerId: number,
): Promise<DbHeaderTitleLine[]> {
  const db = await getDb();
  const query = db.query(
    "SELECT * FROM header_title_lines WHERE header_id = ? ORDER BY order_index",
  );
  return query.all(headerId) as DbHeaderTitleLine[];
}

export async function getProfile(resumeId: number): Promise<DbProfile | null> {
  const db = await getDb();
  const query = db.query("SELECT * FROM profiles WHERE resume_id = ?");
  return query.get(resumeId) as DbProfile | null;
}

export async function getProfileLines(
  profileId: number,
): Promise<DbProfileLine[]> {
  const db = await getDb();
  const query = db.query(
    "SELECT * FROM profile_lines WHERE profile_id = ? ORDER BY order_index",
  );
  return query.all(profileId) as DbProfileLine[];
}

export async function getProfileLinks(
  profileId: number,
): Promise<DbProfileLink[]> {
  const db = await getDb();
  const query = db.query(
    "SELECT * FROM profile_links WHERE profile_id = ? ORDER BY order_index",
  );
  return query.all(profileId) as DbProfileLink[];
}

export async function getCareerSummary(
  resumeId: number,
): Promise<DbCareerSummaryItem[]> {
  const db = await getDb();
  const query = db.query(
    "SELECT * FROM career_summary_items WHERE resume_id = ? ORDER BY order_index",
  );
  return query.all(resumeId) as DbCareerSummaryItem[];
}

export async function getCoverLetter(
  resumeId: number,
): Promise<DbCoverLetterLine[]> {
  const db = await getDb();
  const query = db.query(
    "SELECT * FROM cover_letter_lines WHERE resume_id = ? ORDER BY order_index",
  );
  return query.all(resumeId) as DbCoverLetterLine[];
}
