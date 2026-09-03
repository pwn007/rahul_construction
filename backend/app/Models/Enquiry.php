<?php

namespace App\Models;

class Enquiry extends ApiModel
{
    protected function casts(): array
    {
        return [
            'consentAt' => 'datetime',
        ];
    }
}
