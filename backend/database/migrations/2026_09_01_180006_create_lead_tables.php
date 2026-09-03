<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Enquiries and estimate requests — the two tables this whole migration exists for.
 *
 * Until now every form on the site wrote to `mockAdapter`, which stores into the
 * *submitting visitor's own* localStorage. The visitor was shown "We will call
 * you within one working day" for a record nobody at the business would ever
 * see. These two tables are where that stops.
 *
 * ── The consent + attribution block ────────────────────────────────────────
 * Seven columns on every lead table, and they are not optional extras:
 *
 * `consentAt` / `consentText` — the DPDP Act requires the business to show that
 * consent was *informed*, so a boolean will not do: the wording changes over
 * time and a stored `true` cannot say which version a person agreed to.
 * `web_next/src/lib/consent.ts` sends the timestamp and the verbatim wording.
 *
 * `utmSource` / `utmMedium` / `utmCampaign` / `referrer` / `landingPage` —
 * first-touch attribution from `web_next/src/lib/attribution.ts`, captured on the
 * visitor's first page and carried to whichever form they eventually fill.
 *
 * The recorded schema in docs/09-data-model.prisma has none of these, and the
 * Express server it described used `z.object()`, which strips unknown keys. Every
 * lead would have arrived stripped of its consent record and its campaign
 * source, with no error anywhere.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('enquiries', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('name');
            $table->string('phone');
            $table->string('email')->nullable();
            $table->string('serviceInterest');
            $table->string('city')->nullable();
            $table->string('budget')->nullable();

            /* Nullable: the short capture surfaces — the idle popup, the footer
               newsletter, the downloads gate — ask for a name and a number and
               nothing else. Requiring prose here would force them to grow a
               textarea or invent filler. */
            $table->text('message')->nullable();

            /* Five values, not the six in the recorded schema. That enum still
               lists `service-page`, `project-page` and `exit-intent`; the union in
               `web_next/src/types/domain.ts` was trimmed twice as those capture
               surfaces were removed, and its comment states the rule — nothing
               belongs here without a code path that writes it, because the admin
               filter is built from this list and an option that can never match a
               row is worse than a missing one.
               Live values: contact-form | estimator | idle-popup | download | newsletter */
            $table->string('source')->default('contact-form');

            $table->string('stage')->default('new');  // new | contacted | qualified | proposal | won | lost

            /* Free text, not a foreign key. The recorded schema has
               `assignedToId → User`, which is the better design and is not what
               the contract says: `Enquiry.assignedTo` is a plain string and the
               admin renders a text box. Making it an FK here would 500 on every
               value the panel can actually produce. Worth revisiting with the
               admin's assignment UI, together. */
            $table->string('assignedTo')->nullable();

            $table->string('status')->default('published');

            $table->timestamp('consentAt')->nullable();
            $table->string('consentText', 400)->nullable();
            $table->string('utmSource', 120)->nullable();
            $table->string('utmMedium', 120)->nullable();
            $table->string('utmCampaign', 120)->nullable();
            $table->string('referrer', 500)->nullable();
            $table->string('landingPage', 500)->nullable();

            $table->timestamp('createdAt')->nullable();
            $table->timestamp('updatedAt')->nullable();

            $table->index(['stage', 'createdAt']);
            $table->index(['source']);
        });

        Schema::create('estimate_requests', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('name');
            $table->string('phone');
            $table->string('email')->nullable();

            $table->string('propertyType');

            /* `areaPerFloor`, not `plotArea`. The estimator stopped deriving
               built-up area through a ground-coverage ratio; keeping the old name
               would leave one column meaning two different things either side of
               that change. docs/09-data-model.prisma still says `plotArea` — it
               predates the change. */
            $table->double('areaPerFloor');

            $table->string('areaUnit')->default('sqft');
            $table->integer('floors');

            /* Two package columns, and they are not redundant. `packageType` is
               the scope actually priced; `packageChosen` is what the visitor
               tapped. They diverge whenever a material selection promoted the
               build past the package that was chosen, and "what they asked for"
               is a different sales fact from "what they configured". */
            $table->string('packageType');
            $table->string('packageChosen')->nullable();

            $table->string('qualityTier');
            $table->string('location');
            $table->json('enhancements')->nullable();

            /* The four columns the Express schema dropped on the floor. The
               estimator sends the exact specification the visitor chose — material
               key → brand, furniture key → allowance level — which is what lets a
               salesperson rebuild the quotation line by line instead of guessing
               what "semi-furnished" meant that day. It is the single most valuable
               thing in the whole lead. */
            $table->json('materials')->nullable();
            $table->double('materialsCost')->nullable();
            $table->json('furniture')->nullable();
            $table->double('furnitureCost')->nullable();

            $table->double('builtUpArea');
            $table->double('totalMin');
            $table->double('totalMax');
            $table->integer('timelineWeeks');

            $table->string('stage')->default('new');   // new | contacted | qualified | converted | lost
            $table->string('status')->default('published');

            $table->timestamp('consentAt')->nullable();
            $table->string('consentText', 400)->nullable();
            $table->string('utmSource', 120)->nullable();
            $table->string('utmMedium', 120)->nullable();
            $table->string('utmCampaign', 120)->nullable();
            $table->string('referrer', 500)->nullable();
            $table->string('landingPage', 500)->nullable();

            $table->timestamp('createdAt')->nullable();
            $table->timestamp('updatedAt')->nullable();

            $table->index(['stage', 'createdAt']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('estimate_requests');
        Schema::dropIfExists('enquiries');
    }
};
