import { homeFor, resolveAccountRole } from "@/lib/account-role";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "./AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [valid, setValid] = useState(false);
  const [password, setPassword] = useState("");
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    setValid(hash.get("type") === "recovery" || window.location.search.includes("type=recovery"));
  }, []);
  async function submit(event: FormEvent) {
    event.preventDefault();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated.");
    const role = await resolveAccountRole();
    window.location.assign(role ? homeFor(role) : "/auteurs/login");
  }
  return <AuthShell title="New password" intro="Choose a new password for your Sophia account.">{valid ? <form onSubmit={submit} className="space-y-5"><div className="space-y-2"><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" /></div><Button type="submit" variant="pillPink" size="pillSm" className="w-full">Save</Button></form> : <p className="text-sm text-brand-navySoft">Open this page from the link you received by email.</p>}</AuthShell>;
}