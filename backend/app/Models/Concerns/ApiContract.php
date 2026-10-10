<?php

namespace App\Models\Concerns;

use App\Support\Cuid;
use DateTimeInterface;

/**
 * The four conventions every model the API exposes has to follow.
 *
 * A trait rather than a base class only because `User` has to extend
 * Laravel's `Authenticatable`, and PHP has single inheritance. Everything else
 * gets these through `App\Models\ApiModel`.
 *
 * All four are forced by the same fact: this API has to return byte-for-byte
 * what `web_next/src/services/adapters/mock.adapter.ts` returns. The frontend was
 * written first, 46 files import its data shapes directly, and the database is
 * the thing that has to bend.
 *
 * 1. **String primary keys**, minted as cuid — see App\Support\Cuid. The seed
 *    data carries hand-authored ids (`role_owner`, `usr_1`, `rate_civil`) that
 *    have to survive the import, so an id is only generated when one is absent.
 *
 * 2. **camelCase timestamp columns.** Laravel wants `created_at`; the contract
 *    says `createdAt`. Overriding two constants is cheaper and far less
 *    error-prone than a transform layer across 26 models.
 *
 * 3. **Millisecond ISO dates.** Laravel serialises to six decimal places
 *    (`2026-01-01T09:00:00.000000Z`); JavaScript's `toISOString()` — which
 *    produced every date in `src/data/*.ts` — emits three. Without this, a diff
 *    between the two adapters flags every row in the system.
 *
 * 4. **Unguarded.** Nothing reaches a model unfiltered: ResourceController
 *    whitelists per resource from config/resources.php, and the public lead
 *    endpoints go through FormRequests.
 */
trait ApiContract
{
    /**
     * The key settings live in an initializer, not as trait properties.
     *
     * They were properties first — `public $incrementing = false;` and friends —
     * and every check passed on the dev machine's PHP 8.5. On the server's
     * PHP 8.3 the same code is a compile-time FatalError: Eloquent's Model
     * already declares those properties with different defaults, and 8.3 treats
     * a trait redeclaring an inherited property with a different value as
     * incompatible ("define the same property ($incrementing) in the
     * composition"). 8.5 relaxed that, which is exactly how it slipped through
     * local testing and only detonated in production.
     *
     * `initialize<TraitName>()` is Eloquent's own hook for this: it runs in the
     * model constructor, per instance, before anything reads these settings.
     */
    public function initializeApiContract(): void
    {
        $this->incrementing = false;
        $this->keyType = 'string';
        $this->guarded = [];
    }

    public static function bootApiContract(): void
    {
        static::creating(function ($model) {
            if (blank($model->getKey())) {
                $model->setAttribute($model->getKeyName(), Cuid::make());
            }
        });
    }

    protected function serializeDate(DateTimeInterface $date): string
    {
        return $date->format('Y-m-d\TH:i:s.v\Z');
    }
}
