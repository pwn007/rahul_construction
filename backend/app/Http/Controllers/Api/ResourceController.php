<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * One controller for all 26 resources.
 *
 * The specification is not this file — it is
 * `web_next/src/services/adapters/mock.adapter.ts`. That module is what the
 * entire frontend has been running against, what `/admin`'s 21 CRUD modules were
 * built to, and what `httpAdapter` expects byte-for-byte when the env var flips.
 * Every rule below is a translation of its `applyQuery()`, and where the two
 * differ deliberately it is called out in a comment.
 *
 * Response envelope is always `{ "data": … }`, because `httpAdapter` does
 * `json.data ?? json` on the way back out.
 */
class ResourceController extends Controller
{
    /** Query keys that steer the query rather than filter on a column. */
    private const RESERVED = ['page', 'pageSize', 'search', 'sort', 'order'];

    /**
     * The four columns a single-record lookup will match, in the mock's order.
     *
     * `GET /api/projects/jagatpura-villa` and `GET /api/seo/%2Fabout` both work,
     * which is why the frontend can call `bySlug()` and `byId()` against the same
     * endpoint — see `resource.service.ts`.
     */
    private const LOOKUP = ['id', 'slug', 'key', 'route'];

    public function index(Request $request, string $resource): JsonResponse
    {
        [$model, $config] = $this->resolve($resource);
        $query = $this->visible($model->newQuery(), $request);

        $params = $request->query();

        if ($search = trim((string) ($params['search'] ?? ''))) {
            $this->applySearch($query, $config['search'], $search);
        }

        $this->applyFilters($query, $model, $params);
        $this->applySort($query, $model, $params);

        /* Counted before the page is taken, and after every filter — `total` is
           how many rows match, not how many came back. */
        $total = (clone $query)->toBase()->getCountForPagination();

        $page = max(1, (int) ($params['page'] ?? 1));

        /* 24 is the mock's default. The ceiling exists because
           `resource.service.ts::all()` asks for 500 and the admin's export will
           ask for more; without it a typo in a URL can ask for the whole table. */
        $pageSize = min(1000, max(1, (int) ($params['pageSize'] ?? 24)));

        $items = $query->forPage($page, $pageSize)->get();

        return $this->ok([
            'items' => $items,
            'total' => $total,
            'page' => $page,
            'pageSize' => $pageSize,
            'totalPages' => max(1, (int) ceil($total / $pageSize)),
        ]);
    }

    public function show(Request $request, string $resource, string $key): JsonResponse
    {
        [$model] = $this->resolve($resource);

        $record = $this->visible($model->newQuery(), $request)
            ->where(function (Builder $q) use ($model, $key) {
                foreach (self::LOOKUP as $column) {
                    if ($this->hasColumn($model, $column)) {
                        $q->orWhere($column, $key);
                    }
                }
            })
            ->first();

        if (! $record) {
            throw new NotFoundHttpException("Not found: /{$resource}/{$key}");
        }

        return $this->ok($record);
    }

    public function store(Request $request, string $resource): JsonResponse
    {
        [$model] = $this->resolve($resource);

        /* Order matters and mirrors the mock exactly: the server's defaults go
           down first and the body is spread over them, so a caller that sends its
           own `status` — the admin's "save as draft" — wins. */
        $record = $model->newInstance(array_merge(
            ['status' => 'published'],
            $this->fillable($model, $request->all()),
        ));

        /* Lead tables carry the submitter's IP, and it is never the caller's to
           set — a request body can claim any address it likes. Stamped
           unconditionally *after* the fill so a spoofed `ip` field in the body
           is overwritten rather than trusted. */
        if ($this->hasColumn($model, 'ip')) {
            $record->setAttribute('ip', $request->ip());
        }

        $record->save();

        return $this->ok($record->fresh(), 201);
    }

    public function update(Request $request, string $resource, string $key): JsonResponse
    {
        [$model] = $this->resolve($resource);

        $record = $model->newQuery()->find($key);

        if (! $record) {
            throw new NotFoundHttpException("Not found: /{$resource}/{$key}");
        }

        /* A merge, not a replace — PUT and PATCH are the same handler here
           because that is what the mock does, and what `resource.service.ts`
           relies on when the admin's edit drawer submits a partial row.
           `id` is stripped so a body cannot reassign a record's identity. */
        $payload = $this->fillable($model, $request->all());

        /* `id` so a body cannot reassign a record's identity; `ip` because where
           a lead came from is a fact about the past, not an editable field. */
        unset($payload['id'], $payload['ip']);

        $record->fill($payload)->save();

        return $this->ok($record->fresh());
    }

    public function destroy(string $resource, string $key): JsonResponse
    {
        [$model] = $this->resolve($resource);

        $record = $model->newQuery()->find($key);

        if (! $record) {
            throw new NotFoundHttpException("Not found: /{$resource}/{$key}");
        }

        $record->delete();

        /* Not 204. The mock returns `{ id, deleted: true }` and
           `resource.service.ts` types `remove()` as returning it — a 204 would
           reach `httpAdapter` as `undefined`. */
        return $this->ok(['id' => $key, 'deleted' => true]);
    }

    /* ------------------------------------------------------------------ */
    /* Query construction                                                  */
    /* ------------------------------------------------------------------ */

    /**
     * Case-insensitive contains, OR'd across this resource's searchable columns.
     *
     * `utf8mb4_unicode_ci` makes LIKE case-insensitive already, which is what the
     * mock's `.toLowerCase().includes()` does. The wildcards are escaped because
     * a visitor searching for "50%" should find "50%", not everything.
     */
    private function applySearch(Builder $query, array $columns, string $search): void
    {
        $term = '%'.str_replace(['\\', '%', '_'], ['\\\\', '\%', '\_'], $search).'%';

        $query->where(function (Builder $q) use ($columns, $term) {
            foreach ($columns as $column) {
                $q->orWhere($column, 'like', $term);
            }
        });
    }

    /**
     * Every remaining query key is an equality filter on the column of that name.
     *
     * Three behaviours carried over from the mock:
     *  · `''`, `null` and the literal `'all'` mean "no filter" — `'all'` because
     *    that is the value the admin's filter dropdowns use for their empty option.
     *  · A json array column matches when it *contains* the value, so
     *    `?services=architecture` finds every project offering it.
     *  · A key that is not a column matches nothing. That is what the mock does
     *    (`String(undefined) === String(value)` is false for every row), and the
     *    guard is load-bearing here for a second reason: passing an unknown column
     *    to SQL is a 500.
     */
    private function applyFilters(Builder $query, Model $model, array $params): void
    {
        foreach ($params as $key => $value) {
            if (in_array($key, self::RESERVED, true)) {
                continue;
            }

            if ($value === null || $value === '' || $value === 'all') {
                continue;
            }

            if (! $this->hasColumn($model, $key)) {
                $query->whereRaw('1 = 0');

                continue;
            }

            $cast = $model->getCasts()[$key] ?? null;

            if ($cast === 'array') {
                $query->whereJsonContains($key, $value);

                continue;
            }

            /* Query strings have no types: `httpAdapter` sends `String(v)`, so a
               boolean filter arrives as the text "true". Comparing that against a
               tinyint(1) column matches nothing. */
            if ($cast === 'boolean') {
                $query->where($key, filter_var($value, FILTER_VALIDATE_BOOLEAN));

                continue;
            }

            $query->where($key, $value);
        }
    }

    private function applySort(Builder $query, Model $model, array $params): void
    {
        $sort = $params['sort'] ?? null;

        /* An unknown sort column falls through to the default rather than being
           fatal — the mock sorts by `undefined` on both sides, which leaves the
           order untouched. */
        if ($sort && $this->hasColumn($model, $sort)) {
            $query->orderBy($sort, ($params['order'] ?? 'asc') === 'desc' ? 'desc' : 'asc');
        } elseif ($this->hasColumn($model, 'order')) {
            /* Unsorted, the mock returns rows in the order someone typed them into
               `src/data/*.ts`. A table has no such thing, and MySQL without an
               ORDER BY returns primary-key order — which for string keys is
               alphabetical, so `prj_10` lands between `prj_1` and `prj_2`.
               The `order` column is that authored sequence written down, so it is
               the honest default wherever it exists. */
            $query->orderBy('order');
        }

        /* Always last, so a page boundary cannot shuffle. Two rows sharing an
           `order` value would otherwise be free to swap between requests, and
           row 24 could appear on both page 1 and page 2. */
        $query->orderBy($model->getKeyName());
    }

    /**
     * Drafts are for people who are signed in.
     *
     * A deliberate divergence from the mock, which has no concept of a session
     * and hands drafts to everybody. Matching it exactly would publish every
     * unfinished project the moment this goes live. Signed in, the two agree
     * again — which is the state the contract diff runs in.
     */
    private function visible(Builder $query, Request $request): Builder
    {
        if ($request->user()) {
            return $query;
        }

        return $query->where('status', 'published');
    }

    /* ------------------------------------------------------------------ */
    /* Plumbing                                                            */
    /* ------------------------------------------------------------------ */

    /** @return array{0: Model, 1: array} */
    private function resolve(string $resource): array
    {
        $config = config("resources.{$resource}");

        if (! $config) {
            throw new NotFoundHttpException("Unknown resource \"{$resource}\"");
        }

        return [new $config['model'], $config];
    }

    /**
     * Only real columns reach the model.
     *
     * `$guarded = []` on ApiModel means Eloquent would happily try to write any
     * key it is handed; a stray field from a future frontend build would be a 500
     * rather than a shrug. The mock ignores unknown keys by simply storing them,
     * which a table cannot do — dropping them is the closest honest equivalent.
     */
    private function fillable(Model $model, array $payload): array
    {
        return array_filter(
            $payload,
            fn ($key) => $this->hasColumn($model, $key),
            ARRAY_FILTER_USE_KEY,
        );
    }

    /** Column lists are cached per table — `index()` asks this once per query key. */
    private function hasColumn(Model $model, string $column): bool
    {
        static $cache = [];

        $table = $model->getTable();

        $cache[$table] ??= Schema::getColumnListing($table);

        return in_array($column, $cache[$table], true);
    }

    private function ok(mixed $data, int $status = 200): JsonResponse
    {
        return response()->json(['data' => $this->withoutNulls($data)], $status);
    }

    /**
     * Drop null-valued keys, everywhere, recursively.
     *
     * Not a stylistic preference — it is the contract. An optional field that was
     * never set is *absent* from the mock adapter's objects, because they are
     * TypeScript literals: `web_next/src/data/projects.ts` writes no `client` key
     * at all for the six projects that have no named client. A column, by
     * contrast, always exists and answers null. Without this, ten of the 26
     * resources differ on exactly those fields and on nothing else.
     *
     * It also removes a real class of frontend bug rather than merely satisfying
     * a diff. `/admin`'s edit drawer feeds a record straight into react-hook-form
     * defaults; React treats `value={null}` as "uncontrolled", so a null landing
     * in a text input silently converts the field and warns in the console. An
     * absent key gets the empty-string default the form already declares.
     *
     * The cost is that a caller cannot distinguish "never set" from "explicitly
     * cleared" — which is exactly the distinction the frontend has never had, and
     * so has never relied on.
     */
    private function withoutNulls(mixed $value): mixed
    {
        if ($value instanceof Arrayable) {
            $value = $value->toArray();
        }

        if (! is_array($value)) {
            return $value;
        }

        $out = [];

        foreach ($value as $key => $item) {
            if ($item === null) {
                continue;
            }

            $out[$key] = $this->withoutNulls($item);
        }

        /* array_is_list keeps a JSON array an array: dropping a null from the
           middle of a list would otherwise leave gaps in the keys and PHP would
           encode it as an object. */
        return array_is_list($value) ? array_values($out) : $out;
    }
}
