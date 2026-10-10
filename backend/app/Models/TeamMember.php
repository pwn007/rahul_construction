<?php

namespace App\Models;

class TeamMember extends ApiModel
{
    /* MySQL cannot put a DEFAULT on a json column, so the empty-array
       default lives here — a new record without them is `[]`, not null. */
    protected $attributes = [
        'expertise' => '[]',
    ];

    protected function casts(): array
    {
        return [
            'expertise' => 'array',
            'socials' => 'array',
            'experienceYears' => 'integer',
            'order' => 'integer',
        ];
    }
}
