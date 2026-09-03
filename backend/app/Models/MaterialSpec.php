<?php

namespace App\Models;

class MaterialSpec extends ApiModel
{
    /* MySQL cannot put a DEFAULT on a json column, so the empty-array
       default lives here — a new record without them is `[]`, not null. */
    protected $attributes = [
        'options' => '[]',
    ];

    protected function casts(): array
    {
        return [
            'options' => 'array',
            'coefficient' => 'float',
            'defaultRate' => 'integer',
            'provisional' => 'boolean',
            'essential' => 'boolean',
            'order' => 'integer',
        ];
    }
}
