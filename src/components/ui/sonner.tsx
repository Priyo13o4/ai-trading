import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "group toast border-border bg-card text-card-foreground shadow-lg",
          description: "text-muted-foreground",
          error: "border-destructive/40 bg-destructive/10 text-destructive",
          success: "border-[hsl(var(--success)/0.35)] bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success-foreground))]",
          warning: "border-amber-500/40 bg-amber-500/10 text-amber-200",
          info: "border-primary/40 bg-primary/10 text-foreground",
          actionButton:
            "bg-primary text-primary-foreground",
          cancelButton:
            "bg-muted text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
