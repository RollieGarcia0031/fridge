import { getSupabaseClient } from "@/lib/supabase/client";

// Client-side session cache for presets
let presetsCache: Preset[] | null = null;

/**
 * Clears the locally cached presets.
 * Should be called upon user logout to prevent data leaking between sessions.
 */
export function clearPresetsCache() {
  presetsCache = null;
}

/**
 * Retrieve all fridge presets for the logged-in user
 */
export async function getPresets(forceRefresh = false): Promise<Preset[]> {
  if (presetsCache && !forceRefresh) return presetsCache;

  const refreshToken = await getSupabaseClient().auth.getSession();

  const res = await fetch("/api/presets", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${refreshToken.data.session?.access_token}`,
    },
  });

  if (!res.ok) throw new Error("Failed to fetch presets");

  const data = await res.json();
  presetsCache = data.presets;
  return data.presets;
}

/**
 * Create or update a fridge preset
 */
export async function savePreset(
  name: string,
  ingredients: PresetIngredient[]
): Promise<Preset> {
  const refreshToken = await getSupabaseClient().auth.getSession();
  if (!refreshToken.data.session) throw new Error("Failed to retrieve session");

  const res = await fetch("/api/presets", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${refreshToken.data.session.access_token}`,
    },
    body: JSON.stringify({ name, ingredients }),
  });

  if (!res.ok) throw new Error("Failed to save preset");

  presetsCache = null;

  return (await res.json()).preset;
}

/**
 * Delete a fridge preset
 */
export async function deletePreset(id: string): Promise<void> {
  const refreshToken = await getSupabaseClient().auth.getSession();
  if (!refreshToken.data.session) throw new Error("Failed to retrieve session");

  const res = await fetch("/api/presets", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${refreshToken.data.session.access_token}`,
    },
    body: JSON.stringify({ id }),
  });

  if (!res.ok) throw new Error("Failed to delete preset");

  presetsCache = null;
}
