#!/bin/sh
eslint . --report-unused-disable-directives --max-warnings 0 > eslint-errors.txt
status=$?
echo "Lint errors: $(grep -c 'error' eslint-errors.txt)"
exit $status
