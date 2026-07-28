import { createBrowserClient } from "@supabase/ssr";

// Browser client — used inside client components (login/signup/dashboard interactions).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
