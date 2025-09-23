/**
 * Returns the display name if it's valid, otherwise returns the regular name
 * @param displayName - The user's display name (can be null, undefined, or empty)
 * @param name - The user's regular name
 * @returns The appropriate name to display
 */
export function getDisplayName(displayName?: string | null, name?: string | null): string {
  const trimmedDisplayName = displayName?.trim();
  const trimmedName = name?.trim();
  
  if (trimmedDisplayName && trimmedDisplayName.length > 0) {
    return trimmedDisplayName;
  }
  
  if (trimmedName && trimmedName.length > 0) {
    return trimmedName;
  }
  
  return "익명";
}