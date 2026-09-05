import { getSupabaseClient } from "@/lib/supabase/client";

// Client-side session cache for the user's dietary preferences. The cache is
// owned by a specific user id plus a generation counter, so a response
// captured for a stale session — or superseded by a newer mutation — can never
// overwrite current data.
let preferencesCache: UserPreferences | null = null;
let preferencesCacheUserId: string | null = null;
let preferencesCacheGeneration = 0;

/**
 * Clears the locally cached preferences.
 * Should be called upon user logout to prevent data leaking between sessions.
 */
export function clearPreferencesCache() {
  preferencesCache = null;
  preferencesCacheUserId = null;
  // invalidate the write-right of any response captured before the logout
  preferencesCacheGeneration++;
}

/**
 * Resolves the current logged-in user from the Supabase session.
 */
async function getCurrentUser() {
  const refreshToken = await getSupabaseClient().auth.getSession();
  const user = refreshToken.data.session?.user;
  if (!user?.id) throw new Error("Failed to retrieve session");
  return user;
}

/**
 * Retrieve the dietary preferences for the logged-in user.
 *
 * @param forceRefresh - Whether to bypass the cache and fetch fresh data
 */
export async function getPreferences(forceRefresh = false): Promise<UserPreferences> {
  const user = await getCurrentUser();

  // the cache only serves its owner's data
  if (!forceRefresh && preferencesCache && preferencesCacheUserId === user.id) {
    return preferencesCache;
  }

  // capture this request's user and generation so a response that lands after
  // a logout or a preference mutation is not written into the cache
  const requestGeneration = preferencesCacheGeneration;
  const refreshToken = await getSupabaseClient().auth.getSession();

  const res = await fetch("/api/preferences", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${refreshToken.data.session?.access_token}`,
    },
  });

  if (!res.ok) throw new Error("Failed to fetch preferences");

  const data = await res.json();

  // only the cache owner's own, still-current response may be cached
  if (
    preferencesCacheGeneration === requestGeneration &&
    (preferencesCacheUserId === user.id || preferencesCacheUserId === null)
  ) {
    preferencesCache = data.preferences;
    preferencesCacheUserId = user.id;
  }

  return data.preferences;
}

/**
 * Save the dietary preferences for the logged-in user.
 *
 * @param dietaryRestrictions - restrictions to persist for the user
 * @returns the saved preferences row
 */
export async function savePreferences(
  dietaryRestrictions: DietaryRestriction[],
): Promise<UserPreferences> {
  const user = await getCurrentUser();
  const refreshToken = await getSupabaseClient().auth.getSession();

  // this mutation supersedes any response captured earlier, so previous
  // requests can no longer write their (older) data to the cache
  const requestGeneration = ++preferencesCacheGeneration;

  const res = await fetch("/api/preferences", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${refreshToken.data.session?.access_token}`,
    },
    body: JSON.stringify({ dietaryRestrictions }),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const message = errorBody.error || `Error ${res.status}: ${res.statusText}`;
    throw new Error(message);
  }

  const data = await res.json();

  // only the freshest mutation may own the cache
  if (
    preferencesCacheGeneration === requestGeneration &&
    (preferencesCacheUserId === user.id || preferencesCacheUserId === null)
  ) {
    preferencesCache = data.preferences;
    preferencesCacheUserId = user.id;
  }

  return data.preferences;
}