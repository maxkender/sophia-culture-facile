import { useEffect, useState } from "react";

const KEY = "hub.showTestAccounts";
const EVT = "hub-show-test";

/** Admin preference: show creators flagged is_test in UGC lists (off by default, per browser). */
export function useShowTest(): [boolean, (v: boolean) => void] {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const read = () => setOn(window.localStorage.getItem(KEY) === "1");
    read(); window.addEventListener(EVT, read); return () => window.removeEventListener(EVT, read);
  }, []);
  return [on, (v) => { window.localStorage.setItem(KEY, v ? "1" : "0"); window.dispatchEvent(new Event(EVT)); }];
}

export const TEST_CHIP = "ml-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase text-brand-navySoft";
