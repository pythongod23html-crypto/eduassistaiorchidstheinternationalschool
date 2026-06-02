import { supabase } from "@/integrations/supabase/client";

/**
 * fetch() with the current Supabase access token attached as a Bearer header.
 * Use for any call to our protected /api/* server routes.
 */
export async function authedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers = new Headers(init.headers ?? {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}
