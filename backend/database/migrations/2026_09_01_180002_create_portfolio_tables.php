<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Projects and services.
 *
 * ── Why the enum-ish columns are plain strings ──────────────────────────────
 * `category`, `stage` and `packageType` carry a closed set of values, and the
 * obvious move is a MySQL ENUM. Three reasons not to:
 *
 *  1. The wire values are hyphenated — `mixed-use`, `semi-furnished`,
 *     `fully-furnished` — because that is what `web_next/src/data/projects.ts`
 *     writes and what the admin filter matches on. An ENUM would hold them, but
 *     the moment someone reads the column and "tidies" it to `mixed_use`, every
 *     filter silently returns nothing.
 *  2. Adding a value to an ENUM is a table rebuild — on shared hosting, a lock on
 *     a table the live site is reading.
 *  3. MySQL and MariaDB disagree about ENUM edge cases and the host's engine is
 *     not yet known.
 *
 * Validation lives in the request layer instead, where the error can name the
 * legal values.
 *
 * ── Why `images` is a column and not a table ────────────────────────────────
 * docs/09-data-model.prisma models project images relationally, with a
 * `ProjectImage` table. The data says otherwise on two counts. `ProjectImage` in
 * `web_next/src/types/domain.ts` does not extend `BaseEntity` — no createdAt, no
 * status, it is not an entity — and the ids in `src/data/projects.ts` are `i1`,
 * `i2`, `i3` **restarting inside every project**, so they cannot be a primary
 * key. There is also no `project-images` entry in the frontend's RESOURCES map:
 * nothing ever fetches, filters or sorts them independently. They are a value
 * belonging to the project, and json says that honestly.
 *
 * `coordinates` is json for a plainer reason: the contract is
 * `coordinates: { lat, lng }`, one object, and nothing queries by position — the
 * Project Atlas places pins client-side from `districtId`.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('slug')->unique();
            $table->string('title');
            $table->string('subtitle');
            $table->string('excerpt', 1000);
            $table->text('challenge');
            $table->text('approach');
            $table->text('outcome');

            $table->string('category');                               // residential | commercial | interior | mepf | turnkey | mixed-use
            $table->string('stage')->default('completed');            // completed | ongoing | upcoming
            $table->string('packageType')->default('semi-furnished'); // civil | semi-furnished | fully-furnished

            $table->string('locality');
            $table->string('city')->default('Jaipur');
            $table->string('districtId')->nullable();

            $table->integer('year');
            $table->integer('areaSqft');
            $table->string('floors');
            $table->integer('durationMonths');
            $table->string('client')->nullable();

            $table->string('coverImage');
            $table->string('beforeImage')->nullable();
            $table->string('afterImage')->nullable();

            $table->boolean('featured')->default(false);
            $table->integer('order')->default(0);
            $table->string('status')->default('draft');

            /* Postgres `String[]` and `Json` both land here as json. MySQL cannot
               put a DEFAULT on a json column, so the empty-array default lives on
               the model (`$attributes`) and the column stays nullable. */
            $table->json('coordinates')->nullable();
            $table->json('images')->nullable();
            $table->json('specs')->nullable();
            $table->json('services')->nullable();
            $table->json('tags')->nullable();

            $table->timestamp('createdAt')->nullable();
            $table->timestamp('updatedAt')->nullable();

            $table->index(['category', 'stage', 'status']);
            $table->index(['featured', 'order']);
        });

        Schema::create('services', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('slug')->unique();
            $table->string('title');
            $table->string('shortTitle');
            $table->string('tagline');
            $table->string('icon');
            $table->string('summary', 1000);
            $table->text('description');
            $table->string('heroImage');

            $table->json('features')->nullable();      // ServiceFeature[]  { title, description, icon }
            $table->json('deliverables')->nullable();  // string[]
            $table->json('process')->nullable();       // { step, title, description }[]
            $table->json('stats')->nullable();         // { label, value }[]
            $table->json('faqIds')->nullable();        // string[] → faqs.id

            $table->boolean('featured')->default(true);
            $table->integer('order')->default(0);
            $table->string('status')->default('published');
            $table->timestamp('createdAt')->nullable();
            $table->timestamp('updatedAt')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('services');
        Schema::dropIfExists('projects');
    }
};
