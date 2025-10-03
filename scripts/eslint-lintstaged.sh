#!/bin/bash

# Wrapper for lint-staged ESLint to ignore Rushstack patch error

ESLINT_CMD="eslint --report-unused-disable-directives --max-warnings 0 --no-warn-ignored $@"

OUTPUT=$(eval $ESLINT_CMD 2>&1)
STATUS=$?

PATCH_ERROR="Failed to patch ESLint because the calling module was not recognized."

if [ $STATUS -ne 0 ]; then
  if echo "$OUTPUT" | grep -q "$PATCH_ERROR"; then
    echo "⚠️ Ignoring ESLint patch error for commit: $PATCH_ERROR"
    exit 0
  else
    echo "$OUTPUT"
    exit $STATUS
  fi
else
  echo "$OUTPUT"
  exit 0
fi
