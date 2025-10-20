# PII Folder Structure

This folder contains your personal identifiable information (PII) and is excluded from git.

## Required Files

- `data.yml` - Main resume data (personal info, experience, education, skills, projects)
- `linkedin.yml` - LinkedIn-specific data (optional)

## Folder Structure

```
pii/
├── data.yml           # Main resume data
├── linkedin.yml       # LinkedIn data (optional)
├── google/            # Google-specific content and versions
├── linkedin/          # LinkedIn-specific exports
├── docs/              # Supporting documentation
├── resumes/           # Generated resume PDFs and versions
└── backups/           # Backup copies of your data
```

## Getting Started

1. Copy this `pii-example` folder to `pii/`
2. Edit `data.yml` with your actual information
3. Follow the X-Y-Z formula for accomplishments: "Accomplished [X] as measured by [Y], by doing [Z]"
4. Keep backups of your data in the `backups/` folder

## Important Notes

- The `pii/` folder is in `.gitignore` and will NOT be committed to git
- Always keep backups of your data
- Use quantifiable metrics in your accomplishments
- See `llm-google.md` for Google resume guidelines
