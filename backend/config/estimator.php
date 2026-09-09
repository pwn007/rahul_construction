<?php

/*
|--------------------------------------------------------------------------
| Civil-work quantity engine
|--------------------------------------------------------------------------
| The public estimator's arithmetic (EstimatorController@quote). Coefficients
| and rates came verbatim from the frontend's calibrated material table
| (web_next/src/constants/materials.ts, structure group) — published Jaipur
| brand rates, thumb-rule quantities. Two numbers are calibrated rather than
| quoted, and the target is the firm's own published civil band of
| ₹1,200–1,400 / sq ft (constants/estimator.ts PACKAGES):
|
|   labour_rate      — market mason+labour for structure work, floor-wise for
|                      civil (450 ground-only / 350 with added floors); the old
|                      labourOnlyRate of 100 was a labour-contract headline,
|                      not the built-in labour share of a turnkey rate.
|   overheads   0.15 — shuttering, scaffolding, curing water/power,
|                      transport and supervision; nothing in the material
|                      lines carries these.
|
| With both, a 2,000 sq ft build lands at ≈ ₹1,220/sq ft all-in — inside the
| band the firm already quotes. Change rates here (cement price moved etc.)
| and the live estimator follows on the next request — no rebuild. When the
| admin-editing phase lands, this file becomes a DB read.
|
| `wastes` => false exempts a line from the wastage buffer: waterproofing is
| priced per finished sq ft of work, not per unit of material bought.
*/

return [

    /* User-decided buffer over thumb-rule quantities — spillage, breakage,
       cutting waste. Applied to material quantities, not to labour. */
    /* 0 since Sep 2026: the client chose to bake the wastage allowance into
       the rates themselves (the trade's "loaded rate") instead of showing a
       "+20%" chip — every rate above was multiplied by 1.2 (rounded) on the
       lines that used to waste, and the admin now owns rates via the
       estimator-prices table. The knob stays so the open-buffer presentation
       can come back by setting it and un-padding the rates together. */
    'wastage' => 0.0,

    /* ₹ per sq ft of built-up area, per package. Semi's 400 = civil's 250
       plus the finishing trades (tilers, painters, carpenters, electricians,
       plumbers); calibrated the same way civil was — so a 2,000 sq ft semi
       build lands at ≈ ₹2,100/sq ft all-in, inside the published
       ₹1,800–2,200 band. */
    /* Civil labour is floor-dependent since Sep 2026 (client's call, and the
       industry's: upper floors skip excavation, foundation and backfilling, so
       published guides put them 15–20% cheaper per sq ft). A ground-only build
       carries all of that one-time work on a single floor's area — ₹450; any
       added floor spreads it — ₹350. Semi-furnished stays flat by the client's
       choice. These are fallbacks; the estimator_prices rows
       (labour:civil-ground / labour:civil-upper / labour:semi-furnished) win. */
    'labour_rate' => ['civil' => ['ground' => 450, 'upper' => 350], 'semi-furnished' => 400],
    'packages' => ['civil', 'semi-furnished'],
    'overheads' => 0.15,    // fraction of (materials + labour)

    /* Spread around the point estimate — same factors the old model used. */
    'range_low' => 0.94,
    'range_high' => 1.08,

    /* Weeks: base + per-1000-sqft + per-extra-floor, × civil factor, clamped. */
    'timeline' => [
        'base' => 14,
        'per_thousand' => 3.2,
        'per_floor' => 4,
        'factor' => 0.82,
        'min' => 12,
        'max' => 104,
    ],

    'units' => [
        'sqft' => 1,
        'sqyd' => 9,
        'sqm' => 10.7639,
    ],

    'floors_max' => 6,

    /*
     * `buy` swaps a line's HEADLINE into a unit that means the same thing
     * everywhere. Tractor-trolleys were tried first and rejected: a trolley
     * runs 70–120 cft depending on the district, so "24 trolleys" misleads.
     * Tonnes are exact. Conversion basis (edit if your densities differ):
     * dry sand ~1,600 kg/m³ → 1 tonne ≈ 22 cft; 20 mm aggregate ~1,550 kg/m³
     * → 1 tonne ≈ 23 cft. The raw cft figure stays as the sub-line.
     */

    /*
     * Brand options per material — verbatim from the frontend's calibrated
     * table (constants/materials.ts), which itself mirrors the published rate
     * card. The first option marked `default` prices the line when the
     * visitor has not chosen; its rate is therefore the golden-number rate
     * the engine tests assert. A single-option line (stone) renders without
     * a picker. `logo` (site-relative, ships in the frontend export's
     * /images/brands/) turns that option's chip into a brand card — only real
     * brands carry one; sand/bricks options are types, not trademarks.
     */
    'lines' => [
        ['key' => 'cement', 'tier' => 'civil', 'label' => 'Cement', 'unit' => 'bags', 'coefficient' => 0.4, 'note' => '50 kg bags', 'options' => [
            ['key' => 'ultratech', 'label' => 'UltraTech', 'detail' => 'PPC', 'rate' => 505, 'default' => true, 'logo' => '/images/brands/ultratech.png'],
            ['key' => 'ambuja', 'label' => 'Ambuja', 'detail' => 'PPC', 'rate' => 505, 'logo' => '/images/brands/ambuja.png'],
            ['key' => 'jk-super', 'label' => 'JK Super', 'detail' => 'OPC 53-grade', 'rate' => 545, 'logo' => '/images/brands/jk-super.png'],
            ['key' => 'acc', 'label' => 'ACC', 'detail' => 'OPC 43-grade', 'rate' => 485, 'logo' => '/images/brands/acc.png'],
            ['key' => 'wonder', 'label' => 'Wonder', 'detail' => 'PPC', 'rate' => 470, 'logo' => '/images/brands/wonder.png'],
            ['key' => 'shree', 'label' => 'Shree', 'detail' => 'PPC', 'rate' => 470, 'logo' => '/images/brands/shree.png'],
        ]],
        ['key' => 'steel', 'tier' => 'civil', 'label' => 'TMT Steel', 'unit' => 'kg', 'coefficient' => 4, 'note' => 'Reinforcement bars', 'buy' => ['per' => 1000, 'unit' => 'tonnes', 'round' => 'd1'], 'options' => [
            ['key' => 'jsw', 'label' => 'JSW', 'detail' => 'Fe500D', 'rate' => 86, 'default' => true, 'logo' => '/images/brands/jsw.svg'],
            ['key' => 'tata', 'label' => 'TATA TISCON', 'detail' => 'Fe550D', 'rate' => 94, 'logo' => '/images/brands/tata.png'],
            ['key' => 'jindal', 'label' => 'Jindal Panther', 'detail' => 'Fe500D', 'rate' => 89, 'logo' => '/images/brands/jindal.png'],
            ['key' => 'kamadhenu', 'label' => 'Kamadhenu', 'detail' => 'Fe500D', 'rate' => 79, 'logo' => '/images/brands/kamadhenu.png'],
            ['key' => 'rathi', 'label' => 'Rathi', 'detail' => 'Fe500D', 'rate' => 79, 'logo' => '/images/brands/rathi.png'],
        ]],
        ['key' => 'bricks', 'tier' => 'civil', 'label' => 'Bricks', 'unit' => 'bricks', 'coefficient' => 8, 'note' => 'Masonry for walls', 'options' => [
            ['key' => 'renwel', 'label' => 'Renwel', 'detail' => 'Branded clay brick', 'rate' => 11, 'default' => true, 'photo' => '/images/materials/bricks-renwel.jpg'],
            ['key' => 'clay', 'label' => 'Clay brick', 'detail' => 'Standard local kiln', 'rate' => 11, 'photo' => '/images/materials/bricks-clay.jpg'],
            ['key' => 'flyash', 'label' => 'Fly-ash block', 'detail' => '', 'rate' => 8, 'photo' => '/images/materials/bricks-flyash.jpg'],
            ['key' => 'kanota', 'label' => 'Kanota', 'detail' => '', 'rate' => 13, 'photo' => '/images/materials/bricks-kanota.jpg'],
            ['key' => 'hanumangarh', 'label' => 'Hanumangarh', 'detail' => '', 'rate' => 13, 'photo' => '/images/materials/bricks-hanumangarh.jpg'],
        ]],
        ['key' => 'sand', 'tier' => 'civil', 'label' => 'Sand', 'unit' => 'cubic ft', 'coefficient' => 0.9, 'note' => 'Fine aggregate', 'buy' => ['per' => 22, 'unit' => 'tonnes', 'round' => 'ceil'], 'options' => [
            ['key' => 'river', 'label' => 'River sand', 'detail' => 'Screened', 'rate' => 66, 'default' => true, 'photo' => '/images/materials/sand-river.jpg'],
            ['key' => 'msand', 'label' => 'M-sand', 'detail' => 'Manufactured', 'rate' => 48, 'photo' => '/images/materials/sand-msand.jpg'],
        ]],
        ['key' => 'aggregate', 'tier' => 'civil', 'label' => 'Aggregate', 'unit' => 'cubic ft', 'coefficient' => 1.1, 'note' => 'Coarse aggregate for RCC', 'buy' => ['per' => 23, 'unit' => 'tonnes', 'round' => 'ceil'], 'options' => [
            ['key' => 'graded', 'label' => 'Graded 20 & 10 mm', 'detail' => '', 'rate' => 54, 'default' => true, 'photo' => '/images/materials/agg-graded.jpg'],
            ['key' => 'washed', 'label' => 'Washed, low-silt', 'detail' => '', 'rate' => 62, 'photo' => '/images/materials/agg-washed.jpg'],
        ]],
        ['key' => 'stone', 'tier' => 'civil', 'label' => 'Foundation stone', 'unit' => 'tonnes', 'coefficient' => 0.0125, 'note' => 'Rubble masonry footings', 'options' => [
            ['key' => 'masonry', 'label' => 'Masonry stone', 'detail' => 'Kota quarry', 'rate' => 900, 'default' => true, 'photo' => '/images/materials/stone-masonry.jpg'],
        ]],

        /*
         * Semi-furnished tier — the finishing trades, verbatim from the firm's
         * calibrated catalogue (the old wizard's constants/materials.ts). The
         * wastage buffer applies only where cut-waste is real (tiles, paint,
         * conduit, pipe); counted or made-to-size items (doors, windows,
         * grills, points, bathroom sets, tanks) carry none — padding a door
         * count by 20% would invent a phantom door.
         * water-tank sits here although the old catalogue tagged it ALL: the
         * shipped civil package was calibrated without it, and buying the
         * tank is in practice a finishing-stage purchase.
         */
        ['key' => 'flooring', 'label' => 'Flooring & tiles', 'unit' => 'sq ft', 'coefficient' => 1.0, 'tier' => 'semi', 'note' => 'Tiles laid, skirting included', 'options' => [
            ['key' => 't50', 'label' => 'Vitrified, tile up to ₹50/sq ft', 'rate' => 72, 'photo' => '/images/materials/flooring-t50.jpg'],
            ['key' => 't80', 'label' => 'Vitrified, tile up to ₹80/sq ft', 'rate' => 114, 'default' => true, 'photo' => '/images/materials/flooring-t80.jpg'],
            ['key' => 't120', 'label' => 'Large-format & marble, up to ₹120/sq ft', 'rate' => 170, 'photo' => '/images/materials/flooring-t120.jpg'],
        ]],
        ['key' => 'wall-finish', 'label' => 'Wall finish & paint', 'unit' => 'sq ft', 'coefficient' => 2.4, 'tier' => 'semi', 'note' => 'Putty + primer + paint, walls and ceilings', 'options' => [
            ['key' => 'tractor', 'label' => 'Tractor emulsion', 'rate' => 26, 'photo' => '/images/materials/wallfinish-tractor.jpg'],
            ['key' => 'premium', 'label' => 'Premium emulsion', 'rate' => 34, 'default' => true, 'photo' => '/images/materials/wallfinish-premium.jpg'],
            ['key' => 'royal', 'label' => 'Royal Matt + textures', 'rate' => 60, 'photo' => '/images/materials/wallfinish-royal.jpg'],
        ]],
        ['key' => 'doors', 'wastes' => false, 'label' => 'Doors', 'unit' => 'doors', 'coefficient' => 0.004, 'tier' => 'semi', 'note' => 'Frames and shutters, fitted', 'options' => [
            ['key' => 'flush', 'label' => 'Flush shutter', 'detail' => 'Granite frame', 'rate' => 9800, 'photo' => '/images/materials/doors-flush.jpg'],
            ['key' => 'laminated', 'label' => 'Laminated shutter', 'detail' => 'Wooden frame', 'rate' => 12000, 'default' => true, 'photo' => '/images/materials/doors-laminated.jpg'],
            ['key' => 'teak', 'label' => 'Teak veneer', 'detail' => 'Polished wooden frame', 'rate' => 14200, 'photo' => '/images/materials/doors-teak.jpg'],
        ]],
        ['key' => 'grills', 'wastes' => false, 'label' => 'Grills & safety railings', 'unit' => 'sq ft', 'coefficient' => 0.08, 'tier' => 'semi', 'note' => 'Window safety grills, painted', 'options' => [
            ['key' => 'ms-plain', 'label' => 'MS plain', 'detail' => 'Painted mild steel', 'rate' => 300, 'photo' => '/images/materials/grills-msplain.jpg'],
            ['key' => 'ms-design', 'label' => 'MS decorative', 'detail' => 'Fabricated pattern', 'rate' => 350, 'default' => true, 'photo' => '/images/materials/grills-msdecorative.jpg'],
            ['key' => 'ss', 'label' => 'SS 304', 'detail' => 'Brushed stainless', 'rate' => 600, 'photo' => '/images/materials/grills-ss.jpg'],
        ]],
        ['key' => 'windows', 'wastes' => false, 'label' => 'Windows', 'unit' => 'sq ft', 'coefficient' => 0.08, 'tier' => 'semi', 'note' => 'Glazed and fitted', 'options' => [
            ['key' => 'aluminium', 'label' => 'Aluminium', 'detail' => 'Single glazed', 'rate' => 440, 'photo' => '/images/materials/windows-aluminium.jpg'],
            ['key' => 'upvc', 'label' => 'UPVC', 'detail' => 'Single glazed', 'rate' => 520, 'default' => true, 'photo' => '/images/materials/windows-upvc.jpg'],
            ['key' => 'wooden', 'label' => 'Wooden', 'detail' => 'Seasoned hardwood', 'rate' => 520, 'photo' => '/images/materials/windows-wooden.jpg'],
        ]],
        ['key' => 'conduiting', 'label' => 'Electrical & plumbing conduiting', 'unit' => 'sq ft', 'coefficient' => 1.0, 'tier' => 'semi', 'note' => 'Electrical and plumbing lines cast in the slab', 'options' => [
            ['key' => 'isi', 'label' => 'ISI conduit, drainage cast in', 'rate' => 90, 'default' => true, 'photo' => '/images/materials/conduit-isi.jpg'],
            ['key' => 'pvc', 'label' => 'PVC conduit and sleeves', 'rate' => 74, 'photo' => '/images/materials/conduit-pvc.jpg'],
        ]],
        ['key' => 'electrical', 'wastes' => false, 'label' => 'Electrical', 'unit' => 'points', 'coefficient' => 0.025, 'tier' => 'semi', 'note' => 'Wiring, switches and boards per point', 'options' => [
            ['key' => 'anchor', 'label' => 'Anchor Penta', 'rate' => 4100, 'logo' => '/images/brands/anchor.png'],
            ['key' => 'havells', 'label' => 'Havells modular', 'rate' => 4400, 'default' => true, 'logo' => '/images/brands/havells.png'],
            ['key' => 'schneider', 'label' => 'Schneider', 'detail' => 'Modular', 'rate' => 4700, 'logo' => '/images/brands/schneider.png'],
            ['key' => 'gm', 'label' => 'GM', 'detail' => 'Modular', 'rate' => 4700, 'logo' => '/images/brands/gm.svg'],
        ]],
        ['key' => 'plumbing', 'label' => 'Plumbing', 'unit' => 'sq ft', 'coefficient' => 1.0, 'tier' => 'semi', 'note' => 'Lines, fittings and fixtures rough-in', 'options' => [
            ['key' => 'ashirvad', 'label' => 'Ashirvad', 'detail' => 'CPVC & PVC', 'rate' => 54, 'default' => true, 'logo' => '/images/brands/ashirvad.png'],
            ['key' => 'astral', 'label' => 'Astral', 'detail' => 'CPVC & PVC', 'rate' => 54, 'logo' => '/images/brands/astral.png'],
            ['key' => 'supreme', 'label' => 'Supreme', 'detail' => 'CPVC & PVC', 'rate' => 49, 'logo' => '/images/brands/supreme.png'],
            ['key' => 'prince', 'label' => 'Prince', 'detail' => 'CPVC & PVC', 'rate' => 49, 'logo' => '/images/brands/prince.png'],
            ['key' => 'kisan', 'label' => 'Kisan', 'detail' => 'CPVC & PVC', 'rate' => 44, 'logo' => '/images/brands/kisan.png'],
        ]],
        ['key' => 'bathroom', 'wastes' => false, 'label' => 'Bathroom fixtures', 'unit' => 'bathrooms', 'coefficient' => 0.0025, 'tier' => 'semi', 'note' => 'Sanitaryware and CP fittings per bathroom', 'options' => [
            ['key' => 'set35', 'label' => '₹35,000 class', 'detail' => 'Parryware, Essco or equivalent', 'rate' => 22000, 'default' => true, 'photo' => '/images/materials/bathroom-set35.jpg'],
            ['key' => 'set50', 'label' => '₹50,000 class', 'detail' => 'Jaquar, Kohler or equivalent', 'rate' => 31400, 'photo' => '/images/materials/bathroom-set50.jpg'],
        ]],
        ['key' => 'water-tank', 'wastes' => false, 'label' => 'Water tanks', 'unit' => 'tanks', 'coefficient' => 0.0004, 'tier' => 'semi', 'note' => 'Overhead storage, plumbed', 'options' => [
            ['key' => 's10', 'label' => '500 L × 2', 'rate' => 10000, 'photo' => '/images/materials/tank-small.jpg'],
            ['key' => 's15', 'label' => '1,000 L + 500 L', 'rate' => 15000, 'default' => true, 'photo' => '/images/materials/tank-small.jpg'],
            ['key' => 's50', 'label' => '5,000 L', 'rate' => 50000],
            ['key' => 's100', 'label' => '10,000 L', 'rate' => 100000],
        ]],
    ],

];
