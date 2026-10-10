<?php

namespace App\Models;

class Project extends ApiModel
{
    /* MySQL cannot put a DEFAULT on a json column, so the empty-array
       default lives here — a new record without them is `[]`, not null. */
    protected $attributes = [
        'images' => '[]',
        'specs' => '[]',
        'services' => '[]',
        'tags' => '[]',
    ];

    protected function casts(): array
    {
        return [
            'coordinates' => 'array',
            'images' => 'array',
            'specs' => 'array',
            'services' => 'array',
            'tags' => 'array',
            'featured' => 'boolean',
            'order' => 'integer',
            'year' => 'integer',
            'areaSqft' => 'integer',
            'durationMonths' => 'integer',
        ];
    }
}
