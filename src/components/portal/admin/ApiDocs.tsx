import { PageTitle, PortalCard } from "../ui";

const LIST_EXAMPLE = `GET /api/public/app/courses?updated_since=2026-01-01T00:00:00Z
x-api-key: <APP_EXPORT_KEY>

{
  "count": 12,
  "updated_since": "2026-01-01T00:00:00Z",
  "courses": [ { ...course }, ... ]
}`;

const COURSE_EXAMPLE = `GET /api/public/app/courses/why-is-the-sky-blue
x-api-key: <APP_EXPORT_KEY>

{
  "id": "uuid",
  "slug": "why-is-the-sky-blue",
  "title": "Why is the sky blue?",
  "subtitle": "Light and atmosphere",
  "subject_area": "Sciences",
  "published_at": "2026-02-10T09:00:00Z",
  "updated_at": "2026-02-12T11:30:00Z",
  "public_full_text": true,
  "screens": [
    { "screen_number": 1, "screen_title": "...", "body": "...", "image_idea": "..." }
  ],
  "sources": [ { "claim": "...", "reference": "...", "page": "12" } ],
  "author": {
    "display_name": "Raphael Seguin",
    "display_title": "PhD in Marine Ecology, Universite de Montpellier",
    "institution": "Universite de Montpellier",
    "photo_url": "https://... (signed, 7 days)"
  }
}`;

/** Documentation de l'export JSON, à transmettre à l'équipe de l'application. */
export function ApiDocs() {
  return (
    <div>
      <PageTitle
        title="App export API"
        lead="Read-only JSON feed of published courses, for whoever builds the mobile app side."
      />
      <div className="grid max-w-4xl gap-6">
        <PortalCard>
          <h2 className="text-sm font-bold text-brand-navy">Authentication</h2>
          <p className="mt-3 text-sm leading-relaxed text-brand-navySoft">
            Every request needs the shared key, either as the header <code>x-api-key</code> or as the query
            parameter <code>?key=</code>. The key is stored as the project secret <code>APP_EXPORT_KEY</code> and
            is never shown here. Requests without it get 401.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-brand-navySoft">
            Base URL: <code>https://sophia-culture.com</code>. Only courses with the status “published” are
            returned. Nothing is writable through these endpoints.
          </p>
        </PortalCard>

        <PortalCard>
          <h2 className="text-sm font-bold text-brand-navy">List — GET /api/public/app/courses</h2>
          <p className="mt-3 text-sm text-brand-navySoft">
            Optional <code>updated_since</code> (ISO 8601) returns only courses changed after that moment, for
            incremental sync.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-2xl bg-brand-surface p-4 text-xs leading-6 text-brand-navy">
            {LIST_EXAMPLE}
          </pre>
        </PortalCard>

        <PortalCard>
          <h2 className="text-sm font-bold text-brand-navy">Single course — GET /api/public/app/courses/&#123;slug&#125;</h2>
          <pre className="mt-4 overflow-x-auto rounded-2xl bg-brand-surface p-4 text-xs leading-6 text-brand-navy">
            {COURSE_EXAMPLE}
          </pre>
        </PortalCard>

        <PortalCard>
          <h2 className="text-sm font-bold text-brand-navy">Notes</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-brand-navySoft">
            <li>Screens are always returned in order, numbered 1 to 5.</li>
            <li>
              <code>public_full_text</code> only affects the public web page. The export always carries the five
              screens.
            </li>
            <li>Bold is written as <code>**double asterisks**</code> in screen bodies. No other formatting.</li>
            <li>Photo URLs are signed and valid for seven days — re-fetch rather than storing them forever.</li>
            <li>404 is returned for an unknown or unpublished slug.</li>
          </ul>
        </PortalCard>
      </div>
    </div>
  );
}
