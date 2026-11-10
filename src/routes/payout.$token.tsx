import { createFileRoute } from "@tanstack/react-router";
import { CONTACT_EMAIL } from "@/config/links";
export const Route = createFileRoute("/payout/$token")({
  head: () => ({ meta: [
    { title: "Poster payments | Vik Studios" }, { name: "description", content: "Vik Studios poster payments are managed through a Ruul invitation." },
    { property: "og:title", content: "Poster payments | Vik Studios" }, { property: "og:description", content: "Vik Studios poster payments are managed through a Ruul invitation." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: () => <main className="mx-auto max-w-lg px-5 py-12 text-brand-navy"><h1 className="text-2xl font-bold">Payments are now managed through Ruul</h1><p className="mt-4">Enter the email you want to use for Ruul on your dashboard. We'll invite you by email. Create your account from Ruul's invitation.</p><p className="mt-4">Questions? <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p></main>,
});
