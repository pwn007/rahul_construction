<?php

namespace App\Models;

class Download extends ApiModel
{
    protected function casts(): array
    {
        return [
            'gated' => 'boolean',
            'downloads' => 'integer',
            'order' => 'integer',
        ];
    }
}
