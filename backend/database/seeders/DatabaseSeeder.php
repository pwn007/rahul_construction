<?php

namespace Database\Seeders;

use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Loads `database/seeders/data/*.json` — 231 records across 26 resources.
 *
 * Those files are generated, not authored: `web_next/scripts/export-seed.mts`
 * dumps the frontend's typed `src/data/*.ts`, which is the authority for content
 * in this project and what `mockAdapter` has been serving all along. Retyping it
 * into PHP would be ~2,500 lines of transcription and a guarantee that the two
 * drift. Regenerate with `npx tsx scripts/export-seed.mts` from `web_next/`.
 */
class DatabaseSeeder extends Seeder
{
    /**
     * Insertion order, and it is load-bearing.
     *
     * Foreign keys: `users.roleId` → roles; `applications.jobId` → careers;
     * `testimonials.projectId` and `gallery.projectId` → projects. Anything that
     * is pointed at has to exist first.
     */
    private const ORDER = [
        'roles', 'users',
        'projects', 'services',
        'careers', 'applications',
        'testimonials', 'gallery',
        'team', 'client-logos', 'blogs', 'faqs', 'downloads', 'media',
        'enquiries', 'estimates',
        'banners', 'home-sections', 'navbar', 'footer', 'seo', 'settings',
        'estimator-rates', 'estimator-materials', 'estimator-locations', 'estimator-enhancements',
    ];

    public function run(): void
    {
        $resources = config('resources');
        $missing = array_diff(array_keys($resources), self::ORDER);

        if ($missing) {
            /* A resource added to config/resources.php but not to ORDER would be
               silently skipped, which is the kind of gap that only shows up as a
               404 in the admin three weeks later. */
            $this->command->error('Not in seeder ORDER: '.implode(', ', $missing));

            return;
        }

        $password = env('SEED_ADMIN_PASSWORD', 'archstone-dev');

        /* Truncating in reverse order for the same reason as inserting forwards.
           The checks come off because MySQL will not let a referenced table be
           emptied even when its dependants are already gone. */
        Schema::disableForeignKeyConstraints();

        foreach (array_reverse(self::ORDER) as $resource) {
            DB::table((new $resources[$resource]['model'])->getTable())->truncate();
        }

        Schema::enableForeignKeyConstraints();

        $total = 0;

        foreach (self::ORDER as $resource) {
            $file = database_path("seeders/data/{$resource}.json");

            if (! is_file($file)) {
                $this->command->warn("  {$resource}: no data file, skipped");

                continue;
            }

            $model = new $resources[$resource]['model'];
            $columns = Schema::getColumnListing($model->getTable());
            $rows = json_decode(file_get_contents($file), true, 512, JSON_THROW_ON_ERROR);

            /* Parents before children. `navbar` is the only self-referencing
               table, and a child inserted first would fail its own foreign key. */
            if (in_array('parentId', $columns, true)) {
                usort($rows, fn ($a, $b) => (int) ! empty($a['parentId']) <=> (int) ! empty($b['parentId']));
            }

            foreach ($rows as $row) {
                $record = $model->newInstance();

                /* Unknown keys are dropped rather than written. The JSON carries
                   fields that are derived on the way out and have no column —
                   `roles.memberCount`, `users.roleName` — and a stray one should
                   not stop a seed. */
                $record->fill(array_intersect_key($row, array_flip($columns)));

                /* The dates in the source data are real: `createdAt` is when a
                   project was actually added, and the admin's "oldest uncontacted
                   lead" banner reads it. Letting Eloquent stamp `now()` over all
                   231 rows would make every lead look like it arrived today. */
                $record->timestamps = false;

                /* Parsed, not passed through. The source dates are JavaScript
                   `toISOString()` output — `2026-01-01T09:00:00.000Z` — and MySQL
                   rejects that literal outright (SQLSTATE 22007). Eloquent only
                   converts a timestamp column automatically when it is stamping
                   it itself, which is exactly what is switched off here. */
                $record->setAttribute('createdAt', CarbonImmutable::parse($row['createdAt'] ?? now()));
                $record->setAttribute('updatedAt', CarbonImmutable::parse($row['updatedAt'] ?? now()));

                if ($resource === 'users') {
                    $record->setAttribute('password', $password);
                }

                $record->save();
                $total++;
            }

            $this->command->getOutput()->writeln(
                sprintf('  <fg=green>✓</> %-24s %3d', $resource, count($rows))
            );
        }

        $this->command->getOutput()->writeln("\n  {$total} records seeded.");
        $this->command->getOutput()->writeln(
            "  Every user's password is <options=bold>{$password}</> — set SEED_ADMIN_PASSWORD to change it, and change it before this goes anywhere real."
        );
    }
}
