/**
 * Do `mockAdapter` and the Laravel API answer the same thing?
 *
 * This is the test the whole backend migration rests on. `httpAdapter` is a drop-in
 * for `mockAdapter` only if the two return identical payloads; every one of the
 * admin's 21 CRUD modules and all six lead forms sit above that seam and cannot
 * tell which is underneath.
 *
 * It is also the check the old Express server never had, which is why it drifted
 * out of contract in four places — a resource the frontend asked for and the
 * server had never heard of, a field renamed on one side only, and two payload
 * fields silently stripped by a Zod schema — all of them invisible until a lead
 * arrived half-empty.
 *
 *   npx tsx scripts/contract-diff.mts            # needs the API on :8000
 *   API=http://127.0.0.1:8000/api npx tsx scripts/contract-diff.mts
 *
 * Reads a bearer token from /tmp/api-token so it can see drafts and leads — the
 * two adapters only agree from a signed-in vantage point, because the API hides
 * unpublished rows from the public and the mock has no idea what a session is.
 *
 * Run it against a FRESHLY SEEDED database:
 *
 *   cd ../backend && php artisan migrate:fresh --seed --force && php artisan api:token
 *
 * Not a formality — logging in updates that user's `lastActiveAt` (by design),
 * and any lead submitted meanwhile adds a row the seed does not have. Both show
 * up here as a "diff" that is really just the database having been used.
 */
import { readFileSync } from 'node:fs';
import { mockAdapter } from '../src/services/adapters/mock.adapter';
import { RESOURCES } from '../src/services/index';

const API = process.env.API ?? 'http://127.0.0.1:8000/api';
const TOKEN = (() => {
  try { return readFileSync('/tmp/api-token', 'utf8').trim(); } catch { return ''; }
})();

/** No table behind it — the portal feature has no route and is being removed. */
const SKIP = new Set(['portal-projects']);

type Row = Record<string, unknown>;

const mock = mockAdapter();

async function live(path: string): Promise<any> {
  const res = await fetch(`${API}${path}`, {
    headers: { Accept: 'application/json', ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}) },
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text().then((t) => t.slice(0, 120))}`);
  const json = await res.json();
  return json.data ?? json;
}

/** Deep equality that treats key order as irrelevant and everything else as not. */
function same(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((v, i) => same(v, b[i]));
  }
  const ka = Object.keys(a as Row).sort();
  const kb = Object.keys(b as Row).sort();
  return ka.length === kb.length && ka.every((k, i) => k === kb[i]) && ka.every((k) => same((a as Row)[k], (b as Row)[k]));
}

const problems: string[] = [];
let checked = 0;

for (const resource of Object.values(RESOURCES)) {
  if (SKIP.has(resource)) {
    console.log(`  ${resource.padEnd(24)} chhoda — koi table nahi`);
    continue;
  }

  let m: { items: Row[] }, l: { items: Row[] };
  try {
    [m, l] = await Promise.all([
      mock.get<{ items: Row[] }>(`/${resource}`, { pageSize: 500 }),
      live(`/${resource}?pageSize=500`),
    ]);
  } catch (err) {
    problems.push(`${resource}: ${(err as Error).message}`);
    console.log(`  ${resource.padEnd(24)} ✗ ${(err as Error).message}`);
    continue;
  }

  const issues: string[] = [];

  if (m.items.length !== l.items.length) {
    issues.push(`ginti: mock ${m.items.length} vs api ${l.items.length}`);
  }

  const byId = new Map(l.items.map((r) => [String(r.id), r]));
  const missing = m.items.filter((r) => !byId.has(String(r.id))).map((r) => String(r.id));
  if (missing.length) issues.push(`api me nahi: ${missing.slice(0, 4).join(', ')}${missing.length > 4 ? ` (+${missing.length - 4})` : ''}`);

  /* Field-level, on the rows both sides have. Reported as "which keys differ",
     not "which rows", because a systematic mistake — a cast, a date format —
     shows up as the same key on every row. */
  const badKeys = new Map<string, number>();
  for (const mr of m.items) {
    const lr = byId.get(String(mr.id));
    if (!lr) continue;
    for (const k of new Set([...Object.keys(mr), ...Object.keys(lr)])) {
      if (!same(mr[k], lr[k])) badKeys.set(k, (badKeys.get(k) ?? 0) + 1);
    }
  }
  if (badKeys.size) {
    issues.push(
      'fields: ' +
        [...badKeys.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, n]) => `${k}×${n}`).join(', '),
    );
  }

  const orderMatches =
    m.items.length === l.items.length && m.items.every((r, i) => String(r.id) === String(l.items[i]?.id));

  checked++;
  if (issues.length) {
    problems.push(`${resource}: ${issues.join(' · ')}`);
    console.log(`  ${resource.padEnd(24)} ✗ ${issues.join(' · ')}`);
  } else {
    console.log(`  ${resource.padEnd(24)} ✓ ${String(m.items.length).padStart(3)} rows${orderMatches ? '' : '   (kram alag)'}`);
  }
}

console.log(`\n  ${checked} resources jaanche · ${problems.length ? `${problems.length} me farq` : 'sab mel khate hain'}`);
process.exit(problems.length ? 1 : 0);
