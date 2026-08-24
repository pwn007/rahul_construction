/** Collision-resistant, sortable-ish id generator (cuid-flavoured, no dependency). */
export function createId(prefix = 'c'): string {
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}${time}${rand}`;
}
