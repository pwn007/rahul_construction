<?php

namespace App\Models;

class EstimateRequest extends ApiModel
{
    /* MySQL cannot put a DEFAULT on a json column, so the empty-array
       default lives here — a new record without them is `[]`, not null. */
    protected $attributes = [
        'enhancements' => '[]',
    ];

    protected function casts(): array
    {
        return [
            'enhancements' => 'array',
            'materials' => 'array',
            'furniture' => 'array',
            'areaPerFloor' => 'float',
            'materialsCost' => 'float',
            'furnitureCost' => 'float',
            'builtUpArea' => 'float',
            'totalMin' => 'float',
            'totalMax' => 'float',
            'floors' => 'integer',
            'timelineWeeks' => 'integer',
            'consentAt' => 'datetime',
        ];
    }
}
