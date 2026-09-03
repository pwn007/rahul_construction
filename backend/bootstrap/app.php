<?php

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
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
