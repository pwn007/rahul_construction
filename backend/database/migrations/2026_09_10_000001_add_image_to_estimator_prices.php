<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /*
     * The admin owns each option's picture as well as its rate. One column,
     * not two: whether it renders as a white-plate logo or a full-bleed photo
     * is the line's nature (brand rows have logos, type rows have photos) and
     * the engine keeps that distinction from config — this value just
     * overrides whichever one the option already has. Null (labour, overheads,
     * anything untouched) means the config image stands.
     */
    public function up(): void
    {
        Schema::table('estimator_prices', function (Blueprint $table): void {
            $table->string('image')->nullable()->after('rate');
        });
    }

    public function down(): void
    {
        Schema::table('estimator_prices', function (Blueprint $table): void {
            $table->dropColumn('image');
        });
    }
};
