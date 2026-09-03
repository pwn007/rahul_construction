<?php

namespace App\Models;

use App\Models\Concerns\ApiContract;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

/**
 * The only model that does not extend `ApiModel`.
 *
 * It has to extend Laravel's `Authenticatable` to be a login subject, so it picks
 * up the same four API conventions through the trait instead. See
 * App\Models\Concerns\ApiContract.
 */
class User extends Authenticatable implements JWTSubject
{
    use ApiContract, HasApiTokens, Notifiable;

    public const CREATED_AT = 'createdAt';

    public const UPDATED_AT = 'updatedAt';

    /* `role` is eager-loaded but hidden: the `roleName` accessor below needs it,
     * and without `$with` every user list would be an N+1. The contract has no
     * `role` key, so it must not reach the response. */
    protected $with = ['role'];

    protected $hidden = ['password', 'remember_token', 'role'];

    protected $appends = ['roleName'];

    protected function casts(): array
    {
        return [
            'active' => 'boolean',
            'lastActiveAt' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /* ── JWTSubject ─────────────────────────────────────────────────────
     * The token carries only `sub` (the user id). Name and role are looked up
     * fresh per request — baking them into a day-long token would mean a rename
     * or role change takes effect only at the next login. */
    public function getJWTIdentifier(): string
    {
        return (string) $this->getKey();
    }

    public function getJWTCustomClaims(): array
    {
        return [];
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'roleId');
    }

    /* Derived, not stored. `src/data/ops.ts` carries `roleName` alongside
     * `roleId` on every user; storing both means renaming a role leaves six rows
     * saying the old name. */
    public function getRoleNameAttribute(): string
    {
        return (string) ($this->role?->name ?? '');
    }
}
