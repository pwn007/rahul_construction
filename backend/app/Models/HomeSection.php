<?php

namespace App\Models;

class HomeSection extends ApiModel
{
    protected function casts(): array
    {
        return [
            'enabled' => 'boolean',
            'order' => 'integer',
        ];
    }
}
