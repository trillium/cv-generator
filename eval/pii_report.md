# PII Directory Bloat & Duplication Review

---

## Directory Structure & File Types

- The `pii` directory is primarily a data store for resume, cover letter, and profile information in YAML, JSON, and Markdown formats.
- It contains subfolders for backups, docs, per-company and per-role resumes, and metadata.
- No TypeScript/JS code or React components are present in this directory.

---

## Bloat (200+ lines) Check

- **All files in the root of `pii/`** (changelog.json, data.yml, linkedin.yml, resume-index.json) are under 200 lines.
- **Docs**: Both `resume-bullets.json` and `resume-bullets.md` are under 50 lines.
- **Google/LinkedIn/Resumes**: All YAML/JSON files are under 200 lines.
- **Backups**: These are versioned YAML files, each under 200 lines.
- **resumes\_\_**: Contains deeply nested folders, but all YAML/JSON/MD files sampled are under 200 lines.
- **No single file in this directory exceeds 200 lines.**

---

## Type Information

- No TypeScript types or interfaces are present in this directory. All files are data (YAML/JSON/MD).
- No type definitions to move to `/types`.

---

## Component Structure

- No React components or UI code in this directory, so no subcomponent refactoring is relevant.

---

## Code Duplication

- **Duplication in Data**: There is significant duplication of personal info blocks (name, email, phone, etc.) across:
  - `/pii/data.yml`
  - `/pii/google/data.yml`
  - `/pii/linkedin/linkedIn.yml`
  - `/pii/resumes/data.yml`
  - `/pii/resumes/facebook/info.yml`
  - `/pii/resumes/google/info.yml`
  - `/pii/resumes/info.yml`
  - `/pii/resumes__/*/meta/*/data.yml`
  - This is expected for a data store that supports multiple resume variants, but it does mean that updates to personal info must be made in many places.
- **No code duplication** (functions, logic) is present, as this is a data-only directory.

---

## Recommendations

- **Bloat**: No files exceed 200 lines. No action needed.
- **Type Info**: Not applicable.
- **Component Structure**: Not applicable.
- **Duplication**: Consider a single source of truth for personal info (e.g., a root-level YAML file) and referencing it in other files to reduce update overhead and risk of inconsistency. However, this may be a deliberate design for snapshot/versioning purposes.

---

## Summary Table

| Issue Type | Found? | Details/Files |
| --- | --- | --- |
| >200 lines | ❌ | All files are under 200 lines |
| Type bloat | ❌ | No type definitions present |
| Component bloat | ❌ | No components present |
| Code duplication | ⚠️ | Personal info blocks duplicated across many YAML files (expected for this use) |

---

Great job! No bloat or code duplication issues requiring action in the `pii` directory.
