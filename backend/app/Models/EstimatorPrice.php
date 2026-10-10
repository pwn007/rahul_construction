<?php

namespace App\Models;

class EstimatorPrice extends ApiModel
{
    protected function casts(): array
    {
        return [
            'rate' => 'integer',
            'order' => 'integer',
        ];
    }
}
