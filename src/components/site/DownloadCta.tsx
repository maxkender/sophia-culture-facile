import { Link } from "@tanstack/react-router";
import { Button, type ButtonProps } from "@/components/ui/button";
import { downloadHref, IS_EXTERNAL_DOWNLOAD } from "@/config/links";

type Props = {
  children: React.ReactNode;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
};

/** Unique point d'entrée des CTA de téléchargement (lien intelligent ou /telecharger). */
export function DownloadCta({ children, variant = "pill", size = "pill", className }: Props) {
  const href = downloadHref();
  return (
    <Button asChild variant={variant} size={size} className={className}>
      {IS_EXTERNAL_DOWNLOAD ? (
        <a href={href} rel="noopener">
          {children}
        </a>
      ) : (
        <Link to="/telecharger">{children}</Link>
      )}
    </Button>
  );
}
