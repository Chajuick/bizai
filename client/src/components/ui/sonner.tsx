import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",

          "--success-bg": "color-mix(in oklch, var(--blueprint-success) 12%, white)",
          "--success-text": "var(--blueprint-success)",
          "--success-border": "color-mix(in oklch, var(--blueprint-success) 30%, transparent)",

          "--warning-bg": "color-mix(in oklch, var(--blueprint-warning) 12%, white)",
          "--warning-text": "var(--blueprint-warning)",
          "--warning-border": "color-mix(in oklch, var(--blueprint-warning) 30%, transparent)",

          "--error-bg": "color-mix(in oklch, var(--blueprint-danger) 12%, white)",
          "--error-text": "var(--blueprint-danger)",
          "--error-border": "color-mix(in oklch, var(--blueprint-danger) 30%, transparent)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
