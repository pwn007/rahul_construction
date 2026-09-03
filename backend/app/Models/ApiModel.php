<?php

namespace App\Models;

use App\Models\Concerns\ApiContract;
use Illuminate\Database\Eloquent\Model;

/**
 * Base for every model the API exposes, except `User` — which needs
 * `Authenticatable` and so picks up the same conventions via the trait directly.
 *
 * See App\Models\Concerns\ApiContract for why each convention exists.
 */
abstract class ApiModel extends Model
{
    use ApiContract;

    public const CREATED_AT = 'createdAt';

    public const UPDATED_AT = 'updatedAt';
}
