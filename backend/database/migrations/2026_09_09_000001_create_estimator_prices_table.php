<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /*
     * The admin-editable price list the quote engine overlays on
     * config/estimator.php.
     *
     * Flat rows, one number each, because that is what actually changes:
     * structure (coefficients, tiers, options, photos) lives in code where it
     * is reviewed, prices live here where the owner edits them. Keys are
     * "<line>:<option>" ('cement:ultratech'), plus 'labour:civil',
     * 'labour:semi-furnished' and 'overheads' (whole percent). A row set to
     * draft — or a missing row — falls back to the config rate, which is the
     * admin's kill-switch for a bad edit.
     *
     * Not material_specs: that table is the retired wizard's shape (json
     * options, quality tiers) and nothing reads it; editing one rate through
     * a json blob is exactly the admin UX this table exists to avoid.
     */
    public function up(): void
    {
        Schema::create('estimator_prices', function (Blueprint $table): void {
            $table->string('id', 64)->primary();
            $table->string('key')->unique();
            $table->string('label');
            $table->string('unit', 100);
            $table->integer('rate');
            $table->integer('order')->default(0);
            $table->string('status')->default('published');
            $table->timestamp('createdAt')->nullable();
            $table->timestamp('updatedAt')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('estimator_prices');
    }
};
