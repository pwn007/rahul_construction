<?php

namespace App\Models;

class ClientLogo extends ApiModel
{
    protected function casts(): array
    {
        return [
            'order' => 'integer',
        ];
    }
}
