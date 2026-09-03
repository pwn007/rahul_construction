<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Sanctum's own table, with one line changed.
 *
 * `$table->morphs('tokenable')` — what Sanctum publishes — makes `tokenable_id`
 * an unsignedBigInteger, because the framework assumes auto-increment keys. Ours
 * are strings: `usr_1` from the seed data, cuid for anyone created later. Left
 * as published, `$user->createToken()` dies with
 *
 *   SQLSTATE[HY000] 1366 Incorrect integer value: 'usr_1' for column 'tokenable_id'
 *
 * and the failure surfaces at the first API call rather than at migrate time.
 * Session auth would never have hit it; bearer tokens do immediately.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();

            /* Was `$table->morphs('tokenable')`. Same two columns and the same
               index, but the id is a string — see the note above. */
            $table->string('tokenable_type');
            $table->string('tokenable_id', 64);
            $table->index(['tokenable_type', 'tokenable_id']);
            $table->text('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable()->index();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('personal_access_tokens');
    }
};
