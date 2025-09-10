# PII Setup Instructions

This CV Generator application is designed to keep your personally identifiable information (PII) separate from the main codebase for privacy and security.

## Setup

1. **Create a separate directory for your PII data:**

   ```bash
   mkdir -p /path/to/your/pii-data
   cd /path/to/your/pii-data
   git init  # Optional: Initialize as a separate private git repository
   ```

2. **Copy the template and customize it:**

   ```bash
   cp data.yml.template /path/to/your/pii-data/data.yml
   ```

3. **Set the environment variable:** Create or update your `.env` file:

   ```bash
   echo "PII_PATH=/path/to/your/pii-data" > .env
   ```

4. **Edit your data:** Open `/path/to/your/pii-data/data.yml` and replace all the placeholder values with your actual information.

## Usage

Once set up, the application will automatically use your PII data from the specified directory:

- **Development server:** `pnpm dev`
- **Watch for changes:** `pnpm watch:data`
- **Generate PDF:** `pnpm pdf`
- **Convert YAML to JSON:** `pnpm yml-to-json`

## File Structure

```
your-pii-directory/
├── data.yml              # Your main CV data
├── data-backup.yml       # Backup of your data (optional)
└── .git/                 # Optional: Private git repository

main-cv-generator/
├── .env                  # Contains PII_PATH=/path/to/your/pii-directory
├── data.yml.template     # Template for new users
└── ...rest of app files
```

## Benefits

- **Privacy:** Your personal information is kept separate from the main application code
- **Sharing:** You can safely share or fork the main application without exposing your data
- **Backup:** Your PII can be version controlled separately in a private repository
- **Collaboration:** Multiple people can use the same application with their own PII directories

## Troubleshooting

If you get errors about missing files:

1. Verify your `PII_PATH` environment variable is set correctly
2. Check that `data.yml` exists in your PII directory
3. Make sure the file has the correct permissions to be read

## Security Notes

- Never commit your actual PII data to public repositories
- Consider encrypting your PII directory if needed
- Keep backups of your PII data in a secure location
