<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ResourceController;
use App\Http\Middleware\EnsureResourceAccess;
use Illuminate\Support\Facades\Route;

/**
 * The whole API.
 *
 * One generic controller over `config/resources.php`; the shape of every route
 * is dictated by `web_next/src/services/resource.service.ts`, which builds all 26
 * services from a single factory:
 *
 *   list()   GET    /{resource}?page&pageSize&search&sort&order&…filters
 *   byId()   GET    /{resource}/{id}          ─┐ same endpoint: the lookup matches
 *   bySlug() GET    /{resource}/{slug}        ─┘ id, slug, key or route
 *   create() POST   /{resource}
 *   update() PUT    /{resource}/{id}          (PATCH is the same handler)
 *   remove() DELETE /{resource}/{id}
 *
 * Access is decided by `EnsureResourceAccess` from the `public` flag in
 * config/resources.php — see the note in that middleware for why it is not two
 * route groups.
 */
/* ── Auth — before the generic resource routes, so `auth` is never read as a
   resource name. Login is throttled hard: five attempts a minute per IP is
   ample for a human and a wall for a script. */
Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
Route::post('auth/logout', [AuthController::class, 'logout'])->middleware('auth:api');
Route::get('auth/me', [AuthController::class, 'me'])->middleware('auth:api');

Route::middleware(EnsureResourceAccess::class)->group(function () {
    Route::get('{resource}', [ResourceController::class, 'index']);
    Route::get('{resource}/{key}', [ResourceController::class, 'show']);
    Route::post('{resource}', [ResourceController::class, 'store']);
    Route::put('{resource}/{key}', [ResourceController::class, 'update']);
    Route::patch('{resource}/{key}', [ResourceController::class, 'update']);
    Route::delete('{resource}/{key}', [ResourceController::class, 'destroy']);
})->where('resource', '[a-z0-9-]+');
