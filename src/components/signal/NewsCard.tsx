import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sanitizeHtml, validateAndSanitizeInput } from "@/lib/sanitizer";

interface NewsCardProps {
  title: string;
  content: string;
  icon: React.ReactNode;
  isHtml?: boolean;
}

export const NewsCard = ({ title, content, icon, isHtml }: NewsCardProps) => {
  // Sanitize HTML content to prevent XSS attacks
  const sanitizedContent = isHtml 
    ? sanitizeHtml(content)
    : validateAndSanitizeInput(content, 5000); // Allow up to 5000 chars for news content

  const plainTextContent = isHtml
    ? sanitizedContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    : sanitizedContent;

  return (
    <Card className="trading-card text-white shadow-2xl shadow-blue-500/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-xl font-display">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{plainTextContent}</p>
      </CardContent>
    </Card>
  );
};
