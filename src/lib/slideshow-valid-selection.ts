/** Keep the first requested number per country in the validated preview's existing order. */
export function selectCountryQuantities<T extends { country: string }>(rows: readonly T[], quantities: ReadonlyMap<string, number>): T[] {
  const used = new Map<string, number>();
  return rows.filter((row) => {
    const count = used.get(row.country) ?? 0;
    const requested = quantities.get(row.country) ?? 0;
    if (!Number.isFinite(requested) || count >= Math.max(0, Math.floor(requested))) return false;
    used.set(row.country, count + 1);
    return true;
  });
}

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