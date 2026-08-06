import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Repository } from './repository.js';
import type { ListQuery, Paginated } from '../types/domain.js';
import { createId } from '../utils/id.js';

const DATA_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');

/** Fields scanned by the `?search=` parameter — mirrors the frontend mock adapter. */
const SEARCHABLE = ['title', 'name', 'question', 'label', 'heading', 'filename', 'email', 'key', 'excerpt', 'summary'];

/**
 * File-backed repository for Phase 1.
 *
 * Reads are cached in memory after first load; writes persist back to disk so the
 * prototype behaves like a real API across restarts. Deliberately simple — its only
 * job is to satisfy the Repository contract until Prisma replaces it.
 */
export class JsonRepository<T extends { id: string }> implements Repository<T> {
  private cache: T[] | null = null;

  constructor(private readonly filename: string) {}

  private get filePath(): string {
    return path.join(DATA_DIR, this.filename);
  }

  private async load(): Promise<T[]> {
    if (this.cache) return this.cache;
    if (!existsSync(this.filePath)) {
      this.cache = [];
      return this.cache;
    }
    const raw = await readFile(this.filePath, 'utf8');
    this.cache = JSON.parse(raw) as T[];
    return this.cache;
  }

  private async persist(rows: T[]): Promise<void> {
    this.cache = rows;
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(this.filePath, JSON.stringify(rows, null, 2), 'utf8');
  }

  async findMany(query: ListQuery = {}): Promise<Paginated<T>> {
    const rows = await this.load();
    const { page = 1, pageSize = 24, search, sort, order = 'asc', ...filters } = query;

    let out = [...rows] as Record<string, unknown>[];

    if (search) {
      const q = String(search).toLowerCase();
      out = out.filter((row) =>
        SEARCHABLE.some((field) => {
          const value = row[field];
          return typeof value === 'string' && value.toLowerCase().includes(q);
        }),
      );
    }

    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null || value === '' || value === 'all') continue;
      out = out.filter((row) => {
        const rowValue = row[key];
        if (Array.isArray(rowValue)) return rowValue.includes(value as never);
        return String(rowValue) === String(value);
      });
    }

    if (sort) {
      out.sort((a, b) => {
        const av = a[sort];
        const bv = b[sort];
        if (typeof av === 'number' && typeof bv === 'number') return order === 'asc' ? av - bv : bv - av;
        const as = String(av ?? '');
        const bs = String(bv ?? '');
        return order === 'asc' ? as.localeCompare(bs) : bs.localeCompare(as);
      });
    }

    const total = out.length;
    const size = Number(pageSize);
    const current = Number(page);

    return {
      items: out.slice((current - 1) * size, current * size) as unknown as T[],
      total,
      page: current,
      pageSize: size,
      totalPages: Math.max(1, Math.ceil(total / size)),
    };
  }

  async findOne(idOrSlug: string): Promise<T | null> {
    const rows = (await this.load()) as unknown as Record<string, unknown>[];
    const found = rows.find(
      (row) => row['id'] === idOrSlug || row['slug'] === idOrSlug || row['key'] === idOrSlug || row['route'] === idOrSlug,
    );
    return (found as unknown as T) ?? null;
  }

  async create(dto: Partial<T>): Promise<T> {
    const rows = await this.load();
    const now = new Date().toISOString();
    const row = { id: createId(), createdAt: now, updatedAt: now, status: 'published', ...dto } as unknown as T;
    await this.persist([...rows, row]);
    return row;
  }

  async update(id: string, dto: Partial<T>): Promise<T | null> {
    const rows = await this.load();
    const index = rows.findIndex((row) => row.id === id);
    if (index === -1) return null;

    const updated = { ...rows[index], ...dto, id, updatedAt: new Date().toISOString() } as unknown as T;
    const next = [...rows];
    next[index] = updated;
    await this.persist(next);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const rows = await this.load();
    const next = rows.filter((row) => row.id !== id);
    if (next.length === rows.length) return false;
    await this.persist(next);
    return true;
  }
}
