import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function NewsCard({ title, content, isHtml = false, icon }: { title: string; content: string; isHtml?: boolean; icon?: React.ReactNode }) {
  return (
    <Card className="bg-card/70 backdrop-blur border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">{icon}{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isHtml ? (
          <div className="prose prose-invert max-w-none text-sm text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: content }} />
        ) : (
          <p className="text-sm text-muted-foreground leading-relaxed">{content}</p>
        )}
      </CardContent>
    </Card>
  );
}
