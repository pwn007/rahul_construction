<?php

namespace App\Models;

class SeoMeta extends ApiModel
{
    protected $table = 'seo_meta';

    /* MySQL cannot put a DEFAULT on a json column, so the empty-array
       default lives here — a new record without them is `[]`, not null. */
    protected $attributes = [
        'keywords' => '[]',
    ];

    protected function casts(): array
    {
        return [
            'keywords' => 'array',
            'noIndex' => 'boolean',
        ];
    }
}
