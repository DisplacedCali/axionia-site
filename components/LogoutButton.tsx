"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      className="font-mono text-[11px] uppercase tracking-[0.12em] text-gray-warm hover:text-navy underline"
    >
      Log out
    </button>
  );
}
