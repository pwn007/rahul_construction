<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The four estimator configuration tables the admin panel edits.
 *
 * ── QualityTier is deliberately absent ─────────────────────────────────────
 * docs/09-data-model.prisma has a `QualityTier` model and the old Express server
 * served it at `estimator-quality`. Neither exists on the frontend any more:
 * `web_next/src/types/domain.ts` says outright that `MaterialSpec` **replaced**
 * it — "a single global quality multiplier had nothing left to multiply once the
 * build stopped being described by one tier". Building the table would recreate a
 * resource nothing asks for, while `estimator-materials` — which the frontend
 * does ask for, and which the Express server never had — stayed 404.
 *
 * `WORK_HEAD_RECORDS` and `FURNITURE_RECORDS` exist in
 * `web_next/src/data/estimator-config.ts` but are not in the frontend's RESOURCES
 * map, so they have no API resource and no table here. They are compiled
 * constants the calculator reads directly.
 *
 * ── A caveat worth stating ─────────────────────────────────────────────────
 * Giving these tables a home does not by itself make `/admin/estimator-config`
 * work. That screen's `save()` currently only raises a toast, and the public
 * calculator does not read this collection at all — `web_next/src/features/
 * estimator/` imports from `@/constants/*` and contains no service import. Two
 * separate jobs, both still open.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('base_rates', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('key')->unique();
            $table->string('label');
            $table->string('description', 1000);
            $table->integer('minRate');
            $table->integer('maxRate');
            $table->integer('labourOnlyRate');
            $table->integer('order')->default(0);
            $table->string('status')->default('published');
            $table->timestamp('createdAt')->nullable();
            $table->timestamp('updatedAt')->nullable();
        });

        Schema::create('material_specs', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('key')->unique();
            $table->string('label');
            $table->string('group');
            $table->string('unit');

            /** Quantity per sq ft of chargeable area. */
            $table->double('coefficient');

            /** Brands to choose between, serialised "label — ₹rate" for the admin table. */
            $table->json('options')->nullable();

            /** ₹ per unit of the default option — the calibrated rate. */
            $table->integer('defaultRate');

            /** True when any option's rate is derived rather than published. */
            $table->boolean('provisional')->default(false);

            /** A complete build needs this. Advisory only. */
            $table->boolean('essential')->default(false);

            $table->integer('order')->default(0);
            $table->string('status')->default('published');
            $table->timestamp('createdAt')->nullable();
            $table->timestamp('updatedAt')->nullable();
        });

        Schema::create('location_multipliers', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('key')->unique();
            $table->string('label');
            $table->string('zone');
            $table->double('multiplier');
            $table->integer('order')->default(0);
            $table->string('status')->default('published');
            $table->timestamp('createdAt')->nullable();
            $table->timestamp('updatedAt')->nullable();
        });

        Schema::create('enhancements', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('key')->unique();
            $table->string('label');
            $table->string('description', 1000);
            $table->string('icon');
            $table->string('pricingModel')->default('lumpsum'); // per-sqft | lumpsum | per-floor
            $table->integer('unitPrice');
            $table->json('appliesTo')->nullable();
            $table->integer('order')->default(0);
            $table->string('status')->default('published');
            $table->timestamp('createdAt')->nullable();
            $table->timestamp('updatedAt')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('enhancements');
        Schema::dropIfExists('location_multipliers');
        Schema::dropIfExists('material_specs');
        Schema::dropIfExists('base_rates');
    }
};
