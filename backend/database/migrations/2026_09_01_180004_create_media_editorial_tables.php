<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Gallery, media library, blog posts, FAQs. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gallery_items', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('title');
            $table->string('kind')->default('photo');   // photo | video | drone | 360
            $table->string('category');                 // a ProjectCategory, or 'process' | 'team'
            $table->string('url');
            $table->string('thumbnail');
            $table->string('duration')->nullable();

            $table->string('projectId', 64)->nullable();
            $table->foreign('projectId')->references('id')->on('projects')->nullOnDelete();

            $table->integer('order')->default(0);
            $table->string('status')->default('published');
            $table->timestamp('createdAt')->nullable();
            $table->timestamp('updatedAt')->nullable();

            $table->index(['kind', 'status']);
        });

        Schema::create('media_assets', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('filename');
            $table->text('url');
            $table->string('mimeType');
            $table->unsignedBigInteger('sizeBytes');
            $table->integer('width')->nullable();
            $table->integer('height')->nullable();
            $table->string('folder')->default('uploads');
            $table->string('alt')->nullable();
            $table->string('status')->default('published');
            $table->timestamp('createdAt')->nullable();
            $table->timestamp('updatedAt')->nullable();

            $table->index(['folder']);
        });

        Schema::create('posts', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('slug')->unique();
            $table->string('title');
            $table->string('excerpt', 1000);

            /* longText, not text: posts carry their whole article inline as
               markdown — `src/data/content.ts` is 696 lines and most of it is
               these bodies. MySQL's TEXT caps at 64 KB, which one long build
               diary would reach. */
            $table->longText('body');

            $table->string('coverImage');
            $table->string('category');
            $table->json('tags')->nullable();

            $table->string('author');
            $table->string('authorRole');
            $table->text('authorAvatar');

            $table->timestamp('publishedAt')->nullable();
            $table->integer('readingMinutes')->default(5);
            $table->boolean('featured')->default(false);
            $table->string('status')->default('draft');
            $table->timestamp('createdAt')->nullable();
            $table->timestamp('updatedAt')->nullable();

            $table->index(['category', 'status', 'publishedAt']);
        });

        Schema::create('faqs', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('question', 500);
            $table->text('answer');
            $table->string('category')->default('general'); // general | pricing | process | mepf | interiors | vastu | careers
            $table->integer('order')->default(0);
            $table->string('status')->default('published');
            $table->timestamp('createdAt')->nullable();
            $table->timestamp('updatedAt')->nullable();

            $table->index(['category', 'order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('faqs');
        Schema::dropIfExists('posts');
        Schema::dropIfExists('media_assets');
        Schema::dropIfExists('gallery_items');
    }
};
