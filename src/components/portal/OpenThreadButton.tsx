import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { openConversation } from "@/lib/messaging";

/** Admin-side shortcut: opens (or creates) the thread with one author, optionally about one course. */
export function OpenThreadButton({
  profileId,
  courseId = null,
  label = "Message this author",
}: {
  profileId: string;
  courseId?: string | null;
  label?: string;
}) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  return (
    <Button
      type="button"
      variant="pillSecondary"
      size="pillSm"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const id = await openConversation(profileId, courseId);
          await navigate({ to: "/auteurs/admin/messages", search: { thread: id } });
        } catch {
          toast.error("The thread could not be opened.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <MessageSquare className="size-4" aria-hidden="true" /> {label}
    </Button>
  );
}
