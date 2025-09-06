#!/bin/bash

# Environment Switcher Script
# Usage: ./switch-env.sh [dev|prod]

ENV=${1:-dev}

case $ENV in
  "dev")
    echo "🔄 Switching to DEVELOPMENT environment..."
    cp .env.development .env
    echo "✅ Now using development settings (localhost:8080)"
    ;;
  "prod")
    echo "🔄 Switching to PRODUCTION environment..."
    cp .env.production .env
    echo "✅ Now using production settings (api.pipfactor.com)"
    ;;
  *)
    echo "❌ Usage: ./switch-env.sh [dev|prod]"
    echo "Current environment:"
    cat .env
    exit 1
    ;;
esac

echo ""
echo "Current .env contents:"
cat .env
