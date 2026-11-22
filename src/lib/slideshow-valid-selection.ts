/** Scope a freshly validated plan to the application IDs explicitly confirmed in the Hub. */
export function scopeValidSelection<T extends { valid: { id: string }[]; skipped: { id: string }[] }>(selection: T, applicationIds?: readonly string[]) {
  if (applicationIds === undefined) return selection;
  const ids = new Set(applicationIds);
  return {
    ...selection,
    valid: selection.valid.filter((row) => ids.has(row.id)),
    skipped: selection.skipped.filter((row) => ids.has(row.id)),
  };
}