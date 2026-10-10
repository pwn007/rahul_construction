<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A navigation entry, optionally nested one level.
 *
 * The contract exposes `parentId` and nothing else — the frontend builds the tree
 * itself from a flat list, which is why `children` is a relation for the admin's
 * convenience and is not appended to the response.
 */
class NavItem extends ApiModel
{
    protected function casts(): array
    {
        return [
            'highlight' => 'boolean',
            'order' => 'integer',
        ];
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parentId');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parentId')->orderBy('order');
    }
}
