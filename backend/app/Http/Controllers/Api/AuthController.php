<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

/**
 * Admin login — JWT (RFC 7519), decided with the client.
 *
 * Three endpoints, nothing else: login issues a token, `me` answers who the
 * token belongs to, logout blacklists it. No refresh flow in this phase — the
 * day-long TTL in config/jwt.php is what keeps the panel usable between logins.
 *
 * Every response uses the same `{ data: … }` envelope as the rest of the API,
 * because the same `httpAdapter` unwraps it.
 */
class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $credentials['email'])->first();

        /* One deliberate distinction, two messages. "Wrong email or password"
           for bad credentials — never revealing which half was wrong. But a
           correct login on a deactivated account says so plainly: the seed's
           `usr_6` is `active: false`, and telling that person to check their
           password would send them in a circle. The check runs *after* the hash
           comparison so the message never leaks whether a disabled account's
           password was right. */
        if (! $user || ! Hash::check($credentials['password'], (string) $user->password)) {
            return response()->json(['message' => 'Wrong email or password.'], 401);
        }

        if (! $user->active) {
            return response()->json(['message' => 'This account has been deactivated.'], 401);
        }

        $user->forceFill(['lastActiveAt' => now()])->save();

        return response()->json([
            'data' => [
                'token' => JWTAuth::fromUser($user),
                'user' => $user,
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['data' => $request->user()]);
    }

    public function logout(): JsonResponse
    {
        /* Invalidate = blacklist until the token would have expired anyway.
           The blacklist lives in the cache table, which exists and needs no
           extra infrastructure on shared hosting. */
        JWTAuth::invalidate(JWTAuth::getToken());

        return response()->json(['data' => ['signedOut' => true]]);
    }
}
