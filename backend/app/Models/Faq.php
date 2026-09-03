<?php

namespace App\Models;

class Faq extends ApiModel
{
    protected function casts(): array
    {
        return [
            'order' => 'integer',
        ];
    }
}
