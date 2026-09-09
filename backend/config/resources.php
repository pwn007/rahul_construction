<?php

use App\Models\{
    Application, Banner, BaseRate, ClientLogo, Download, Enhancement, Enquiry, EstimatorPrice,
    EstimateRequest, Faq, FooterColumn, GalleryItem, HomeSection, Job,
    LocationMultiplier, MaterialSpec, MediaAsset, NavItem, Post, Project, Role,
    SeoMeta, Service, Setting, TeamMember, Testimonial, User
};

/**
 * The entire API surface, as data.
 *
 * `ResourceController` reads this and implements list / show / store / update /
 * destroy for all 26 resources. There is no per-resource controller because there
 * is no per-resource behaviour: `web_next/src/services/resource.service.ts` builds
 * every service from one `createResourceService()` factory, and the mock adapter
 * answers all of them from one `applyQuery()`. A hand-written controller per
 * resource would be 26 chances to diverge from a contract that has exactly one shape.
 *
 * ── The keys are the frontend's, not Laravel's ─────────────────────────────
 * `careers`, not `jobs`. `blogs`, not `posts`. `team`, not `team-members`. These
 * come from `RESOURCES` in `web_next/src/services/index.ts` and they are what the
 * URLs actually say, so this map is the only place the two naming schemes meet.
 *
 * ── `search` ───────────────────────────────────────────────────────────────
 * The mock adapter searches a fixed list of ten field names —
 * title · name · question · label · heading · filename · email · key · excerpt ·
 * summary — across whatever rows it holds, silently skipping fields a row does
 * not have. SQL cannot skip a column that does not exist, so each resource lists
 * its own intersection with that ten. Adding a column here that the table lacks
 * is a 500, not an empty result.
 *
 * All three lead tables accept public POSTs as of the production flip — the
 * live site's six forms (contact, estimator gate, careers, idle popup,
 * newsletter, downloads) each write to one of them, and a form that 401s on a
 * visitor is a lead lost silently.
 *
 * ── `public` ───────────────────────────────────────────────────────────────
 * true  → anyone may GET, but only rows with status = 'published'
 * false → GET requires a session
 * Writes always require a session, except the three lead endpoints, which have
 * their own routes and their own throttles.
 *
 * The mock adapter has no such distinction — it is a demo and returns drafts to
 * everybody. Matching that exactly would mean publishing every unfinished project
 * and every lead's phone number, so this is a deliberate divergence. The contract
 * diff runs authenticated, where the two agree again.
 */
return [

    /* ── Portfolio ─────────────────────────────────────────────────────── */
    'projects' => ['model' => Project::class, 'public' => true, 'search' => ['title', 'excerpt']],
    'services' => ['model' => Service::class, 'public' => true, 'search' => ['title', 'summary']],

    /* ── Social proof ──────────────────────────────────────────────────── */
    'testimonials' => ['model' => Testimonial::class, 'public' => true, 'search' => ['name', 'title']],
    'team' => ['model' => TeamMember::class, 'public' => true, 'search' => ['name']],
    'client-logos' => ['model' => ClientLogo::class, 'public' => true, 'search' => ['name']],

    /* ── Media & editorial ─────────────────────────────────────────────── */
    'blogs' => ['model' => Post::class, 'public' => true, 'search' => ['title', 'excerpt']],
    'faqs' => ['model' => Faq::class, 'public' => true, 'search' => ['question']],
    'gallery' => ['model' => GalleryItem::class, 'public' => true, 'search' => ['title']],
    'downloads' => ['model' => Download::class, 'public' => true, 'search' => ['title']],

    /* The media library is the admin's file list, not site content. */
    'media' => ['model' => MediaAsset::class, 'public' => false, 'search' => ['filename']],

    /* ── People ops ────────────────────────────────────────────────────── */
    'careers' => ['model' => Job::class, 'public' => true, 'search' => ['title', 'summary']],

    /* ── Leads. Never publicly readable — these are names and phone numbers.
       `publicCreate` opens POST alone: a visitor can *submit* a lead without a
       token, and still cannot read, edit or delete one. */
    /* `notify` is the subject-label of the owner-alert mail sent on every new
       row (ResourceController::notifyLead). Absent = no mail for that
       resource. The mail goes to LEAD_NOTIFY_TO (config/mail.php lead_to). */
    'applications' => ['model' => Application::class, 'public' => false, 'publicCreate' => true, 'search' => ['name', 'email'], 'notify' => 'New job application'],
    'enquiries' => ['model' => Enquiry::class, 'public' => false, 'publicCreate' => true, 'search' => ['name', 'email'], 'notify' => 'New enquiry'],
    'estimates' => ['model' => EstimateRequest::class, 'public' => false, 'publicCreate' => true, 'search' => ['name', 'email'], 'notify' => 'New estimate request'],

    /* ── Site content & chrome ─────────────────────────────────────────── */
    'banners' => ['model' => Banner::class, 'public' => true, 'search' => ['title']],
    'home-sections' => ['model' => HomeSection::class, 'public' => true, 'search' => ['key', 'label', 'heading']],
    'navbar' => ['model' => NavItem::class, 'public' => true, 'search' => ['label']],
    'footer' => ['model' => FooterColumn::class, 'public' => true, 'search' => ['heading']],
    'seo' => ['model' => SeoMeta::class, 'public' => true, 'search' => ['title']],
    'settings' => ['model' => Setting::class, 'public' => true, 'search' => ['key', 'label']],

    /* ── Access control ────────────────────────────────────────────────── */
    'users' => ['model' => User::class, 'public' => false, 'search' => ['name', 'email']],
    'roles' => ['model' => Role::class, 'public' => false, 'search' => ['name']],

    /* ── Estimator configuration ───────────────────────────────────────── */
    /* The one the live quote engine actually reads (flat editable rates);
       the ones below are the retired wizard's collections, kept for contract
       parity. */
    'estimator-prices' => ['model' => EstimatorPrice::class, 'public' => true, 'search' => ['key', 'label']],
    'estimator-rates' => ['model' => BaseRate::class, 'public' => true, 'search' => ['key', 'label']],
    'estimator-materials' => ['model' => MaterialSpec::class, 'public' => true, 'search' => ['key', 'label']],
    'estimator-locations' => ['model' => LocationMultiplier::class, 'public' => true, 'search' => ['key', 'label']],
    'estimator-enhancements' => ['model' => Enhancement::class, 'public' => true, 'search' => ['key', 'label']],
];
