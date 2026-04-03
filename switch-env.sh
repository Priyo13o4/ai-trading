#!/bin/bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  ./switch-env.sh status
  ./switch-env.sh local [--apply]
  ./switch-env.sh production [--apply]

Safe behavior:
  - Dry-run by default (no files are modified).
  - Use --apply to update .env from the selected source file.
  - Existing .env is backed up before overwrite.
EOF
}

print_var_from_file() {
  local file="$1"
  local key="$2"
  local value
  value="$(grep -E "^${key}=" "$file" | tail -n 1 | cut -d '=' -f2- || true)"
  if [[ -n "$value" ]]; then
    echo "${key}=${value}"
  else
    echo "${key}=<unset>"
  fi
}

print_summary() {
  local file="$1"
  if [[ ! -f "$file" ]]; then
    echo "${file} not found"
    return
  fi

  echo "Summary for ${file}:"
  print_var_from_file "$file" "VITE_ENV_NAME"
  print_var_from_file "$file" "VITE_PUBLIC_APP_URL"
  print_var_from_file "$file" "VITE_API_BASE_URL"
  print_var_from_file "$file" "VITE_API_SSE_URL"
  print_var_from_file "$file" "VITE_SUPABASE_URL"
  print_var_from_file "$file" "VITE_TURNSTILE_SITE_KEY_PROD"
  print_var_from_file "$file" "VITE_TURNSTILE_SITE_KEY_DEV"
  print_var_from_file "$file" "VITE_TURNSTILE_SITE_KEY"
}

target="${1:-status}"
apply_flag="${2:-}"

if [[ "$target" != "status" && "$target" != "local" && "$target" != "production" ]]; then
  usage
  exit 1
fi

if [[ -n "$apply_flag" && "$apply_flag" != "--apply" ]]; then
  usage
  exit 1
fi

if [[ "$target" == "status" ]]; then
  if [[ -f .env ]]; then
    if [[ -f .env.local ]] && cmp -s .env .env.local; then
      echo "Current .env matches .env.local"
    elif [[ -f .env.production ]] && cmp -s .env .env.production; then
      echo "Current .env matches .env.production"
    else
      echo "Current .env does not exactly match .env.local or .env.production"
    fi
    print_summary ".env"
  else
    echo "No .env file currently present in $(pwd)"
  fi

  print_summary ".env.local"
  print_summary ".env.production"
  exit 0
fi

src_file=".env.${target}"

if [[ ! -f "$src_file" ]]; then
  echo "ERROR: ${src_file} not found in $(pwd)"
  exit 1
fi

echo "Selected target: ${target} (${src_file})"
print_summary "$src_file"

if [[ "$apply_flag" != "--apply" ]]; then
  echo "Dry-run only. No files changed."
  echo "Apply with: ./switch-env.sh ${target} --apply"
  exit 0
fi

if [[ -f .env ]] && cmp -s .env "$src_file"; then
  echo ".env already matches ${src_file}; no changes needed."
  exit 0
fi

if [[ -f .env ]]; then
  backup_file=".env.backup.$(date +%Y%m%d_%H%M%S)"
  cp .env "$backup_file"
  echo "Backed up existing .env to ${backup_file}"
fi

cp "$src_file" .env
echo "Updated .env from ${src_file}"
print_summary ".env"
