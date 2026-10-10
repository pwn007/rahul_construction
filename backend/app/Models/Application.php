<?php

namespace App\Models;

class Application extends ApiModel
{
    protected function casts(): array
    {
        return [
            'experienceYears' => 'integer',
            'consentAt' => 'datetime',
        ];
    }
}
