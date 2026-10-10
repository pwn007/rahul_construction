<?php

namespace App\Models;

class GalleryItem extends ApiModel
{
    protected function casts(): array
    {
        return [
            'order' => 'integer',
        ];
    }
}
