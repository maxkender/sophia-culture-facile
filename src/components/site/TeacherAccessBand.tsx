import { Link } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";
import { useI18n } from "@/i18n";
import { Button } from "@/components/ui/button";

export function TeacherAccessBand() {
  const { t } = useI18n();
  return (
    <section aria-labelledby="teacher-access" className="border-t border-brand-line bg-brand-surface">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-start justify-between gap-6 px-5 py-12 md:flex-row md:items-center">
        <div className="flex gap-4">
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-pink/25 text-brand-navy"><GraduationCap aria-hidden="true" className="size-5" /></span>
          <div><h2 id="teacher-access" className="text-xl font-extrabold text-brand-navy">{t.teacherAccess.title}</h2><p className="mt-1 max-w-xl text-sm leading-relaxed text-brand-navySoft">{t.teacherAccess.text}</p></div>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button asChild variant="outline"><Link to="/auth">{t.teacherAccess.login}</Link></Button>
          <Button asChild><Link to="/auth">{t.teacherAccess.join}</Link></Button>
        </div>
      </div>
    </section>
  );
}