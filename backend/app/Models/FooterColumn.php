<?php

namespace App\Models;

class FooterColumn extends ApiModel
{
    /* MySQL cannot put a DEFAULT on a json column, so the empty-array
       default lives here — a new record without them is `[]`, not null. */
    protected $attributes = [
        'links' => '[]',
    ];

    protected function casts(): array
    {
        return [
            'links' => 'array',
            'order' => 'integer',
        ];
    }
}
