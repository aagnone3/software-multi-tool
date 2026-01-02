#!/usr/bin/env bash
# Prevent commits directly to main branch

BRANCH=$(git branch --show-current)

if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
  echo ""
  echo "❌ ERROR: Direct commits to the main/master branch are not allowed!"
  echo ""
  echo "Please create a feature branch first:"
  echo "  git checkout -b <type>/pra-<issue>-<description>"
  echo ""
  echo "Examples:"
  echo "  git checkout -b fix/pra-35-vercel-deployment"
  echo "  git checkout -b feat/pra-40-user-authentication"
  echo ""
  echo "If you must commit to main (with explicit user approval), use:"
  echo "  git commit --no-verify -m \"your message\""
  echo ""
  exit 1
fi

exit 0
