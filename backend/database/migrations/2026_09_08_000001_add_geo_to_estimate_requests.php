<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /*
     * Structured geography on estimator leads, for the nationwide plan.
     *
     * `location` keeps its original meaning (a lowercase city, 'jaipur' on
     * every row so far) — these two carry the visitor's own selection from
     * the lead form's state/city pickers. Nullable because every earlier row
     * predates the pickers, and a null strips cleanly out of API responses.
     */
    public function up(): void
    {
        Schema::table('estimate_requests', function (Blueprint $table): void {
            $table->string('state', 100)->nullable()->after('location');
            $table->string('city', 100)->nullable()->after('state');
        });
    }

    public function down(): void
    {
        Schema::table('estimate_requests', function (Blueprint $table): void {
            $table->dropColumn(['state', 'city']);
        });
    }
};
