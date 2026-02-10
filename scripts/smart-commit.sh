#!/bin/bash
# Git optimization wrapper - only commit if there are actual changes

# Check if there are any changes
if git diff --cached --quiet && git diff --quiet; then
  echo "No changes to commit"
  exit 0
fi

# Stage all changes
git add -A

# Check again after staging
if git diff --cached --quiet; then
  echo "No changes after staging"
  exit 0
fi

# Commit with message
COMMIT_MSG="${1:-'Update files'}"
git commit -m "$COMMIT_MSG"
