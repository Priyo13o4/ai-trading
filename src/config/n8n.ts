// Configure these URLs to point to your n8n HTTP endpoints that return JSON in the formats you provided.
// Leave empty ("") to disable fetching for that dataset.

export const N8N_ENDPOINTS = {
  strategyUrl: "", // e.g., https://your-n8n-host/webhook/strategy
  regimeUrl: "",   // e.g., https://your-n8n-host/webhook/regime
  currentNewsUrl: "", // e.g., https://your-n8n-host/webhook/current-news
  upcomingNewsUrl: "", // e.g., https://your-n8n-host/webhook/upcoming-news
} as const;
