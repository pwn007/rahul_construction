<?php

use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    /*
     * API only — there is no `web:` entry and no routes/web.php.
     *
     * The public site is a Next.js static export served as plain HTML by Apache;
     * this app never renders a page. Adding a web route here would be the first
     * step back towards two places that own the same markup.
     */
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        /* No statefulApi(): auth is a JWT in the Authorization header, decided
           with the client. No cookies means no CSRF dance and no CORS
           credentials — a bearer header crosses the dev origins (:3000 → :8000)
           under Laravel's default cors.php untouched. Sanctum stays installed
           but dormant. */

        /* Null = never redirect an API guest. The framework's default resolves
           route('login') *inside the middleware* while building the redirect —
           and with no login route (no UI here), that resolution itself threw
           RouteNotFoundException before any exception handler could say 401.
           The AuthenticationException render hook below is the second half. */
        $middleware->redirectGuestsTo(fn (Request $request) => $request->is('api/*') ? null : '/');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        /* A guest on an API route is a 401, never a redirect. The framework's
           default sends unauthenticated browsers to route('login') — which this
           app does not define (there is no UI here at all), so any client that
           forgot its Accept header got a 500 out of a missing-route error
           instead of the truth. Found by exactly that: a curl without the
           header during the upload endpoint's tests. */
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }
        });
    })->create();
