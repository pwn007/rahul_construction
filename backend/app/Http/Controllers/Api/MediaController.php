<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MediaAsset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Photo upload for the admin panel.
 *
 * Files land OUTSIDE the Laravel tree, in `public_html/uploads/YYYY/MM/` —
 * `backend/`'s deny-all .htaccess covers everything inside the app, so an
 * upload stored there would be a file nobody could ever load. One level up,
 * `/uploads/...` is an ordinary public URL and the docroot .htaccess already
 * gives images there a year-long immutable cache. Filenames get a random
 * suffix, which is what makes that cache honest: replacing a photo mints a new
 * URL instead of overwriting the old one.
 *
 * Every upload is also a `media_assets` row, which is what turns the admin's
 * Media library module from an empty shell into a real index of what has been
 * uploaded — including dimensions, so an editor can tell a hero-worthy 2000px
 * frame from a 400px thumbnail without downloading either.
 */
class MediaController extends Controller
{
    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            /* 8 MB and images only. The site serves ~60 KB WebPs; the ceiling
               exists for the client uploading straight off a phone camera, not
               as an invitation. */
            'file' => ['required', 'file', 'mimes:webp,jpg,jpeg,png', 'max:8192'],
        ]);

        $file = $request->file('file');

        /* base_path() is `.../public_html/backend`, so `../uploads` is
           `public_html/uploads` on the host. Overridable for local dev, where
           the equivalent web-served spot is web_next/public/uploads. */
        $root = rtrim(env('MEDIA_UPLOAD_PATH', base_path('../uploads')), '/');
        $folder = date('Y/m');

        if (! is_dir("{$root}/{$folder}")) {
            mkdir("{$root}/{$folder}", 0755, true);
        }

        $name = sprintf(
            '%s-%s.%s',
            Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)) ?: 'image',
            Str::lower(Str::random(6)),
            strtolower($file->getClientOriginalExtension()),
        );

        $file->move("{$root}/{$folder}", $name);

        [$width, $height] = @getimagesize("{$root}/{$folder}/{$name}") ?: [null, null];

        $asset = MediaAsset::create([
            'filename' => $name,
            'url' => "/uploads/{$folder}/{$name}",
            'mimeType' => $file->getClientMimeType(),
            'sizeBytes' => filesize("{$root}/{$folder}/{$name}") ?: 0,
            'width' => $width,
            'height' => $height,
            'folder' => "uploads/{$folder}",
            'alt' => null,
        ]);

        return response()->json(['data' => $asset], 201);
    }
}
