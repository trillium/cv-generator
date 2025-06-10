export type Lines = { text: string; bulletPoint: boolean }[];

export type WorkExperience = {
  position: string;
  company: string;
  location: string;
  type: string;
  years: string;
  bubbles: string[];
  lines: Lines;
};

export type Project = {
  name: string;
  duration: string;
  bubbles: string[];
  lines: Lines;
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

export type CVData = {
  header: {
    name: string;
    resume: string[];
  };
  workExperience: WorkExperience[];
  projects?: Project[];
  profile: {
    shouldDisplayProfileImage: boolean;
    lines: string[];
    links: ProfileLinkProps[];
  };
  technical: TechnicalCategory[];
  languages: Language[];
  education: Education[];
};
