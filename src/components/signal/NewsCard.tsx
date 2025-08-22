import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface NewsCardProps {
  title: string;
  content: string;
  icon: React.ReactNode;
  isHtml?: boolean;
}

export const NewsCard = ({ title, content, icon, isHtml }: NewsCardProps) => (
  <Card className="bg-slate-900/50 border-slate-700 text-white shadow-2xl shadow-blue-500/10 backdrop-blur-sm">
    <CardHeader>
      <CardTitle className="flex items-center gap-3 text-xl font-display">
        {icon}
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      {isHtml ? (
        <div
          className="prose prose-sm prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      ) : (
        <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{content}</p>
      )}
    </CardContent>
  </Card>
);
