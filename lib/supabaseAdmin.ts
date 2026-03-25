const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.");
}

function buildHeaders(extra: Record<string, string> = {}): HeadersInit {
  return {
    apikey: supabaseServiceRoleKey || "",
    Authorization: `Bearer ${supabaseServiceRoleKey || ""}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

export async function fetchAccessCode(code: string): Promise<Response> {
  const url = `${supabaseUrl}/rest/v1/access_codes?code=eq.${encodeURIComponent(
    code,
  )}&select=code,max_uses,used_count,status&limit=1`;

  return fetch(url, {
    method: "GET",
    headers: buildHeaders(),
    cache: "no-store",
  });
}

export async function updateAccessCodeUsedCount(code: string, currentUsedCount: number, nextUsedCount: number): Promise<Response> {
  const url = `${supabaseUrl}/rest/v1/access_codes?code=eq.${encodeURIComponent(
    code,
  )}&used_count=eq.${currentUsedCount}&status=eq.active`;

  return fetch(url, {
    method: "PATCH",
    headers: buildHeaders({ Prefer: "return=representation" }),
    body: JSON.stringify({ used_count: nextUsedCount }),
    cache: "no-store",
  });
}
