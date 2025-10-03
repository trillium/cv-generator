#!/bin/sh
eslint . --report-unused-disable-directives --max-warnings 0 "$@" > eslint-errors.txt
status=$?
# Extract and display the summary line (e.g., "✖ 78 problems (70 errors, 8 warnings)")
grep -v '^$' eslint-errors.txt | tail -n 1
exit $status
