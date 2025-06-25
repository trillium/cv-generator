// src/types/cvdata.zod.ts
import { z } from "zod";

export const Lines = z.array(
  z.object({ text: z.string(), bulletPoint: z.boolean().optional() }),
);
export const WorkExperience = z.object({
  position: z.string(),
  company: z.string(),
  location: z.string(),
  icon: z.string(),
  years: z.string(),
  bubbles: z.array(z.string()).optional(),
  lines: Lines,
});
export const urlString = z.string().refine((val) => !/^https?:\/\//.test(val), {
  message: "URL must not include http:// or https://",
});
export const ProjectLink = z.object({
  name: z.string(),
  icon: z.string().optional(),
  link: urlString,
});
export const Project = z.object({
  name: z.string(),
  duration: z.string().optional(),
  bubbles: z.array(z.string()).optional(),
  lines: z
    .array(
      z.union([
        z.object({ text: z.string() }),
        z.object({ text: z.array(z.string()) }),
      ]),
    )
    .optional(),
  links: z.array(ProjectLink).optional(),
});
export const TechnicalCategory = z.object({
  category: z.string(),
  bubbles: z.array(z.string()),
});
export const Education = z.object({
  degree: z.string().optional(),
  school: z.string(),
  location: z.string().optional(),
  years: z.string().optional(),
});
export const ProfileLink = ProjectLink;
export const Profile = z.object({
  shouldDisplayProfileImage: z.boolean(),
  lines: z.array(z.string()),
  links: z.array(ProfileLink),
});
export const Header = z.object({
  name: z.string(),
  resume: z.array(z.string()).optional(),
  title: z.array(z.string()).optional(),
});
export const CareerSummaryItem = z.object({
  title: z.string(),
  text: z.string(),
});
export const CVData = z.object({
  info: z.record(z.any()).optional(),
  header: Header,
  workExperience: z.array(WorkExperience),
  projects: z.array(Project).optional(),
  profile: Profile,
  technical: z.array(TechnicalCategory),
  languages: z.array(z.any()).optional(),
  education: z.array(Education).optional(),
  coverLetter: z.array(z.string().nullable()).optional(),
  careerSummary: z.array(CareerSummaryItem).optional(),
});
