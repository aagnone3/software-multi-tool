#!/usr/bin/env bash

# repo-feedback.sh
# Fast repo-health snapshot for software-multi-tool so the agent can spend less
# effort on repetitive checks and more effort on actual product work.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
REPO_SLUG="${REPO_SLUG:-aagnone3/software-multi-tool}"
PR_LIMIT="${PR_LIMIT:-10}"
RUN_LIMIT="${RUN_LIMIT:-10}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

usage() {
  cat <<EOF
Usage: $(basename "$0") [--repo <owner/name>] [--prs <n>] [--runs <n>] [--json]

Print a compact repo-health snapshot for operator feedback.

Options:
  --repo <owner/name>  GitHub repo slug (default: $REPO_SLUG)
  --prs <n>            Open PR limit (default: $PR_LIMIT)
  --runs <n>           Workflow run limit (default: $RUN_LIMIT)
  --json               Emit JSON instead of human-readable text
  -h, --help           Show this help text
EOF
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

json_escape() {
  python3 - <<'PY' "$1"
import json, sys
print(json.dumps(sys.argv[1]))
PY
}

branch_upstream() {
  git -C "$REPO_ROOT" rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null || true
}

main() {
  local json_mode=false

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --repo)
        REPO_SLUG="$2"
        shift 2
        ;;
      --prs)
        PR_LIMIT="$2"
        shift 2
        ;;
      --runs)
        RUN_LIMIT="$2"
        shift 2
        ;;
      --json)
        json_mode=true
        shift
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        echo "Unknown argument: $1" >&2
        usage >&2
        exit 1
        ;;
    esac
  done

  require_cmd git
  require_cmd gh

  local branch status_short status_porcelain upstream branch_mode dirty timestamp
  branch="$(git -C "$REPO_ROOT" branch --show-current)"
  status_short="$(git -C "$REPO_ROOT" status --short --branch)"
  status_porcelain="$(git -C "$REPO_ROOT" status --porcelain)"
  upstream="$(branch_upstream)"
  timestamp="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

  if [[ -n "$status_porcelain" ]]; then
    dirty=true
  else
    dirty=false
  fi

  if [[ -n "$upstream" ]]; then
    branch_mode="tracked"
  else
    branch_mode="local-only"
  fi

  local pr_json run_json open_pr_count run_count
  pr_json="$(gh pr list --repo "$REPO_SLUG" --state open --limit "$PR_LIMIT" --json number,title,headRefName,isDraft,reviewDecision,url,updatedAt 2>/dev/null || echo '[]')"
  run_json="$(gh run list --repo "$REPO_SLUG" --limit "$RUN_LIMIT" --json databaseId,name,headBranch,status,conclusion,event,workflowName,createdAt,url 2>/dev/null || echo '[]')"

  open_pr_count="$(python3 - <<'PY' "$pr_json"
import json, sys
print(len(json.loads(sys.argv[1])))
PY
)"
  run_count="$(python3 - <<'PY' "$run_json"
import json, sys
print(len(json.loads(sys.argv[1])))
PY
)"

  if [[ "$json_mode" == true ]]; then
    printf '{\n'
    printf '  "timestamp": %s,\n' "$(json_escape "$timestamp")"
    printf '  "repoRoot": %s,\n' "$(json_escape "$REPO_ROOT")"
    printf '  "repo": %s,\n' "$(json_escape "$REPO_SLUG")"
    printf '  "branch": %s,\n' "$(json_escape "$branch")"
    printf '  "branchMode": %s,\n' "$(json_escape "$branch_mode")"
    printf '  "upstream": %s,\n' "$(json_escape "$upstream")"
    printf '  "dirty": %s,\n' "$dirty"
    printf '  "statusShort": %s,\n' "$(json_escape "$status_short")"
    printf '  "openPrCount": %s,\n' "$open_pr_count"
    printf '  "recentRunCount": %s,\n' "$run_count"
    printf '  "openPrs": %s,\n' "$pr_json"
    printf '  "recentRuns": %s\n' "$run_json"
    printf '}\n'
    exit 0
  fi

  echo -e "${BOLD}software-multi-tool repo feedback${NC}"
  echo "timestamp: $timestamp"
  echo "repo:      $REPO_SLUG"
  echo "root:      $REPO_ROOT"
  echo "branch:    $branch ($branch_mode${upstream:+, upstream: $upstream})"
  echo "dirty:     $dirty"
  echo
  echo -e "${BOLD}git status --short --branch${NC}"
  echo "$status_short"
  echo

  echo -e "${BOLD}open PRs ($open_pr_count)${NC}"
  python3 - <<'PY' "$pr_json"
import json, sys
items = json.loads(sys.argv[1])
if not items:
    print("- none")
else:
    for pr in items:
        decision = pr.get("reviewDecision") or "-"
        draft = "draft" if pr.get("isDraft") else "ready"
        print(f"- #{pr['number']} [{draft}] {pr['title']} | review={decision} | head={pr['headRefName']}")
        print(f"  {pr['url']}")
PY
  echo

  echo -e "${BOLD}recent workflow runs ($run_count)${NC}"
  python3 - <<'PY' "$run_json"
import json, sys
items = json.loads(sys.argv[1])
if not items:
    print("- none")
else:
    for run in items[:10]:
        print(f"- {run.get('workflowName') or run.get('name')}: status={run.get('status')} conclusion={run.get('conclusion')} branch={run.get('headBranch')} event={run.get('event')} created={run.get('createdAt')}")
        url = run.get('url')
        if url:
            print(f"  {url}")
PY
  echo

  echo -e "${BOLD}operator reminder${NC}"
  echo "Use this as a gate, not the work: pick one concrete deliverable after this snapshot."
}

main "$@"
