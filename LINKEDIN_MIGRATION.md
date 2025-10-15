# LINKEDIN_MIGRATION.md

**Migration Intent:** The goal of this migration is to move the `/linkedin` page and its data handling from the legacy single-file API (`/api/linkedin/load`) to the new multi-file directory-based setup (`/api/directory/load`). This will enable modular, hierarchical data management and better integration with the rest of the multi-file CV system.

## Important Migration Note: LinkedIn YAML Nesting

As part of the migration to the multi-file setup, **all LinkedIn YAML values must be nested inside a `linkedIn` object**. This means that, for example, a field like `firstName` in the old `linkedin.yml` file should become `linkedIn.firstName` in the new structure.

**Example:**

Old format:

```yaml
firstName: John
lastName: Doe
email: john@example.com
```

New format:

```yaml
linkedIn:
  firstName: John
  lastName: Doe
  email: john@example.com
```

This change ensures consistency with the multi-file and multi-section data model, and will make it easier to merge, extend, and manage LinkedIn data alongside other CV data.

---

## Overview

This document describes the key differences between the `LinkedInData` and `CVData` types, as well as their YAML file structures, to assist with migrating or mapping data between LinkedIn profile data and the CV/resume data model.

---

## 1. Top-Level Structure

### CVData

- Personal info fields are **nested** under the `info` object.
- Example YAML path: `info.firstName`, `info.email`

### LinkedInData

- Personal info fields are **top-level** properties.
- Example YAML path: `firstName`, `email`

---

## 2. Key Name Overlap

Some fields have the **same key names** in both types:

- `firstName`, `lastName`, `email`, `phone`, `role`, `education`, `projects`, `languages`

However, their **location in the object hierarchy differs** (see above).

---

## 3. Section/Field Differences

| Concept | CVData Key/Path | LinkedInData Key/Path | Notes |
| --- | --- | --- | --- |
| Personal Info | `info.firstName` | `firstName` | CVData nests under `info` |
| Work Experience | `workExperience` | `experience` | Structure differs |
| Education | `education` | `education` | Both have, but item structure differs |
| Projects | `projects` | `projects` | Both have, but item structure differs |
| Languages | `languages` | `languages` | Both have, but item structure differs |
| Skills/Technical | `technical` | `skills` | Different structure and naming |
| Profile Links | `profile.links` | `linkedinUrl` | CVData supports multiple links |
| Certifications | (not standard) | `certifications` | Only in LinkedInData |
| Volunteer | (not standard) | `volunteer` | Only in LinkedInData |
| Awards | (not standard) | `awards` | Only in LinkedInData |
| Cover Letter | `coverLetter` | (not standard) | Only in CVData |
| Metadata | `metadata` | (not standard) | Only in CVData |

---

## 4. Example YAML Paths

**CVData:**

```yaml
info:
  firstName: John
  lastName: Doe
  email: john@example.com
workExperience:
  - position: Developer
    company: ExampleCorp
```

**LinkedInData:**

```yaml
firstName: John
lastName: Doe
email: john@example.com
experience:
  - title: Developer
    company: ExampleCorp
```

---

## 5. Migration Considerations

- **Direct mapping is not possible** for all fields due to differences in structure and naming.
- **Personal info** must be moved between top-level and nested `info` object.
- **Work experience, education, projects, and languages** require field-by-field mapping due to structural differences.
- **LinkedInData** contains additional sections (certifications, volunteer, awards, etc.) not present in `CVData`.
- **CVData** contains resume-specific fields (cover letter, metadata) not present in `LinkedInData`.

---

## 6. Summary Table

| Field           | CVData Path    | LinkedInData Path |
| --------------- | -------------- | ----------------- |
| First Name      | info.firstName | firstName         |
| Last Name       | info.lastName  | lastName          |
| Email           | info.email     | email             |
| Phone           | info.phone     | phone             |
| Role            | info.role      | role              |
| Work Experience | workExperience | experience        |
| Education       | education      | education         |
| Projects        | projects       | projects          |
| Languages       | languages      | languages         |
| Skills          | technical      | skills            |
| Certifications  | (not present)  | certifications    |
| Volunteer       | (not present)  | volunteer         |
| Awards          | (not present)  | awards            |
| Cover Letter    | coverLetter    | (not present)     |
| Metadata        | metadata       | (not present)     |

---

For migration, a custom mapping function is required to translate between these two data models, especially for nested and structurally different fields.
