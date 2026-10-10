<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

/**
 * Mint a bearer token for the contract checks.
 *
 * `web_next/scripts/contract-diff.mts` and `contract-queries.mts` have to see
 * what a signed-in admin sees — drafts, leads, users — because that is the only
 * vantage point from which the two adapters agree. They read the token from a
 * file; this writes it.
 *
 *   php artisan api:token
 *   php artisan api:token --email=rahul@neetuarchstone.com --out=/tmp/api-token
 *
 * Old tokens for that user are revoked first, so running it twice does not leave
 * a trail of live credentials behind.
 */
class IssueApiToken extends Command
{
    protected $signature = 'api:token
        {--email= : Which user. Defaults to the first owner.}
        {--out=/tmp/api-token : Where to write the plain-text token.}';

    protected $description = 'Issue a bearer token for the contract checks';

    public function handle(): int
    {
        $email = $this->option('email');

        $user = $email
            ? User::where('email', $email)->first()
            : User::whereRelation('role', 'slug', 'owner')->first();

        if (! $user) {
            $this->error($email ? "No user with email {$email}." : 'No owner found — has the database been seeded?');

            return self::FAILURE;
        }

        /* A JWT now, not a Sanctum token — the API guard changed with the JWT
           decision, and the contract scripts just read this file and send
           whatever is in it as a Bearer header, so they never noticed. */
        file_put_contents($this->option('out'), JWTAuth::fromUser($user));

        $this->info("Token for {$user->name} <{$user->email}> written to {$this->option('out')}");

        return self::SUCCESS;
    }
}
