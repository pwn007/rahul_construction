<?php

namespace App\Models;

class Testimonial extends ApiModel
{
    protected function casts(): array
    {
        return [
            'rating' => 'integer',
            'featured' => 'boolean',
            'order' => 'integer',
        ];
    }
}
