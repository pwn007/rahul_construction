<?php

namespace App\Models;

class Service extends ApiModel
{
    /* MySQL cannot put a DEFAULT on a json column, so the empty-array
       default lives here — a new record without them is `[]`, not null. */
    protected $attributes = [
        'features' => '[]',
        'deliverables' => '[]',
        'process' => '[]',
        'stats' => '[]',
        'faqIds' => '[]',
    ];

    protected function casts(): array
    {
        return [
            'features' => 'array',
            'deliverables' => 'array',
            'process' => 'array',
            'stats' => 'array',
            'faqIds' => 'array',
            'featured' => 'boolean',
            'order' => 'integer',
        ];
    }
}
