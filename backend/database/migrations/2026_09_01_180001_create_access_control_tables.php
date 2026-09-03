<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Roles and users.
 *
 * First, because `users.roleId` and `enquiries.assignedTo` both point here.
 *
 * ── Two conventions that hold across every table in this schema ─────────────
 *
 * **Primary keys are `string(64)`, not `char(25)` and not integers.** cuid is 25
 * characters, but the seed data carries hand-authored ids — `role_owner`,
 * `usr_1`, `rate_civil`, `mat_vitrified-tile` — and those have to survive the
 * import intact: `web_next/src/data/ops.ts` references `roleId: 'role_owner'`
 * directly, and `/admin` deep-links by id. 64 covers both shapes with room left.
 *
 * **Columns are camelCase.** Laravel's convention is snake_case, and this breaks
 * it on purpose. The frontend contract — 27 resources, ~40 interfaces in
 * `web_next/src/types/domain.ts` — is camelCase throughout, and `mockAdapter`
 * returns those keys verbatim. A mapping layer between the two would be 27 more
 * places for a typo to hide; this way `$model->toArray()` *is* the response.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('description');

            /* `{ resource: ['view','create','edit','delete','publish'] }` — read by
               the CheckPermission middleware. `memberCount` is deliberately NOT a
               column: it is derived from the users relation, so renaming or
               reassigning a role cannot leave a stale number behind. */
            $table->json('permissions')->nullable();

            $table->string('status')->default('published');
            $table->timestamp('createdAt')->nullable();
            $table->timestamp('updatedAt')->nullable();
        });

        Schema::create('users', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('name');
            $table->string('email')->unique();

            /* The schema in docs/09-data-model.prisma calls this `passwordHash` and
               makes it nullable — a fair description of a prototype where nobody
               logged in. It is `password` here because Laravel's guard looks for
               that name, and it is hidden from every API response. */
            $table->string('password')->nullable();
            $table->rememberToken();

            /* text, not string: `web_next/src/lib/media.ts` synthesises monogram
               avatars as inline SVG data URIs, which run past varchar(255). */
            $table->text('avatar')->nullable();

            $table->string('roleId', 64);
            $table->foreign('roleId')->references('id')->on('roles');

            $table->boolean('active')->default(true);
            $table->timestamp('lastActiveAt')->nullable();
            $table->string('status')->default('published');
            $table->timestamp('createdAt')->nullable();
            $table->timestamp('updatedAt')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('roles');
    }
};
