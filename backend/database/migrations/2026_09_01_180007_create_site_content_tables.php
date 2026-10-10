<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Downloads, banners, home sections, navigation, footer, SEO, settings. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('downloads', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('title');
            $table->string('description', 1000);
            $table->string('category')->default('brochure'); // profile | brochure | certificate | catalogue | checklist
            $table->text('fileUrl');
            $table->string('fileType')->default('PDF');
            $table->string('fileSize');
            $table->string('thumbnail');

            /* Gated downloads collect a name and a phone before the file — which
               is why they write an enquiry with source 'download'. */
            $table->boolean('gated')->default(false);

            $table->integer('downloads')->default(0);
            $table->integer('order')->default(0);
            $table->string('status')->default('published');
            $table->timestamp('createdAt')->nullable();
            $table->timestamp('updatedAt')->nullable();
        });

        Schema::create('banners', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('title');
            $table->string('subtitle')->nullable();
            $table->string('image');
            $table->string('ctaLabel')->nullable();
            $table->string('ctaHref')->nullable();
            $table->string('placement');  // home-hero | promo-strip | projects-top | contact-top
            $table->integer('order')->default(0);
            $table->string('status')->default('draft');
            $table->timestamp('createdAt')->nullable();
            $table->timestamp('updatedAt')->nullable();

            $table->index(['placement', 'order']);
        });

        Schema::create('home_sections', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('key')->unique();
            $table->string('label');
            $table->string('heading');
            $table->string('subheading', 1000);
            $table->boolean('enabled')->default(true);
            $table->integer('order')->default(0);
            $table->string('status')->default('published');
            $table->timestamp('createdAt')->nullable();
            $table->timestamp('updatedAt')->nullable();
        });

        Schema::create('nav_items', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('label');
            $table->string('href');

            /* Self-referencing, cascading: deleting a parent takes its children.
               A dropdown entry with no parent is a link into nowhere. */
            $table->string('parentId', 64)->nullable();
            $table->foreign('parentId')->references('id')->on('nav_items')->cascadeOnDelete();

            $table->string('badge')->nullable();

            /* Nullable with no default, which for a boolean looks wrong and is
               not. The contract types it `highlight?: boolean`, and the five nav
               items that are not highlighted carry no such key at all in
               `src/data/ops.ts`. Defaulting to false would answer `false` where
               the mock answers nothing, and the response filter only strips
               nulls — so this is what makes "not specified" round-trip. */
            $table->boolean('highlight')->nullable();
            $table->integer('order')->default(0);
            $table->string('status')->default('published');
            $table->timestamp('createdAt')->nullable();
            $table->timestamp('updatedAt')->nullable();
        });

        Schema::create('footer_columns', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('heading');
            $table->json('links')->nullable();   // { label, href }[]
            $table->integer('order')->default(0);
            $table->string('status')->default('published');
            $table->timestamp('createdAt')->nullable();
            $table->timestamp('updatedAt')->nullable();
        });

        Schema::create('seo_meta', function (Blueprint $table) {
            $table->string('id', 64)->primary();

            /* Looked up by route, and ResourceController resolves
               `GET /api/seo/{key}` against id, slug, key **or** route — which is
               why this is unique. */
            $table->string('route')->unique();

            $table->string('title');
            $table->string('description', 1000);
            $table->json('keywords')->nullable();
            $table->string('ogImage');
            $table->boolean('noIndex')->default(false);
            $table->string('status')->default('published');
            $table->timestamp('createdAt')->nullable();
            $table->timestamp('updatedAt')->nullable();
        });

        Schema::create('settings', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('key')->unique();
            $table->string('label');
            $table->text('value');
            $table->string('group')->default('general'); // general | contact | social | analytics | theme
            $table->string('type')->default('text');     // text | textarea | color | number | boolean | url
            $table->string('status')->default('published');
            $table->timestamp('createdAt')->nullable();
            $table->timestamp('updatedAt')->nullable();

            $table->index(['group']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
        Schema::dropIfExists('seo_meta');
        Schema::dropIfExists('footer_columns');
        Schema::dropIfExists('nav_items');
        Schema::dropIfExists('home_sections');
        Schema::dropIfExists('banners');
        Schema::dropIfExists('downloads');
    }
};
