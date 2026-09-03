<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends ApiModel
{
    /* `memberCount` is in the contract but not in the table.
     *
     * `web_next/src/data/ops.ts` seeds it as a literal (`memberCount: 2`), which
     * is a number that goes stale the moment anyone is reassigned. Deriving it
     * from the relation cannot drift. `withCount` keeps it one query rather than
     * one per role; `users_count` is the column that produces, and it is hidden
     * because the contract has no such key. */
    protected $withCount = ['users'];

    protected $hidden = ['users_count'];

    protected $appends = ['memberCount'];

    protected $attributes = [
        'permissions' => '{}',
    ];

    protected function casts(): array
    {
        return ['permissions' => 'array'];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'roleId');
    }

    /* Deliberately the old `get…Attribute` form, not the newer
     * `protected function x(): Attribute` one.
     *
     * `HasAttributes::mutateAttributeForArray()` (framework line ~771) picks the
     * new style only when `static::$getAttributeMutatorCache` already holds a
     * `true` for the key — and that cache is filled by `hasAttributeMutator()`,
     * which runs when an attribute is *read directly*. An appended attribute is
     * never read directly, so on the `toArray()` path the cache is empty and it
     * falls through to `mutateAttribute()`, which looks for exactly this method
     * name. With the modern form it throws BadMethodCallException instead. */
    public function getMemberCountAttribute(): int
    {
        return (int) ($this->users_count ?? $this->users()->count());
    }
}
