#!/bin/bash

# Extract parts using sed and put them back together in a temporary file
cp "../ai-trading_frontend/src/features/news/components/WeeklyPlaybookPanel.tsx" temp_panel.tsx

# This is a bit risky to do with sed blindly without matching lines perfectly. 
# Better to use node to parse and replace strings exactly.
