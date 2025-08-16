import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function NewsCard({ title, content, isHtml = false, icon }: { title: string; content: string; isHtml?: boolean; icon?: React.ReactNode }) {
  return (
    <Card className="bg-slate-800/80 backdrop-blur border border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">{icon}{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isHtml ? (
          <div className="prose prose-invert max-w-none text-sm text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: content }} />
        ) : (
          <p className="text-sm text-gray-300 leading-relaxed">{content}</p>
        )}
      </CardContent>
    </Card>
  );
}
