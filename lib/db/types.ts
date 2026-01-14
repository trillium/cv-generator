export type DbCandidate = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  role: string | null;
  website: string | null;
  bluesky: string | null;
  github: string | null;
  linkedin_url: string | null;
  created_at: string;
  updated_at: string;
};

export type DbResume = {
  id: number;
  candidate_id: number;
  target_company: string | null;
  target_position: string | null;
  target_job_url: string | null;
  application_date: string | null;
  application_status: string | null;
  pages: number | null;
  last_modified: string | null;
  created_at: string;
  updated_at: string;
};

export type DbHeader = {
  id: number;
  resume_id: number;
  name: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
};

export type DbHeaderResumeLine = {
  id: number;
  header_id: number;
  text: string;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type DbHeaderTitleLine = {
  id: number;
  header_id: number;
  text: string;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type DbProfile = {
  id: number;
  resume_id: number;
  should_display_profile_image: number;
  created_at: string;
  updated_at: string;
};

export type DbProfileLine = {
  id: number;
  profile_id: number;
  text: string;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type DbProfileLink = {
  id: number;
  profile_id: number;
  name: string;
  link: string;
  icon: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type DbCareerSummaryItem = {
  id: number;
  resume_id: number;
  title: string;
  text: string;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type DbWorkExperience = {
  id: number;
  resume_id: number;
  position: string;
  company: string;
  location: string | null;
  icon: string | null;
  years: string | null;
  subhead: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type DbWorkExperienceBubble = {
  id: number;
  work_experience_id: number;
  text: string;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type DbWorkExperienceLine = {
  id: number;
  work_experience_id: number;
  text: string;
  bullet_point: number;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type DbProject = {
  id: number;
  resume_id: number;
  name: string;
  duration: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type DbProjectBubble = {
  id: number;
  project_id: number;
  text: string;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type DbProjectLine = {
  id: number;
  project_id: number;
  name: string | null;
  text: string;
  is_text_array: number;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type DbProjectLink = {
  id: number;
  project_id: number;
  name: string;
  link: string;
  icon: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type DbTechnicalCategory = {
  id: number;
  resume_id: number;
  category: string;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type DbTechnicalBubble = {
  id: number;
  technical_category_id: number;
  text: string;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type DbEducationRecord = {
  id: number;
  resume_id: number;
  degree: string | null;
  school: string;
  location: string | null;
  years: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type DbCoverLetterLine = {
  id: number;
  resume_id: number;
  text: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type DbLanguage = {
  id: number;
  resume_id: number;
  name: string;
  proficiency: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type DbLlmInfo = {
  id: number;
  resume_id: number;
  prompt: string | null;
  metadata: string | null;
  created_at: string;
  updated_at: string;
};

export type DbNote = {
  id: number;
  entity_type: string;
  entity_id: number;
  text: string;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type DbFeedback = {
  id: number;
  entity_type: string;
  entity_id: number;
  text: string;
  feedback_type: string | null;
  status: string | null;
  source: string | null;
  priority: string | null;
  order_index: number;
  applied_at: string | null;
  created_at: string;
  updated_at: string;
};
