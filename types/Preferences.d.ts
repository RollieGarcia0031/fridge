/**
 * Supported dietary restrictions a user can opt into. Generated dishes are
 * constrained to respect every active restriction.
 */
type DietaryRestriction =
  | "vegetarian"
  | "vegan"
  | "pescatarian"
  | "gluten-free"
  | "dairy-free"
  | "nut-free"
  | "halal"
  | "keto";

/**
 * The user's persisted preferences, stored one row per user.
 */
interface UserPreferences {
  /**
   * Primary key referencing auth.users(id)
   */
  user_id: string;
  /**
   * Active dietary restrictions; empty array means no restrictions
   */
  dietary_restrictions: DietaryRestriction[];
  /**
   * When the preferences row was created (ISO timestamp)
   */
  created_at: string;
  /**
   * When the preferences row was last updated (ISO timestamp)
   */
  updated_at: string;
}