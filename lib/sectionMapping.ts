/**
 * Maps resume sections to their corresponding YAML paths and metadata
 */

export interface SectionMapping {
  yamlPath: string;
  displayName: string;
  description: string;
  component: string;
}

export const SECTION_MAPPINGS: Record<string, SectionMapping> = {
  // Header section
  header: {
    yamlPath: "header",
    displayName: "Header",
    description: "Name, title, and professional summary",
    component: "Header",
  },

  // Career summary section
  careerSummary: {
    yamlPath: "careerSummary",
    displayName: "Career Summary",
    description: "Professional overview and key skills",
    component: "CareerSummary",
  },

  // Work experience section
  workExperience: {
    yamlPath: "workExperience",
    displayName: "Work Experience",
    description: "Professional work history and achievements",
    component: "WorkExperience",
  },

  // Projects section
  projects: {
    yamlPath: "projects",
    displayName: "Projects",
    description: "Portfolio projects and key accomplishments",
    component: "ProjectsList",
  },

  // Profile/sidebar section
  profile: {
    yamlPath: "profile",
    displayName: "Profile",
    description: "Contact information and links",
    component: "Profile",
  },

  // Contact info
  info: {
    yamlPath: "info",
    displayName: "Contact Information",
    description: "Personal contact details and social links",
    component: "Info",
  },

  // Cover letter section
  coverLetter: {
    yamlPath: "coverLetter",
    displayName: "Cover Letter",
    description: "Cover letter content",
    component: "CoverLetter",
  },
};

/**
 * Get section mapping by YAML path
 */
export function getSectionMapping(
  yamlPath: string,
): SectionMapping | undefined {
  return SECTION_MAPPINGS[yamlPath];
}

/**
 * Get all section mappings for a specific route type
 */
export function getSectionsForRoute(
  routeType: "resume" | "cover-letter",
): SectionMapping[] {
  const routeFilters = {
    resume: [
      "info",
      "careerSummary",
      "header",
      "workExperience",
      "projects",
      "profile",
    ],
    "cover-letter": ["info", "header", "coverLetter", "profile"],
  };

  return routeFilters[routeType]
    .map((path) => SECTION_MAPPINGS[path])
    .filter(Boolean);
}
