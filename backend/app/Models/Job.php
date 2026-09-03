<?php

namespace App\Models;

class Job extends ApiModel
{
    /* `jobs` belongs to Laravel's queue driver, so the table is
       `jobs_listings`. The API resource is still `careers`. */
    protected $table = 'jobs_listings';

    /* MySQL cannot put a DEFAULT on a json column, so the empty-array
       default lives here — a new record without them is `[]`, not null. */
    protected $attributes = [
        'responsibilities' => '[]',
        'requirements' => '[]',
        'benefits' => '[]',
    ];

    protected function casts(): array
    {
        return [
            'responsibilities' => 'array',
            'requirements' => 'array',
            'benefits' => 'array',
            'openings' => 'integer',
            'postedAt' => 'datetime',
        ];
    }
}
