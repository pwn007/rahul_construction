<?php

namespace App\Models;

class Post extends ApiModel
{
    /* MySQL cannot put a DEFAULT on a json column, so the empty-array
       default lives here — a new record without them is `[]`, not null. */
    protected $attributes = [
        'tags' => '[]',
    ];

    protected function casts(): array
    {
        return [
            'tags' => 'array',
            'readingMinutes' => 'integer',
            'featured' => 'boolean',
            'publishedAt' => 'datetime',
        ];
    }
}
