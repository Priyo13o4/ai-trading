#!/bin/bash

set -euo pipefail

# Production-only helper. No environment switching is performed.

if [[ ! -f .env ]]; then
  echo "ERROR: .env not found in $(pwd)"
  echo "Create .env from .env.example and keep production endpoint values."
  exit 1
fi

echo "Production-only mode: no environment switching is performed."
echo "Current .env values:"

print_var() {
  local key="$1"
  local value
  value="$(grep -E "^${key}=" .env | tail -n 1 | cut -d '=' -f2- || true)"
  if [[ -n "$value" ]]; then
    echo "${key}=${value}"
  else
    echo "${key}=<unset>"
  fi
}

print_var "VITE_API_BASE_URL"
print_var "VITE_API_SSE_URL"
print_var "VITE_SUPABASE_URL"
print_var "VITE_TURNSTILE_SITE_KEY"
