<?php

namespace App\Models;

class MediaAsset extends ApiModel
{
    protected function casts(): array
    {
        return [
            'sizeBytes' => 'integer',
            'width' => 'integer',
            'height' => 'integer',
        ];
    }
}
