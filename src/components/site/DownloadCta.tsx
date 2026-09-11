import { Link } from "@tanstack/react-router";
import { Button, type ButtonProps } from "@/components/ui/button";
import { downloadHref, IS_EXTERNAL_DOWNLOAD } from "@/config/links";
import { useLocalePath } from "@/i18n";

type Props = {
  children: React.ReactNode;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
};

/** Unique point d'entrée des CTA de téléchargement (lien intelligent ou page de téléchargement). */
export function DownloadCta({ children, variant = "pill", size = "pill", className }: Props) {
  const href = downloadHref();
  const downloadPath = useLocalePath("download");
  return (
    <Button asChild variant={variant} size={size} className={className}>
      {IS_EXTERNAL_DOWNLOAD ? (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      ) : (
        <Link to={downloadPath}>{children}</Link>
      )}
    </Button>
  );
}
