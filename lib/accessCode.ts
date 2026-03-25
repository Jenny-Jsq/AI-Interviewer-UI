import { fetchAccessCode, updateAccessCodeUsedCount } from "./supabaseAdmin";

export interface AccessCodeRecord {
  code: string;
  max_uses: number;
  used_count: number;
  status: string;
}

async function getRecord(code: string): Promise<AccessCodeRecord | null> {
  const response = await fetchAccessCode(code);
  if (!response.ok) {
    return null;
  }

  const rows = (await response.json()) as AccessCodeRecord[];
  return rows[0] ?? null;
}

export async function validateAccessCode(code: string): Promise<{
  valid: boolean;
  remainingUses: number;
  reason?: string;
}> {
  const normalizedCode = code.trim();
  if (!normalizedCode) {
    return { valid: false, remainingUses: 0, reason: "Access code is required" };
  }

  const data = await getRecord(normalizedCode);
  if (!data) {
    return { valid: false, remainingUses: 0, reason: "Access code not found" };
  }

  if (data.status !== "active") {
    return { valid: false, remainingUses: 0, reason: "Access code is inactive" };
  }

  const remainingUses = Math.max(0, data.max_uses - data.used_count);
  if (remainingUses <= 0) {
    return { valid: false, remainingUses: 0, reason: "Access code usage limit reached" };
  }

  return { valid: true, remainingUses };
}

export async function consumeAccessCode(code: string): Promise<{
  ok: boolean;
  remainingUses: number;
  reason?: string;
}> {
  const normalizedCode = code.trim();
  if (!normalizedCode) {
    return { ok: false, remainingUses: 0, reason: "Access code is required" };
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const data = await getRecord(normalizedCode);

    if (!data) {
      return { ok: false, remainingUses: 0, reason: "Access code not found" };
    }

    if (data.status !== "active") {
      return { ok: false, remainingUses: 0, reason: "Access code is inactive" };
    }

    if (data.used_count >= data.max_uses) {
      return { ok: false, remainingUses: 0, reason: "Access code usage limit reached" };
    }

    const nextUsedCount = data.used_count + 1;
    const updateResponse = await updateAccessCodeUsedCount(normalizedCode, data.used_count, nextUsedCount);

    if (!updateResponse.ok) {
      continue;
    }

    const updatedRows = (await updateResponse.json()) as Array<Pick<AccessCodeRecord, "max_uses" | "used_count">>;
    const updated = updatedRows[0];

    if (updated) {
      return {
        ok: true,
        remainingUses: Math.max(0, updated.max_uses - updated.used_count),
      };
    }
  }

  return { ok: false, remainingUses: 0, reason: "Failed to consume access code, please retry" };
}
