#!/bin/sh
next build 2>&1 | tee build-errors.txt
status=$?
# Extract and display the last non-empty line (e.g., error summary)
grep -v '^$' build-errors.txt | tail -n 1
exit $status
j