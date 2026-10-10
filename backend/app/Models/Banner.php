<?php

namespace App\Models;

class Banner extends ApiModel
{
    protected function casts(): array
    {
        return [
            'order' => 'integer',
        ];
    }
}
