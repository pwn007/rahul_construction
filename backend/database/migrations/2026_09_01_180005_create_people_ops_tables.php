<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Jobs and the applications against them.
 *
 * The table is `jobs_listings`, not `jobs`, because Laravel's queue driver owns
 * `jobs` — `0001_01_01_000002_create_jobs_table.php` creates it, and queued lead
 * notifications will be writing to it. The API resource is still `careers`, which
 * is what the frontend asks for; `config/resources.php` maps the two, so the
 * collision never reaches the contract.
 *
 * `applications` is a lead table in everything but name — it arrives from a
 * public form, it needs the same consent and attribution columns as `enquiries`,
 * and the same person has to be told about it. It lives here rather than with the
 * other leads only because it cannot exist before `jobs` does.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jobs_listings', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('slug')->unique();
            $table->string('title');
            $table->string('department');
            $table->string('location');
            $table->string('type')->default('full-time');  // full-time | part-time | contract | internship
            $table->string('experience');
            $table->string('salaryRange')->nullable();
            $table->text('summary');

            $table->json('responsibilities')->nullable();
            $table->json('requirements')->nullable();
            $table->json('benefits')->nullable();

            $table->integer('openings')->default(1);
            $table->timestamp('postedAt')->nullable();
            $table->string('status')->default('draft');
            $table->timestamp('createdAt')->nullable();
            $table->timestamp('updatedAt')->nullable();
        });

        Schema::create('applications', function (Blueprint $table) {
            $table->string('id', 64)->primary();

            $table->string('jobId', 64);
            $table->foreign('jobId')->references('id')->on('jobs_listings')->cascadeOnDelete();

            /* Denormalised on purpose, and it is in the contract: an application
               has to still say which role it was for after the listing is closed
               and deleted. */
            $table->string('jobTitle');

            $table->string('name');
            $table->string('email');
            $table->string('phone');
            $table->integer('experienceYears')->default(0);

            /* A URL today, not an upload — the careers form asks for a portfolio
               link and `src/data/ops.ts` seeds this as '#'. Real file upload is
               listed as still-to-do; when it lands this becomes a media reference,
               which is why it is text rather than a fixed-width string. */
            $table->text('resumeUrl');

            $table->text('coverNote')->nullable();
            $table->string('stage')->default('new');   // new | screening | interview | offer | rejected
            $table->string('status')->default('published');

            /* Same consent + attribution block as enquiries and estimates. See the
               note in create_lead_tables — every public form sends these. */
            $table->timestamp('consentAt')->nullable();
            $table->string('consentText', 400)->nullable();
            $table->string('utmSource', 120)->nullable();
            $table->string('utmMedium', 120)->nullable();
            $table->string('utmCampaign', 120)->nullable();
            $table->string('referrer', 500)->nullable();
            $table->string('landingPage', 500)->nullable();

            $table->timestamp('createdAt')->nullable();
            $table->timestamp('updatedAt')->nullable();

            $table->index(['jobId', 'stage']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('applications');
        Schema::dropIfExists('jobs_listings');
    }
};
