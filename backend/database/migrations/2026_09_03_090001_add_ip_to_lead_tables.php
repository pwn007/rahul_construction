<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The visitor's IP on every lead.
 *
 * All three lead tables at once — they are the same kind of record arriving from
 * the same public internet, and adding it to one now and two later is a second
 * migration for no saving.
 *
 * 45 characters is the longest textual IPv6 form (including the
 * IPv4-mapped `::ffff:255.255.255.255`). Nullable, because the seeded demo rows
 * predate capture and an absent fact should read as absent, not as `0.0.0.0`.
 *
 * The value is never taken from the request body — a client can claim any IP it
 * likes. `ResourceController::store()` stamps `$request->ip()` on any table that
 * has this column, and `update()` strips the field like it strips `id`: where a
 * lead came from is a fact about the past, not an editable attribute.
 */
return new class extends Migration
{
    public function up(): void
    {
        foreach (['enquiries', 'estimate_requests', 'applications'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->string('ip', 45)->nullable()->after('landingPage');
            });
        }
    }

    public function down(): void
    {
        foreach (['enquiries', 'estimate_requests', 'applications'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->dropColumn('ip');
            });
        }
    }
};
