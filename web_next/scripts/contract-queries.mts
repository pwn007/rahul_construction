/**
 * The second half of the contract check.
 *
 * `contract-diff.mts` compares whole collections; this compares *queries* — the
 * search, filter, sort and pagination behaviour that `mockAdapter.applyQuery()`
 * defines and that `/admin`'s tables lean on for every screen. A backend can
 * return the right rows for `GET /projects` and still disagree about what
 * `?category=residential&sort=year&order=desc&page=2` means.
 *
 *   npx tsx scripts/contract-queries.mts
 */
import { readFileSync } from 'node:fs';
import { mockAdapter } from '../src/services/adapters/mock.adapter';

const API = process.env.API ?? 'http://127.0.0.1:8000/api';
const TOKEN = (() => {
  try { return readFileSync('/tmp/api-token', 'utf8').trim(); } catch { return ''; }
})();

const mock = mockAdapter();

async function live(path: string, params: Record<string, unknown> = {}) {
  const url = new URL(API + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url, {
    headers: { Accept: 'application/json', ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}) },
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

type Case = {
  name: string;
  path: string;
  params?: Record<string, unknown>;
  /**
   * Compare the sequence of this field's values instead of the set of ids.
   *
   * For a page taken out of a sorted list where the sort key has ties, the ids
   * are not determined by the contract and the sort key is. `faqs.order` holds
   * four distinct values across seventeen rows — seven of them are `order: 1` —
   * so at pageSize 3 the first page is *some* three of those seven. The mock's
   * `Array.prototype.sort` is stable and keeps the order they were typed in; SQL
   * has no such notion and breaks the tie on the primary key. What both must
   * agree on is that the page holds the right sort-key values in the right
   * sequence.
   */
  compareBy?: string;
};

/* Chosen to exercise one rule each, against data that actually distinguishes
   them — a filter that matches every row proves nothing. */
const CASES: Case[] = [
  { name: 'search — title contains',        path: '/projects', params: { search: 'villa' } },
  { name: 'search — case-insensitive',      path: '/projects', params: { search: 'VILLA' } },
  { name: 'search — no match',              path: '/projects', params: { search: 'zzzznope' } },
  { name: 'search — other field (excerpt)', path: '/blogs',    params: { search: 'jaipur' } },
  { name: 'filter — enum column',           path: '/projects', params: { category: 'residential' } },
  { name: 'filter — boolean true',          path: '/projects', params: { featured: true } },
  { name: 'filter — boolean false',         path: '/projects', params: { featured: false } },
  { name: 'filter — json array contains',   path: '/projects', params: { services: 'architecture' } },
  { name: "filter — literal 'all' ignored", path: '/projects', params: { category: 'all' } },
  { name: 'filter — empty string ignored',  path: '/projects', params: { category: '' } },
  { name: 'filter — unknown key',           path: '/projects', params: { nosuchcolumn: 'x' } },
  { name: 'filter — two at once',           path: '/projects', params: { category: 'residential', stage: 'completed' } },
  { name: 'filter — lead stage',            path: '/enquiries', params: { stage: 'new' } },
  { name: 'filter — lead source',           path: '/enquiries', params: { source: 'contact-form' } },
  { name: 'sort — number asc',              path: '/projects', params: { sort: 'year', order: 'asc' } },
  { name: 'sort — number desc',             path: '/projects', params: { sort: 'year', order: 'desc' } },
  { name: 'sort — string asc',              path: '/projects', params: { sort: 'title', order: 'asc' } },
  { name: 'sort — unknown column',          path: '/projects', params: { sort: 'nosuchcolumn' } },
  /* Paged with an explicit sort, where the order *is* contractual. Without one,
     see the partition check further down. */
  { name: 'page — sorted, first, size 3',   path: '/faqs',     params: { sort: 'order', page: 1, pageSize: 3 }, compareBy: 'order' },
  { name: 'page — sorted, second, size 3',  path: '/faqs',     params: { sort: 'order', page: 2, pageSize: 3 }, compareBy: 'order' },
  { name: 'page — past the end',            path: '/faqs',     params: { page: 99, pageSize: 3 } },
  { name: 'page — size 500 (all())',        path: '/faqs',     params: { pageSize: 500 } },
  { name: 'search + filter + sort + page',  path: '/projects', params: { search: 'a', category: 'residential', sort: 'year', order: 'desc', page: 1, pageSize: 2 } },
];

let failed = 0;

console.log('  ── list queries: gine gaye rows aur meta ──');

for (const c of CASES) {
  const m: any = await mock.get(c.path, c.params ?? {});
  const l = await live(c.path, c.params);
  const d = l.body?.data;

  let sameSet: boolean;

  if (c.compareBy) {
    const seq = (rows: any[]) => rows.map((r) => String(r[c.compareBy!])).join('|');
    sameSet = seq(m.items) === seq(d?.items ?? []);
  } else {
    const mIds = new Set(m.items.map((r: any) => String(r.id)));
    const lIds = new Set((d?.items ?? []).map((r: any) => String(r.id)));
    sameSet = mIds.size === lIds.size && [...mIds].every((id) => lIds.has(id as string));
  }
  const sameMeta = m.total === d?.total && m.page === d?.page && m.pageSize === d?.pageSize && m.totalPages === d?.totalPages;

  const ok = sameSet && sameMeta;
  if (!ok) failed++;

  const detail = ok
    ? `${String(m.items.length).padStart(2)}/${m.total}`
    : `mock ${m.items.length}/${m.total} (p${m.page}/${m.totalPages}) vs api ${d?.items?.length}/${d?.total} (p${d?.page}/${d?.totalPages})`;

  console.log(`  ${ok ? '✓' : '✗'} ${c.name.padEnd(34)} ${detail}`);
}

/*
 * Default order is deliberately not the mock's, so pagination is checked for the
 * property that actually matters.
 *
 * Unsorted, the mock hands back rows in the order someone typed them into
 * `src/data/*.ts`. That is not a property a table has, and it is not recoverable:
 * measured against every plausible column — createdAt, publishedAt, postedAt,
 * key, slug, route, filename, (category, order) — not one reproduces the source
 * sequence for blogs, faqs, careers, seo, settings, roles or media. Matching it
 * would mean inventing a column whose only job is to remember the order a
 * TypeScript file happened to be written in, and which becomes meaningless the
 * first time the client adds a row through /admin.
 *
 * So the API sorts by `order` where that column exists — the authored sequence,
 * written down — and by primary key otherwise, always with the key as a
 * tiebreaker so a row cannot appear on two pages.
 *
 * What pagination must still guarantee, and what this checks: the pages
 * partition the collection. Every row appears exactly once across all pages, and
 * the union is the whole set.
 */
console.log('\n  ── pagination bina sort ke: pages poora set baantte hain ──');

for (const [resource, size] of [['faqs', 3], ['gallery', 7], ['media', 5]] as const) {
  const all: any = await mock.get(`/${resource}`, { pageSize: 500 });
  const seen: string[] = [];
  const totalPages = Math.max(1, Math.ceil(all.total / size));

  for (let page = 1; page <= totalPages; page++) {
    const r = await live(`/${resource}`, { page, pageSize: size });
    seen.push(...(r.body?.data?.items ?? []).map((x: any) => String(x.id)));
  }

  const unique = new Set(seen);
  const expected = new Set(all.items.map((r: any) => String(r.id)));
  const ok = seen.length === unique.size && unique.size === expected.size && [...expected].every((id) => unique.has(id as string));
  if (!ok) failed++;
  console.log(`  ${ok ? '✓' : '✗'} ${resource.padEnd(34)} ${totalPages} pages × ${size} → ${unique.size}/${expected.size} rows, ${seen.length - unique.size} dohraav`);
}

console.log('\n  ── single record ──');

const SINGLE: Array<[string, string, string]> = [
  ['byId',            '/projects', (await mock.get<any>('/projects', {})).items[0].id],
  ['bySlug',          '/projects', (await mock.get<any>('/projects', {})).items[0].slug],
  ['by key',          '/settings', (await mock.get<any>('/settings', {})).items[0].key],
  ['by route (seo)',  '/seo',      (await mock.get<any>('/seo', {})).items[0].route],
];

for (const [label, base, key] of SINGLE) {
  const path = `${base}/${encodeURIComponent(key)}`;
  let mockRow: any = null;
  try { mockRow = await mock.get(path); } catch { /* mock 404s the same way */ }
  const l = await live(path);
  const ok = mockRow ? String(l.body?.data?.id) === String(mockRow.id) : l.status === 404;
  if (!ok) failed++;
  console.log(`  ${ok ? '✓' : '✗'} ${label.padEnd(34)} ${key.slice(0, 34)}`);
}

console.log('\n  ── errors ──');

const ERRORS: Array<[string, string, number]> = [
  ['unknown resource → 404',       '/nosuchthing', 404],
  ['unknown id → 404',             '/projects/nope', 404],
  ['lead read without token → 401', '/enquiries', 401],
];

for (const [label, path, want] of ERRORS) {
  const res = await fetch(API + path, {
    headers: { Accept: 'application/json', ...(label.includes('without token') ? {} : (TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {})) },
  });
  const ok = res.status === want;
  if (!ok) failed++;
  console.log(`  ${ok ? '✓' : '✗'} ${label.padEnd(34)} mila ${res.status}`);
}

/*
 * Write round-trip.
 *
 * The admin's edit drawer submits a *partial* row and expects a merge, not a
 * replace — `resource.service.ts::update()` sends only what changed. It also
 * expects `remove()` to answer `{ id, deleted: true }`, which is why the API
 * returns a body on DELETE rather than a 204: a 204 reaches `httpAdapter` as
 * `undefined` and the mutation's `onSuccess` has nothing to read.
 */
console.log('\n  ── likhna: create → read → update → delete ──');

async function write(method: string, path: string, body?: unknown) {
  const res = await fetch(API + path, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: res.status, data: (await res.json().catch(() => null))?.data };
}

const step = (label: string, ok: boolean, detail = '') => {
  if (!ok) failed++;
  console.log(`  ${ok ? '✓' : '✗'} ${label.padEnd(34)} ${detail}`);
};

{
  const created = await write('POST', '/faqs', {
    question: 'Contract test — safe to delete?',
    answer: 'Yes. This row is created and removed by scripts/contract-queries.mts.',
    category: 'general',
    order: 99,
  });
  const id = created.data?.id;

  step('POST → 201 + cuid id', created.status === 201 && typeof id === 'string' && id.length === 25, id ?? '');
  step("POST defaults status 'published'", created.data?.status === 'published', created.data?.status ?? '');
  step('POST stamps createdAt/updatedAt', Boolean(created.data?.createdAt && created.data?.updatedAt));

  const read = await write('GET', `/faqs/${id}`);
  step('GET the new row back', read.status === 200 && read.data?.question === 'Contract test — safe to delete?');

  /* One field only — everything else must survive. */
  const patched = await write('PUT', `/faqs/${id}`, { order: 42 });
  step('PUT merges, does not replace', patched.data?.order === 42 && patched.data?.question === 'Contract test — safe to delete?');
  step('PUT keeps the id', patched.data?.id === id);

  const hijack = await write('PUT', `/faqs/${id}`, { id: 'somebody-elses-id', order: 43 });
  step('PUT cannot reassign the id', hijack.data?.id === id, hijack.data?.id ?? '');

  const junk = await write('POST', '/faqs', {
    question: 'Contract test — unknown field',
    answer: 'x',
    category: 'general',
    order: 98,
    notAColumn: 'should be dropped',
  });
  step('POST drops unknown fields', junk.status === 201 && !('notAColumn' in (junk.data ?? {})));

  const gone = await write('DELETE', `/faqs/${id}`);
  step('DELETE → { id, deleted: true }', gone.status === 200 && gone.data?.deleted === true && gone.data?.id === id);

  const after = await write('GET', `/faqs/${id}`);
  step('deleted row is a 404', after.status === 404);

  await write('DELETE', `/faqs/${junk.data?.id}`);

  const count = await live('/faqs', { pageSize: 500 });
  step('collection back to 17', count.body?.data?.total === 17, String(count.body?.data?.total));
}

console.log(`\n  ${failed ? `${failed} jaanch fail` : 'sab jaanch paas'}`);
process.exit(failed ? 1 : 0);
