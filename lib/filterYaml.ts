import * as yaml from "js-yaml";

// Define which YAML sections should be shown for each route type
export const ROUTE_FILTERS = {
  resume: [
    "info",
    "careerSummary",
    "header",
    "workExperience",
    "projects",
    "profile",
  ],
  "cover-letter": ["info", "header", "coverLetter", "profile"],
} as const;

export type RouteType = keyof typeof ROUTE_FILTERS;

/**
 * Filters YAML data based on the current route type
 * @param yamlString - The original YAML string
 * @param routeType - Either 'resume' or 'cover-letter'
 * @returns Filtered YAML string containing only relevant sections
 */
export function filterYamlForRoute(
  yamlString: string,
  routeType: RouteType,
): string {
  try {
    // Parse the YAML string into an object
    const data = yaml.load(yamlString) as Record<string, any>;

    if (!data || typeof data !== "object") {
      return yamlString; // Return original if parsing fails
    }

    // Get the allowed fields for this route
    const allowedFields = ROUTE_FILTERS[routeType];

    // Filter the data to only include allowed fields
    const filteredData: Record<string, any> = {};

    allowedFields.forEach((field) => {
      if (data[field] !== undefined) {
        filteredData[field] = data[field];
      }
    });

    // Convert back to YAML string
    return yaml.dump(filteredData, {
      indent: 2,
      lineWidth: -1, // Prevent line wrapping
      noRefs: true,
      skipInvalid: true,
    });
  } catch (error) {
    console.error("Error filtering YAML:", error);
    return yamlString; // Return original on error
  }
}

/**
 * Get the route type from a pathname
 * @param pathname - Next.js pathname (e.g., "/single-column/resume" or "/two-column/cover-letter")
 * @returns RouteType or 'resume' as default
 */
export function getRouteTypeFromPath(pathname: string): RouteType {
  if (pathname.includes("cover-letter")) {
    return "cover-letter";
  }
  return "resume"; // Default to resume
}

/**
 * Get user-friendly title and description based on route type
 */
export function getModalConfig(routeType: RouteType) {
  const configs = {
    resume: {
      title: "Resume Data (YAML)",
      description: "YAML data sections used for generating your resume",
    },
    "cover-letter": {
      title: "Cover Letter Data (YAML)",
      description: "YAML data sections used for generating your cover letter",
    },
  };

  return configs[routeType];
}
