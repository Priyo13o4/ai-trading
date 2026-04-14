import sys

content = open(sys.argv[1]).read()

if "import { api }" not in content:
    content = content.replace("import { useState", "import { api } from '@/services/api';\nimport { mapApiNewsItem } from '@/features/news/adapters';\nimport { useState")

handler = """
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);

  const handleHistoricalLinkClick = async (id: number) => {
    try {
      setIsFetchingHistory(true);
      const res = await api.getNewsById(id);
      if (res.data) {
        const mapped = mapApiNewsItem(res.data);
        setSelectedNews(mapped as NewsItem);
      }
    } catch (err) {
      console.error('Failed to fetch historical news:', err);
    } finally {
      setIsFetchingHistory(false);
    }
  };
"""

content = content.replace("  const loadMoreRef = useRef<HTMLDivElement>(null);", "  const loadMoreRef = useRef<HTMLDivElement>(null);\n" + handler)

content = content.replace("                            onToggleExpand={() =>", "                            onHistoricalLinkClick={handleHistoricalLinkClick}\n                            onToggleExpand={() =>")

with open(sys.argv[1], "w") as f:
    f.write(content)

