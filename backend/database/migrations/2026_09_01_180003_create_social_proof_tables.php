<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Testimonials, team, client logos. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('testimonials', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('name');
            $table->string('title')->nullable();
            $table->string('locality');
            $table->integer('rating')->default(5);
            $table->text('quote');
            $table->string('language')->default('en');   // en | hi | hinglish

            /* text for the same reason as users.avatar — these can be generated
               monogram data URIs rather than file paths. */
            $table->text('avatar')->nullable();
            $table->text('image')->nullable();

            /* Three fields the recorded schema does not have. The testimonial band
               plays a client's own recording where one exists, and `tst_ashok`'s
               is still placeholder b-roll — which is exactly why these are
               nullable rather than defaulted to something. */
            $table->string('videoUrl')->nullable();
            $table->string('videoPoster')->nullable();
            $table->string('videoDuration')->nullable();

            /* SetNull, not Cascade: a testimonial outlives the project page it was
               collected on. Deleting the project should not delete the praise. */
            $table->string('projectId', 64)->nullable();
            $table->foreign('projectId')->references('id')->on('projects')->nullOnDelete();

            $table->boolean('featured')->default(false);
            $table->integer('order')->default(0);
            $table->string('status')->default('published');
            $table->timestamp('createdAt')->nullable();
            $table->timestamp('updatedAt')->nullable();
        });

        Schema::create('team_members', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('name');
            $table->string('role');
            $table->string('department');            // leadership | design | engineering | site | support
            $table->text('bio');
            $table->text('photo');
            $table->integer('experienceYears')->default(0);
            $table->json('expertise')->nullable();
            $table->json('socials')->nullable();
            $table->integer('order')->default(0);
            $table->string('status')->default('published');
            $table->timestamp('createdAt')->nullable();
            $table->timestamp('updatedAt')->nullable();
        });

        Schema::create('client_logos', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('name');
            $table->text('logo');
            $table->string('website')->nullable();
            $table->integer('order')->default(0);
            $table->string('status')->default('published');
            $table->timestamp('createdAt')->nullable();
            $table->timestamp('updatedAt')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_logos');
        Schema::dropIfExists('team_members');
        Schema::dropIfExists('testimonials');
    }
};
