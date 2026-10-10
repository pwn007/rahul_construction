<?php

namespace App\Support;

/**
 * Collision-resistant, roughly sortable 25-character id.
 *
 * The shape is not decorative. Every id in this system was minted by the
 * frontend's `lib/id.ts` or by Prisma's `cuid()`, both of which produce
 * `c` + 24 characters, and `web_next/src/types/domain.ts` types every `id` as a
 * plain string. Handing out auto-increment integers instead would work right up
 * until a record created before the migration met one created after it.
 *
 * Layout, base-36 throughout: `c` · 8 chars of millisecond timestamp (sortable,
 * good until the year 5138) · 4 chars of per-process counter (distinguishes ids
 * minted inside the same millisecond) · 4 chars of pid · 8 chars of randomness.
 */
final class Cuid
{
    private static int $counter = 0;

    public static function make(): string
    {
        $timestamp = base_convert((string) (int) (microtime(true) * 1000), 10, 36);
        $counter = str_pad(base_convert((string) (self::$counter++ % 1_679_616), 10, 36), 4, '0', STR_PAD_LEFT);
        $fingerprint = str_pad(base_convert((string) (getmypid() % 1_679_616), 10, 36), 4, '0', STR_PAD_LEFT);
        $random = str_pad(bin2hex(random_bytes(4)), 8, '0', STR_PAD_LEFT);

        return 'c'.substr(str_pad($timestamp, 8, '0', STR_PAD_LEFT), -8).$counter.$fingerprint.substr($random, 0, 8);
    }
}
