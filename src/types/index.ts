export type Lines = { text: string; bulletPoint?: boolean }[];

export type WorkExperience = {
  position: string;
  company: string;
  location: string;
  icon: string;
  years: string;
  bubbles: string[];
  lines: Lines;
};

export type Project = {
  name: string;
  duration?: string;
  bubbles?: string[];
  lines?: Lines;
  links?: ProfileLinkProps[];
};

export type TechnicalCategory = {
  category: string;
  bubbles: string[];
};

export type Education = {
  degree: string;
  school: string;
  location: string;
  years: string;
};

import type { ProfileLinkProps } from "../components/Profile/ProfileLink/ProfileLink";
import type { Language } from "../components/Profile/ProfileLanguages/ProfileLanguages";
import { HeaderProps } from "../components/Header/Header";

export type CVData = {
  info: InfoType;
  careerSummary: CareerSummary;
  header: HeaderProps;
  workExperience: WorkExperience[];
  projects?: Project[];
  profile: {
    shouldDisplayProfileImage: boolean;
    lines: string[];
    links: ProfileLinkProps[];
  };
  technical: TechnicalCategory[];
  languages?: Language[];
  education?: Education[];
  coverLetter?: string[];
};

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
};

export type CareerSummary = CareerSummaryItem[];
