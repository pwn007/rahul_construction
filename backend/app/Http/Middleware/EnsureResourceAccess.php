<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Who may touch which resource.
 *
 * This is middleware rather than two route groups for a reason that cost an hour
 * to find. Registering `GET api/{resource}` twice — once open for the public
 * resources, once behind `auth:sanctum` for the rest — looks like it should work
 * because Laravel "takes the first match". It does not: `RouteCollection::
 * addToCollections()` keys routes by method + URI, so the second registration
 * *replaces* the first. The public read never existed, and every unauthenticated
 * GET returned 401.
 *
 * One route set, one place that decides:
 *
 *  · GET on a resource marked `public` in config/resources.php → open, and
 *    `ResourceController::visible()` narrows it to status = 'published'.
 *  · Anything else — any write, and any read of leads, users, roles or the media
 *    library — needs a session.
 *
 * Lead submission stays inside this middleware via `publicCreate` — POST is
 * open for a resource that declares it, everything else about that resource
 * stays locked.
 */
class EnsureResourceAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $resource = $request->route('resource');
        $config = config("resources.{$resource}");

        /* Unknown resource — let it through to the controller, which answers with
           the mock adapter's own wording (`Unknown resource "x"`, 404). Deciding
           here would turn a typo into a confusing 401. */
        if (! $config) {
            return $next($request);
        }

        /* Resolved explicitly against the `api` (JWT) guard rather than left to
           `$request->user()`, which would ask the default `web` guard. Binding
           the result back onto the request means everything downstream —
           ResourceController::visible() included — sees the same answer. An
           invalid or expired token resolves to null here and falls into the 401
           below rather than throwing. */
        $user = auth('api')->user();

        $request->setUserResolver(fn () => $user);

        $isPublicRead = $config['public'] && $request->isMethodSafe();

        /* POST-only opening for lead submission: a visitor can create an enquiry
           without a token, and still cannot read, edit or delete anything. */
        $isPublicCreate = ($config['publicCreate'] ?? false) && $request->isMethod('POST');

        if (! $isPublicRead && ! $isPublicCreate && ! $user) {
            throw new AuthenticationException;
        }

        return $next($request);
    }
}
