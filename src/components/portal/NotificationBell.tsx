import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/portal";
import {
  NOTIFICATION_LABEL,
  useMarkNotifications,
  useNotifications,
  type NotificationRow,
} from "./useNotifications";

function targetFor(item: NotificationRow) {
  if (item.type === "message") return { to: "/auteurs/messages" as const, params: undefined };
  if (item.course_id) {
    return { to: "/auteurs/courses/$courseId" as const, params: { courseId: item.course_id } };
  }
  return { to: "/auteurs/open" as const, params: undefined };
}

export function NotificationBell({ profileId }: { profileId: string }) {
  const { data: items = [] } = useNotifications(profileId);
  const mark = useMarkNotifications(profileId);
  const unread = items.filter((item) => !item.read_at).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-5" />
          {unread > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-portal-amber px-1 text-[10px] font-bold text-brand-navy">
              {unread}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] p-0">
        <div className="flex items-center justify-between border-b border-brand-line px-4 py-3">
          <p className="text-sm font-bold text-brand-navy">Notifications</p>
          {unread > 0 ? (
            <button
              type="button"
              className="text-xs font-semibold text-portal-accent hover:underline"
              onClick={() => mark.mutate("all")}
            >
              Mark all read
            </button>
          ) : null}
        </div>
        <div className="max-h-[22rem] overflow-y-auto">
          {items.length === 0 ? (
            <p className="px-4 py-6 text-sm text-brand-navySoft">Nothing yet.</p>
          ) : (
            <ul className="divide-y divide-brand-line">
              {items.map((item) => {
                const target = targetFor(item);
                return (
                  <li key={item.id}>
                    <Link
                      to={target.to}
                      params={target.params as never}
                      onClick={() => {
                        if (!item.read_at) mark.mutate([item.id]);
                      }}
                      className={cn(
                        "block px-4 py-3 transition hover:bg-portal-bg",
                        item.read_at ? "opacity-70" : "bg-portal-amber/5",
                      )}
                    >
                      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-brand-navySoft">
                        {!item.read_at ? (
                          <span className="size-1.5 rounded-full bg-portal-amber" aria-hidden="true" />
                        ) : null}
                        {NOTIFICATION_LABEL[item.type] ?? "Update"}
                      </p>
                      <p className="mt-1 text-sm leading-snug text-brand-navy">{item.body}</p>
                      <p className="mt-1 text-xs text-brand-navySoft">{formatDateTime(item.created_at)}</p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
