<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The civil-work quantity engine — the September 2026 estimator revamp.
 *
 * The old estimator computed everything client-side from a 23-material,
 * 73-brand configuration and showed only a rupee range; the number was hard
 * to trust and impossible to retune without a rebuild. This endpoint inverts
 * that: the visitor gives a plot size, the server answers with the actual
 * shopping list — so many bricks, so many bags — priced line by line from
 * config/estimator.php, plus labour, overheads and a range. Quantities are
 * the product; the rupee total is just their sum.
 *
 * Public and unauthenticated on purpose: it stores nothing and reads nothing
 * private — it is arithmetic. The lead is captured later, when the visitor
 * unlocks the PDF and the frontend POSTs /api/estimates as before.
 */
class EstimatorController extends Controller
{
    public function quote(Request $request): JsonResponse
    {
        $cfg = config('estimator');

        /* The admin's price list (estimator_prices) overlays the config
           defaults — rates only, never structure. Missing row or a row parked
           in draft → the config rate stands, which is the owner's kill-switch
           for a bad edit. The catch keeps the calculator alive even if the
           table is absent (fresh deploy before the SQL ran) or the DB is
           down: quoting at default rates beats a 500 on the lead page. */
        try {
            $db = \App\Models\EstimatorPrice::query()->where('status', 'published')->pluck('rate', 'key');
        } catch (\Throwable) {
            $db = collect();
        }


        $validated = $request->validate([
            'areaPerFloor' => 'required|numeric|min:50|max:100000',
            'areaUnit' => 'required|string|in:'.implode(',', array_keys($cfg['units'])),
            'floors' => 'required|integer|min:1|max:'.$cfg['floors_max'],
            'package' => 'sometimes|string|in:'.implode(',', $cfg['packages']),
            /* material key → option key. Unknown keys and unknown options fall
               back to the default silently — a stale saved draft must degrade,
               not 422. */
            'selections' => 'sometimes|array',
            'selections.*' => 'string|max:40',
        ]);

        $selections = $validated['selections'] ?? [];
        $package = $validated['package'] ?? 'civil';

        /* Which tiers this package includes. Civil is always the base — the
           finishing lines stack on top of it, never replace it. */
        $tiers = $package === 'semi-furnished' ? ['civil', 'semi'] : ['civil'];

        $builtUp = round($validated['areaPerFloor'] * $cfg['units'][$validated['areaUnit']] * $validated['floors']);

        $materialsTotal = 0;
        $lines = [];
        foreach ($cfg['lines'] as $line) {
            if (! in_array($line['tier'], $tiers, true)) {
                continue;
            }
            $options = array_map(function (array $o) use ($db, $line) {
                $o['rate'] = (int) ($db[$line['key'].':'.$o['key']] ?? $o['rate']);

                return $o;
            }, $line['options']);
            $chosen = collect($options)->firstWhere('key', $selections[$line['key']] ?? null)
                ?? collect($options)->firstWhere('default', true)
                ?? $options[0];

            $wastes = $line['wastes'] ?? true;
            $buffer = $wastes ? 1 + $cfg['wastage'] : 1.0;
            $qty = ceil($line['coefficient'] * $builtUp * $buffer);
            $amount = round($qty * $chosen['rate']);
            $materialsTotal += $amount;

            /* The headline quantity in the unit people buy in (see config);
               the raw qty/unit pair becomes the sub-line when this is set. */
            $buyQty = null;
            $buyUnit = null;
            if (isset($line['buy'])) {
                $b = $line['buy'];
                $n = $qty / $b['per'];
                $n = $b['round'] === 'd1' ? round($n, 1) : (int) ceil($n);
                $buyQty = rtrim(rtrim(number_format($n, 1), '0'), '.');
                $buyUnit = $b['unit'];
            }

            $lines[] = [
                'key' => $line['key'],
                'label' => $line['label'],
                'unit' => $line['unit'],
                'qty' => $qty,
                'rate' => $chosen['rate'],
                'amount' => $amount,
                'note' => $line['note'],
                'coefficient' => $line['coefficient'],
                'wastes' => $wastes,
                'group' => $line['tier'] === 'civil' ? 'structure' : 'finishing',
                'buyQty' => $buyQty,
                'buyUnit' => $buyUnit,
                'chosen' => ['key' => $chosen['key'], 'label' => $chosen['label'], 'detail' => $chosen['detail'] ?? ''],
                /* The full brand list rides along so the UI builds its pickers
                   from this response — rates exist in exactly one place. */
                'options' => array_map(fn ($o) => [
                    'key' => $o['key'],
                    'label' => $o['label'],
                    'detail' => $o['detail'] ?? '',
                    'rate' => $o['rate'],
                    'default' => (bool) ($o['default'] ?? false),
                    'logo' => $o['logo'] ?? null,
                    'photo' => $o['photo'] ?? null,
                ], $options),
            ];
        }

        $labourRates = [
            'civil' => (int) ($db['labour:civil'] ?? $cfg['labour_rate']['civil']),
            'semi-furnished' => (int) ($db['labour:semi-furnished'] ?? $cfg['labour_rate']['semi-furnished']),
        ];
        /* DB row holds a whole percent (15); the config fallback is a fraction. */
        $overheadsPct = (float) ($db['overheads'] ?? $cfg['overheads'] * 100);

        $labour = round($labourRates[$package] * $builtUp);
        $overheads = round(($materialsTotal + $labour) * $overheadsPct / 100);
        $total = $materialsTotal + $labour + $overheads;

        $t = $cfg['timeline'];
        $weeks = ($t['base'] + ($builtUp / 1000) * $t['per_thousand'] + ($validated['floors'] - 1) * $t['per_floor']) * $t['factor'];

        return response()->json(['data' => [
            'package' => $package,
            'builtUpArea' => $builtUp,
            'wastagePct' => (int) round($cfg['wastage'] * 100),
            'lines' => $lines,
            'materialsTotal' => $materialsTotal,
            /* The active package's own rate, a scalar — the map went out once
               and the UI's formatCurrency printed an em-dash off it (the type
               always said number). Nothing needs the other package's rate. */
            'labour' => ['rate' => $labourRates[$package], 'amount' => $labour],
            'overheads' => ['pct' => (int) round($overheadsPct), 'amount' => $overheads],
            'total' => $total,
            'totalMin' => (int) round($total * $cfg['range_low']),
            'totalMax' => (int) round($total * $cfg['range_high']),
            'timelineWeeks' => (int) round(max($t['min'], min($t['max'], $weeks))),
        ]]);
    }
}
