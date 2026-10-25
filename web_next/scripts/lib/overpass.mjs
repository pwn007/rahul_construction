/**
 * Overpass fetch with a vendored cache — for build-jaipur-map.mjs.
 *
 * Every response is stored as scripts/data/osm/<name>.json.gz and recorded in
 * MANIFEST.json with the exact query text, the endpoint, the date, the OSM
 * snapshot it came from and a sha256 of the uncompressed bytes. Offline runs
 * read the cache and check the hash; a query whose text has changed since it
 * was fetched is refused, so the committed data always matches its query.
 *
 * The public Overpass servers are shared and often at capacity: requests carry
 * an identifying User-Agent, rotate across the three main instances, and back
 * off exponentially (with jitter) on 429/5xx or an Overpass runtime error.
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync, gzipSync } from 'node:zlib';
import { join } from 'node:path';

const ENDPOINTS = [
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://z.overpass-api.de/api/interpreter',
];
const USER_AGENT = 'NeetuArchstone-MapBuild/1.0 (+https://neetuarchstone.com)';
const MAX_TRIES = 7;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

export function openCache(dir) {
  mkdirSync(dir, { recursive: true });
  const manifestPath = join(dir, 'MANIFEST.json');
  const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};
  const save = () => writeFileSync(manifestPath, JSON.stringify(sortKeys(manifest), null, 2) + '\n');

  /** The cached response for `name`, verified against its query and hash. */
  function read(name, query) {
    const entry = manifest[name];
    const file = join(dir, `${name}.json.gz`);
    if (!entry || !existsSync(file)) return { missing: true };
    if (entry.query !== query) return { stale: true };
    const raw = gunzipSync(readFileSync(file));
    if (sha256(raw) !== entry.sha256) throw new Error(`${name}: cached bytes do not match MANIFEST sha256 — refetch it`);
    return { data: JSON.parse(raw.toString('utf8')), entry };
  }

  /** Fetch `query` from Overpass and store it as `name`. */
  async function fetchAndStore(name, query, log = console.log) {
    let lastErr;
    for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
      const endpoint = ENDPOINTS[attempt % ENDPOINTS.length];
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'User-Agent': USER_AGENT, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'data=' + encodeURIComponent(query),
          signal: AbortSignal.timeout(300_000),
        });
        const text = await res.text();
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 120).replace(/\s+/g, ' ')}`);
        const json = JSON.parse(text);
        if (json.remark && /runtime error|timed out|out of memory/i.test(json.remark)) throw new Error(`Overpass: ${json.remark}`);
        const raw = Buffer.from(JSON.stringify(json));
        // gzip writes mtime 0 from a Buffer, so the stored bytes are deterministic
        writeFileSync(join(dir, `${name}.json.gz`), gzipSync(raw, { level: 9 }));
        manifest[name] = {
          query,
          endpoint,
          retrieved: new Date().toISOString().slice(0, 10),
          osmBase: json.osm3s?.timestamp_osm_base ?? null,
          sha256: sha256(raw),
          bytes: raw.length,
          elements: json.elements?.length ?? 0,
        };
        save();
        log(`  ✓ ${name}: ${manifest[name].elements} elements, ${(raw.length / 1e6).toFixed(1)} MB (${endpoint.replace('https://', '').split('/')[0]})`);
        return json;
      } catch (err) {
        lastErr = err;
        const wait = Math.min(120_000, 10_000 * 2 ** attempt) + Math.random() * 3000;
        log(`  … ${name}: ${String(err.message).slice(0, 100)} — retrying in ${Math.round(wait / 1000)}s`);
        await sleep(wait);
      }
    }
    throw new Error(`${name}: gave up after ${MAX_TRIES} tries — ${lastErr?.message}`);
  }

  return { read, fetchAndStore, manifest };
}

function sortKeys(o) {
  return Object.fromEntries(Object.keys(o).sort().map((k) => [k, o[k]]));
}
