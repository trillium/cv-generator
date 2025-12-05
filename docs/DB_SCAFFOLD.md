# Database Scaffold

## Core Tables

### candidates

Base identity record for a person. One candidate can have many tailored resumes.

- id
- first_name, last_name, email, phone, role
- website, bluesky, github, linkedin_url
- created_at, updated_at

### resumes

A specific version of a resume, typically tailored for a company/position. Tracks application metadata.

- id
- candidate_id FK
- target_company, target_position, target_job_url
- application_date, application_status
- pages, last_modified
- created_at, updated_at

### headers

Resume header containing name and optional taglines/titles. One per resume.

- id
- resume_id FK
- name
- created_at, updated_at

### header_resume_lines

Array of resume description lines in header (e.g., "Frontend developer focused on...").

- id
- header_id FK
- text
- order_index
- created_at, updated_at

### header_title_lines

Array of title/role lines in header (e.g., "Software Developer", "Full Stack Engineer").

- id
- header_id FK
- text
- order_index
- created_at, updated_at

### profiles

Resume profile section metadata. Controls profile image display and contains profile lines.

- id
- resume_id FK
- should_display_profile_image (bool)
- created_at, updated_at

### profile_lines

Text lines in the profile section (contact info, brief bio, etc).

- id
- profile_id FK
- text
- order_index
- created_at, updated_at

### career_summary_items

High-level summary statements that appear at the top of a resume. Each has title + text.

- id
- resume_id FK
- title, text
- order_index
- created_at, updated_at

### work_experiences

Employment history entries. Each represents one job/position with a company.

- id
- resume_id FK
- position, company, location, icon
- years, subhead
- order_index
- created_at, updated_at

### work_experience_bubbles

Skill tags/bubbles displayed on a work experience (e.g., "React", "Node.js", "TypeScript").

- id
- work_experience_id FK
- text
- order_index
- created_at, updated_at

### work_experience_lines

Bullet points or lines of text describing responsibilities/achievements for a work experience.

- id
- work_experience_id FK
- text
- bullet_point (bool)
- order_index
- created_at, updated_at

### projects

Portfolio projects or side work. Can include personal, open-source, or client projects.

- id
- resume_id FK
- name, duration
- order_index
- created_at, updated_at

### project_bubbles

Skill tags/bubbles displayed on a project (e.g., "Python", "FastAPI", "PostgreSQL").

- id
- project_id FK
- text
- order_index
- created_at, updated_at

### project_lines

Descriptive text lines for a project, explaining what was built or accomplished. Supports optional name field and both single text string or array of strings.

- id
- project_id FK
- name (nullable, optional label for this line)
- text (can be single string or serialized array - handle in app layer)
- is_text_array (bool, indicates if text contains array)
- order_index
- created_at, updated_at

### project_links

External links for a project (GitHub, live site, demo, etc).

- id
- project_id FK
- name, link, icon
- order_index
- created_at, updated_at

### profile_links

Contact/social links displayed in the resume header or profile section (LinkedIn, GitHub, portfolio, etc).

- id
- profile_id FK
- name, link, icon
- order_index
- created_at, updated_at

### technical_categories

Groupings of technical skills (e.g., "Languages", "Frameworks", "Tools").

- id
- resume_id FK
- category
- order_index
- created_at, updated_at

### technical_bubbles

Individual skill items within a technical category (e.g., "TypeScript", "React", "PostgreSQL").

- id
- technical_category_id FK
- text
- order_index
- created_at, updated_at

### education_records

Academic credentials and institutions attended.

- id
- resume_id FK
- degree, school, location, years
- order_index
- created_at, updated_at

### cover_letter_lines

Paragraphs or lines of a cover letter. Nullable text to allow for blank lines/spacing.

- id
- resume_id FK
- text (nullable)
- order_index
- created_at, updated_at

### languages

Spoken/written languages and proficiency levels.

- id
- resume_id FK
- name, proficiency
- order_index
- created_at, updated_at

### llm_info

LLM-specific prompts and instructions at the resume level. Can be a single prompt string or structured data.

- id
- resume_id FK
- prompt (main prompt text)
- metadata (JSON field for additional LLM config)
- created_at, updated_at

### resume_tailored_for

Keywords and companies that a resume was specifically optimized for. Helps track targeting strategy.

- id
- resume_id FK
- keyword (e.g., "python", "google", "ai researcher")
- order_index
- created_at, updated_at

### notes

Universal notes table. Every single entity in the system can have multiple notes attached. Used for LLM instructions, internal comments, context, or metadata about any record.

- id
- entity_type (table name - supports all tables)
- entity_id (FK to the specific record in the entity_type table)
- text (the actual note content)
- order_index
- created_at, updated_at

### feedback

Actionable feedback and suggestions for improving content. Separate from notes to track improvements, critiques, and LLM recommendations with status tracking.

- id
- entity_type (same polymorphic pattern as notes)
- entity_id (FK to the specific record in the entity_type table)
- text (the feedback content)
- feedback_type (suggestion|critique|llm_recommendation|user_review|improvement)
- status (pending|applied|dismissed|in_progress)
- source (llm|user|auto)
- priority (low|medium|high)
- order_index
- created_at, updated_at, applied_at

## Tags System

### tags

Master list of tags for categorizing and filtering resume content. Used to match content to job requirements.

- id
- name (javascript|typescript|python|ai|react|etc)
- category (language|framework|tool|concept|domain|soft_skill)
- description
- created_at, updated_at

### work_experience_tags

Links tags to entire work experience entries. Marks what technologies/domains were used in that role.

- id
- work_experience_id FK
- tag_id FK
- created_at

### work_experience_line_tags

Links tags to specific work experience bullets. Enables finding bullets relevant to a job posting.

- id
- work_experience_line_id FK
- tag_id FK
- created_at

### project_tags

Links tags to projects. Helps select which projects to include for specific roles.

- id
- project_id FK
- tag_id FK
- created_at

### project_line_tags

Links tags to individual project description lines.

- id
- project_line_id FK
- tag_id FK
- created_at

### technical_bubble_tags

Links tags to technical skills. Maps skills to their relevant domains/contexts.

- id
- technical_bubble_id FK
- tag_id FK
- created_at

### resume_tags

High-level tags for entire resumes. Marks what a resume was optimized for.

- id
- resume_id FK
- tag_id FK
- relevance_score (0-100, optional weight for how relevant this tag is)
- created_at

### linkedin_experience_tags

Tags for LinkedIn experience entries.

- id
- linkedin_experience_id FK
- tag_id FK
- created_at

### linkedin_project_tags

Tags for LinkedIn projects.

- id
- linkedin_project_id FK
- tag_id FK
- created_at

### linkedin_skill_tags

Tags for LinkedIn skills, mapping them to broader categories.

- id
- linkedin_skill_id FK
- tag_id FK
- created_at

## Display Configuration Tables

### resume_display

Controls which resume version is shown in different contexts (public site, specific application, etc).

- id
- candidate_id FK
- resume_id FK
- context (public|private|application|preview)
- is_active (bool)
- display_name
- created_at, updated_at

### cover_letter_display

Controls which cover letter is shown and in what context. Can reference a specific resume's cover letter.

- id
- candidate_id FK
- resume_id FK
- context (public|private|application)
- is_active (bool)
- display_name
- created_at, updated_at

### linkedin_display

Controls which LinkedIn profile snapshot is shown. Useful for versioning or public/private views.

- id
- candidate_id FK
- linkedin_profile_id FK
- context (public|private|preview)
- is_active (bool)
- display_name
- created_at, updated_at

## LinkedIn Tables

### linkedin_profiles

LinkedIn profile snapshot. One per candidate. Contains about section and location.

- id
- candidate_id FK
- about, location
- profile_photo_url, linkedin_url
- created_at, updated_at

### linkedin_experiences

Work history from LinkedIn. Similar to work_experiences but from LinkedIn data source.

- id
- linkedin_profile_id FK
- company, title, location
- start_date, end_date, description
- order_index
- created_at, updated_at

### linkedin_education

Educational background from LinkedIn profile.

- id
- linkedin_profile_id FK
- institution, degree, field_of_study
- start_date, end_date, location, description
- order_index
- created_at, updated_at

### linkedin_skills

Skills listed on LinkedIn profile. Flat list of skill names.

- id
- linkedin_profile_id FK
- name
- order_index
- created_at, updated_at

### linkedin_certifications

Professional certifications and credentials from LinkedIn.

- id
- linkedin_profile_id FK
- name, issuer, date
- order_index
- created_at, updated_at

### linkedin_projects

Projects showcased on LinkedIn profile. May overlap with portfolio projects.

- id
- linkedin_profile_id FK
- name, description, url
- order_index
- created_at, updated_at

### linkedin_volunteer

Volunteer work and community involvement from LinkedIn.

- id
- linkedin_profile_id FK
- organization, role
- start_date, end_date, description
- order_index
- created_at, updated_at

### linkedin_awards

Awards and honors listed on LinkedIn profile.

- id
- linkedin_profile_id FK
- name, issuer, date, description
- order_index
- created_at, updated_at

### linkedin_recommendations

LinkedIn recommendations received from or given to others.

- id
- linkedin_profile_id FK
- direction (received|given)
- recommender, recommender_title, recommender_relationship
- date, text
- order_index
- created_at, updated_at

### linkedin_activity

Posts, articles, and engagement activity on LinkedIn.

- id
- linkedin_profile_id FK
- type, date, content, url, engagement
- order_index
- created_at, updated_at

### linkedin_interests

Personal interests listed on LinkedIn profile (array of strings).

- id
- linkedin_profile_id FK
- interest
- order_index
- created_at, updated_at

### linkedin_services

Services offered on LinkedIn profile (name, description, url).

- id
- linkedin_profile_id FK
- name, description, url
- order_index
- created_at, updated_at

### linkedin_featured

Featured content on LinkedIn profile (posts, articles, media).

- id
- linkedin_profile_id FK
- type, title, description, url, image_url
- order_index
- created_at, updated_at

## Relationships

```
candidates 1:N resumes
candidates 1:1 linkedin_profiles
candidates 1:N resume_display
candidates 1:N cover_letter_display
candidates 1:N linkedin_display
resumes 1:1 headers
resumes 1:1 profiles
resumes 1:N career_summary_items
resumes 1:N work_experiences
resumes 1:N projects
resumes 1:N technical_categories
resumes 1:N education_records
resumes 1:N cover_letter_lines
resumes 1:N languages
resumes 1:1 llm_info
resumes 1:N resume_tailored_for
resumes 1:N resume_display
resumes 1:N cover_letter_display
headers 1:N header_resume_lines
headers 1:N header_title_lines
profiles 1:N profile_lines
profiles 1:N profile_links
work_experiences 1:N work_experience_bubbles
work_experiences 1:N work_experience_lines
projects 1:N project_bubbles
projects 1:N project_lines
projects 1:N project_links
technical_categories 1:N technical_bubbles
linkedin_profiles 1:N linkedin_experiences
linkedin_profiles 1:N linkedin_education
linkedin_profiles 1:N linkedin_skills
linkedin_profiles 1:N linkedin_certifications
linkedin_profiles 1:N linkedin_projects
linkedin_profiles 1:N linkedin_volunteer
linkedin_profiles 1:N linkedin_awards
linkedin_profiles 1:N linkedin_recommendations
linkedin_profiles 1:N linkedin_activity
linkedin_profiles 1:N linkedin_interests
linkedin_profiles 1:N linkedin_services
linkedin_profiles 1:N linkedin_featured
linkedin_profiles 1:N linkedin_display
```

## Tags Relationships (Many-to-Many via Junction Tables)

```
resumes N:N tags (via resume_tags)
work_experiences N:N tags (via work_experience_tags)
work_experience_lines N:N tags (via work_experience_line_tags)
projects N:N tags (via project_tags)
project_lines N:N tags (via project_line_tags)
technical_bubbles N:N tags (via technical_bubble_tags)
linkedin_experiences N:N tags (via linkedin_experience_tags)
linkedin_projects N:N tags (via linkedin_project_tags)
linkedin_skills N:N tags (via linkedin_skill_tags)
```

## Notes Relationships (Polymorphic)

**EVERY entity can have notes attached via the polymorphic `notes` table:**

```
tags 1:N notes
candidates 1:N notes
resumes 1:N notes
headers 1:N notes
header_resume_lines 1:N notes
header_title_lines 1:N notes
profiles 1:N notes
profile_lines 1:N notes
career_summary_items 1:N notes
work_experiences 1:N notes
work_experience_bubbles 1:N notes
work_experience_lines 1:N notes
projects 1:N notes
project_bubbles 1:N notes
project_lines 1:N notes
project_links 1:N notes
profile_links 1:N notes
technical_categories 1:N notes
technical_bubbles 1:N notes
education_records 1:N notes
cover_letter_lines 1:N notes
languages 1:N notes
llm_info 1:N notes
resume_tailored_for 1:N notes
resume_display 1:N notes
cover_letter_display 1:N notes
linkedin_display 1:N notes
linkedin_profiles 1:N notes
linkedin_experiences 1:N notes
linkedin_education 1:N notes
linkedin_skills 1:N notes
linkedin_certifications 1:N notes
linkedin_projects 1:N notes
linkedin_volunteer 1:N notes
linkedin_awards 1:N notes
linkedin_recommendations 1:N notes
linkedin_activity 1:N notes
linkedin_interests 1:N notes
linkedin_services 1:N notes
linkedin_featured 1:N notes
work_experience_tags 1:N notes
work_experience_line_tags 1:N notes
project_tags 1:N notes
project_line_tags 1:N notes
technical_bubble_tags 1:N notes
resume_tags 1:N notes
linkedin_experience_tags 1:N notes
linkedin_project_tags 1:N notes
linkedin_skill_tags 1:N notes
```

## Feedback Relationships (Polymorphic)

**EVERY entity can have feedback attached via the polymorphic `feedback` table:**

```
tags 1:N feedback
candidates 1:N feedback
resumes 1:N feedback
headers 1:N feedback
header_resume_lines 1:N feedback
header_title_lines 1:N feedback
profiles 1:N feedback
profile_lines 1:N feedback
career_summary_items 1:N feedback
work_experiences 1:N feedback
work_experience_bubbles 1:N feedback
work_experience_lines 1:N feedback
projects 1:N feedback
project_bubbles 1:N feedback
project_lines 1:N feedback
project_links 1:N feedback
profile_links 1:N feedback
technical_categories 1:N feedback
technical_bubbles 1:N feedback
education_records 1:N feedback
cover_letter_lines 1:N feedback
languages 1:N feedback
llm_info 1:N feedback
resume_tailored_for 1:N feedback
resume_display 1:N feedback
cover_letter_display 1:N feedback
linkedin_display 1:N feedback
linkedin_profiles 1:N feedback
linkedin_experiences 1:N feedback
linkedin_education 1:N feedback
linkedin_skills 1:N feedback
linkedin_certifications 1:N feedback
linkedin_projects 1:N feedback
linkedin_volunteer 1:N feedback
linkedin_awards 1:N feedback
linkedin_recommendations 1:N feedback
linkedin_activity 1:N feedback
linkedin_interests 1:N feedback
linkedin_services 1:N feedback
linkedin_featured 1:N feedback
work_experience_tags 1:N feedback
work_experience_line_tags 1:N feedback
project_tags 1:N feedback
project_line_tags 1:N feedback
technical_bubble_tags 1:N feedback
resume_tags 1:N feedback
linkedin_experience_tags 1:N feedback
linkedin_project_tags 1:N feedback
linkedin_skill_tags 1:N feedback
```
