<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /*
     * Recorded client testimonials — the home page's video rail.
     *
     * Its own table rather than the three video columns on `testimonials`: a
     * client can send a film without a written quote, and the rail should not
     * be capped at however many written testimonials exist. Those columns are
     * left in place (dropping them is destructive for no gain) but the site no
     * longer renders them.
     *
     * `videoUrl` and `poster` are text, not string: a pasted YouTube URL fits in
     * 255, but a poster can be an uploaded data URI like the other image fields.
     */
    public function up(): void
    {
        Schema::create('client_videos', function (Blueprint $table): void {
            $table->string('id', 64)->primary();
            $table->string('name');
            $table->string('title')->nullable();
            $table->string('locality')->nullable();

            /* SetNull, same as testimonials: the film outlives the project page. */
            $table->string('projectId', 64)->nullable();
            $table->foreign('projectId')->references('id')->on('projects')->nullOnDelete();

            $table->text('videoUrl');
            $table->text('poster');
            $table->string('duration')->nullable();
            $table->integer('order')->default(0);
            $table->string('status')->default('published');
            $table->timestamp('createdAt')->nullable();
            $table->timestamp('updatedAt')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_videos');
    }
};
