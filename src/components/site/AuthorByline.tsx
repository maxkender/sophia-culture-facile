import { Link } from "@tanstack/react-router";
import { useLang } from "@/i18n";
import { authorRoute } from "@/i18n/routes";

export type BylineAuthor = {
  slug?: string | null;
  display_name: string;
  display_title?: string | null;
  institution?: string | null;
  photo_url?: string | null;
};

/**
 * Signature d'un auteur telle qu'elle apparaît sous un cours publié.
 * Utilisée sur le site public et, à l'identique, dans l'aperçu du portail.
 */
export function AuthorByline({
  author,
  linked = true,
  size = "md",
}: {
  author: BylineAuthor;
  linked?: boolean;
  size?: "sm" | "md";
}) {
  const lang = useLang();
  const avatar = size === "sm" ? "size-10" : "size-12";
  const initials = author.display_name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();

  const body = (
    <span className="flex items-center gap-3 text-left">
      {author.photo_url ? (
        <img
          src={author.photo_url}
          alt=""
          loading="lazy"
          decoding="async"
          className={`${avatar} shrink-0 rounded-full object-cover`}
        />
      ) : (
        <span
          aria-hidden="true"
          className={`${avatar} grid shrink-0 place-items-center rounded-full bg-brand-navy/10 text-xs font-extrabold text-brand-navy`}
        >
          {initials || "·"}
        </span>
      )}
      <span className="min-w-0">
        <span className="block text-[15px] font-extrabold leading-tight text-brand-navy">
          {author.display_name || "Nom à confirmer"}
        </span>
        <span className="block text-[13px] leading-snug text-brand-navySoft">
          {author.display_title || author.institution || "Titre à confirmer"}
        </span>
      </span>
    </span>
  );

  if (linked && author.slug) {
    return (
      <Link to={authorRoute(lang)} params={{ slug: author.slug }} className="inline-flex hover:opacity-80">
        {body}
      </Link>
    );
  }
  return body;
}
