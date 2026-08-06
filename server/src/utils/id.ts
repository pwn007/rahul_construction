import { randomBytes } from 'node:crypto';

/** Collision-resistant, roughly sortable id. Replaced by Prisma's cuid() in Phase 2. */
export function createId(prefix = 'c'): string {
  return `${prefix}${Date.now().toString(36)}${randomBytes(5).toString('hex')}`;
}
