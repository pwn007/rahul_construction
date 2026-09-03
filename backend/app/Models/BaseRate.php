<?php

namespace App\Models;

class BaseRate extends ApiModel
{
    protected function casts(): array
    {
        return [
            'minRate' => 'integer',
            'maxRate' => 'integer',
            'labourOnlyRate' => 'integer',
            'order' => 'integer',
        ];
    }
}
