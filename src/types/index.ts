export type Lines = { text: string; bulletPoint?: boolean }[];
export type Notes = string[];

export type WorkExperience = {
  position: string;
  company: string;
  location: string;
  icon: string;
  years: string;
  bubbles: string[];
  lines: Lines;
  notes?: Notes;
};

export type Project = {
  name: string;
  duration?: string;
  bubbles?: string[];
  lines?: Lines;
  links?: ProfileLinkProps[];
  notes?: Notes;
};

export type TechnicalCategory = {
  category: string;
  bubbles: string[];
  notes?: Notes;
};

export type Education = {
  degree: string;
  school: string;
  location: string;
  years: string;
  notes?: Notes;
};

import type { ProfileLinkProps } from "../components/Profile/ProfileLink/ProfileLink";
import type { Language } from "../components/Profile/ProfileLanguages/ProfileLanguages";

export type LLMInfo =
  | {
      prompt: string;
      notes?: Notes;
      [key: string]: unknown;
    }
  | string;

import { HeaderProps } from "../components/Header/Header";
import type { LinkedInProfile } from "./linkedin";

export type CVData = {
  info: InfoType & { notes?: Notes };
  careerSummary: CareerSummary & { notes?: Notes };
  header: HeaderProps & { notes?: Notes };
  workExperience: WorkExperience[] & { notes?: Notes };
  projects?: Project[] & { notes?: Notes };
  profile: {
    shouldDisplayProfileImage: boolean;
    lines: string[];
    links: ProfileLinkProps[];
    notes?: Notes;
  };
  technical: TechnicalCategory[] & { notes?: Notes };
  languages?: Language[] & { notes?: Notes };
  education?: Education[] & { notes?: Notes };
  coverLetter?: string[] & { notes?: Notes };
  metadata?: ResumeMetadata & { notes?: Notes };
  linkedIn?: LinkedInProfile & { notes?: Notes };
  notes?: Notes;
  llm?: LLMInfo;
};

/**
 * Extended type that encompasses all candidate data including resume, LinkedIn profile, and notes.
 * This is the top-level type for a complete candidate profile.
 */
export type CandidateProfile = CVData;

/**
 * Alternative names for CandidateProfile for backward compatibility or preference:
 * - CompleteProfile
 * - CareerDocument
 * - ProfessionalProfile
 * - FullResumeData
 * - ApplicationPackage
 * - ResumeBundle
 * - ExtendedCVData
 * - CandidateData
 */
export type ResumeObjectType = CandidateProfile;
export type ResumeType = CandidateProfile;

export type InfoType = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  website?: string;
  bluesky?: string;
  github?: string;
  linkedIn?: string;
};

export type CareerSummaryItem = {
  title: string;
  text: string;
  notes?: Notes;
};

export type CareerSummary = CareerSummaryItem[];

export type ResumeMetadata = {
  targetCompany?: string;
  targetPosition?: string;
  targetJobUrl?: string;
  applicationDate?: string;
  applicationStatus?:
    | "draft"
    | "applied"
    | "interview"
    | "offer"
    | "rejected"
    | "withdrawn";
  notes?: string;
  tailoredFor?: string[];
  lastModified?: string;
};
