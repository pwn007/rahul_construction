<?php

namespace App\Models;

class ClientVideo extends ApiModel
{
    protected function casts(): array
    {
        return [
            'order' => 'integer',
        ];
    }
}
