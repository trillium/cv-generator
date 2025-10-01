export type LinkedInExperience = {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  description: string;
};

export type LinkedInEducation = {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  location?: string;
  description?: string;
};

export type LinkedInCertification = {
  name: string;
  issuer: string;
  date?: string;
};

export type LinkedInLanguage = {
  name: string;
  proficiency?: string;
};

export type LinkedInProject = {
  name: string;
  description?: string;
  url?: string;
};

export type LinkedInVolunteer = {
  organization: string;
  role: string;
  startDate?: string;
  endDate?: string;
  description?: string;
};

export type LinkedInAward = {
  name: string;
  issuer?: string;
  date?: string;
  description?: string;
};

export type LinkedInService = {
  name: string;
  description?: string;
  url?: string;
};

export type LinkedInFeatured = {
  type: string;
  title: string;
  description?: string;
  url?: string;
  imageUrl?: string;
};

export type LinkedInRecommendation = {
  recommender: string;
  recommenderTitle: string;
  recommenderRelationship: string;
  date: string;
  text: string;
};

export type LinkedInActivity = {
  type?: string;
  date?: string;
  content?: string;
  url?: string;
  engagement?: string;
};

export type LinkedInData = {
  firstName: string;
  lastName: string;
  role: string;
  about: string;
  location: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  profilePhotoUrl?: string;
  experience: LinkedInExperience[];
  education: LinkedInEducation[];
  skills: string[];
  certifications?: LinkedInCertification[];
  languages?: LinkedInLanguage[];
  projects?: LinkedInProject[];
  volunteer?: LinkedInVolunteer[];
  awards?: LinkedInAward[];
  interests?: string[];
  services?: LinkedInService[];
  featured?: LinkedInFeatured[];
  recommendations?: {
    received: LinkedInRecommendation[];
    given: LinkedInRecommendation[];
  };
  activity?: LinkedInActivity[];
};
