# Using Pandoc to Convert HTML to Markdown

## Converting HTML from clipboard

Copy HTML content from browser (right-click element → Copy element), then:

```bash
pbpaste | pandoc -f html -t markdown > output.md
```

## Converting HTML from inline paste

```bash
cat <<'EOF' | pandoc -f html -t markdown > output.md
[paste HTML here]
EOF
```

## Converting HTML from URL with curl

```bash
curl -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \
  "https://example.com/article" \
  | pandoc -f html -t markdown > output.md
```

Note: The `-A` flag sets a user agent to bypass simple bot blocking. May not work on sites with stricter protection.

## Converting HTML file

```bash
pandoc -f html -t markdown input.html -o output.md
```

## Common Options

- `-f html`: Input format (HTML)
- `-t markdown`: Output format (Markdown)
- `--wrap=none`: Don't wrap long lines
- `--atx-headers`: Use ATX-style headers (# instead of underlines)
- `-s`: Standalone document (includes YAML frontmatter if present)
