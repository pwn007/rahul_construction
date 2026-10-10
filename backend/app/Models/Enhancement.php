<?php

namespace App\Models;

class Enhancement extends ApiModel
{
    /* MySQL cannot put a DEFAULT on a json column, so the empty-array
       default lives here — a new record without them is `[]`, not null. */
    protected $attributes = [
        'appliesTo' => '[]',
    ];

    protected function casts(): array
    {
        return [
            'appliesTo' => 'array',
            'unitPrice' => 'integer',
            'order' => 'integer',
        ];
    }
}
