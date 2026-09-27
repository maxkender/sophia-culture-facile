import { useEffect } from "react";
import { homeFor, resolveAccountRole } from "@/lib/account-role";

/** On a login page, a user who is already signed in goes straight to their space. */
export function useRedirectIfSignedIn() {
  useEffect(() => {
    void resolveAccountRole().then((role) => {
      if (role) window.location.replace(homeFor(role));
    });
  }, []);
}
