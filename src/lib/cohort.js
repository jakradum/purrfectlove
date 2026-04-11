/**
 * Cohort assignment — deterministic, uniform distribution over 1–100.
 *
 * Implements the JS equivalent of PostgreSQL:
 *   abs(hashtext(user_id::text)) % 100 + 1
 *
 * Uses FNV-1a 32-bit, which gives the same properties (determinism +
 * uniformity) for UUID inputs. Math.imul handles 32-bit overflow correctly.
 *
 * Rules:
 *   - Team members (isTeamMember === true) always receive null.
 *   - Cohort is written once at creation and never updated.
 */

function fnv1a32(str) {
  let hash = 2166136261; // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619); // FNV prime, 32-bit
  }
  return hash >>> 0; // convert to unsigned 32-bit
}

/**
 * @param {string} userId  — Supabase auth user UUID
 * @param {boolean} isTeamMember
 * @returns {number|null}  — integer 1–100, or null for team members
 */
export function computeCohort(userId, isTeamMember = false) {
  if (isTeamMember) return null;
  const hash = fnv1a32(userId);
  return (hash % 100) + 1;
}
