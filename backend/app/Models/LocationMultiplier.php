<?php

namespace App\Models;

class LocationMultiplier extends ApiModel
{
    protected function casts(): array
    {
        return [
            'multiplier' => 'float',
            'order' => 'integer',
        ];
    }
}
