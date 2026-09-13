<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /*
     * The idle popup now asks what the visitor wants built and lets them
     * explain it. Mirrors `developmentType` and `remarks` on `Enquiry` in
     * web_next/src/types/domain.ts.
     *
     * `developmentType` is a plain string like `source` and `stage`, not a DB
     * enum: residential | commercial | other, labelled in
     * web_next/src/constants/leads.ts.
     *
     * Both nullable, and that is load-bearing. The popup requires the type, but
     * the contact form, downloads gate and newsletter write to this same table
     * and ask for neither — NOT NULL here would turn every one of their
     * submissions into a 422. Rows captured before this migration have no
     * answer either, and null says so.
     *
     * This must run before a frontend that sends the fields is deployed:
     * ResourceController::fillable() silently drops keys without a column.
     */
    public function up(): void
    {
        Schema::table('enquiries', function (Blueprint $table): void {
            $table->string('developmentType', 20)->nullable()->after('message');
            $table->text('remarks')->nullable()->after('developmentType');
        });
    }

    public function down(): void
    {
        Schema::table('enquiries', function (Blueprint $table): void {
            $table->dropColumn(['developmentType', 'remarks']);
        });
    }
};
