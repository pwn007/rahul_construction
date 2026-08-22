import { Router } from 'express';
import { z } from 'zod';
import { resourceController } from '../controllers/resource.controller.js';
import { asyncHandler, rateLimit, validate } from '../middleware/index.js';
import { RESOURCES } from '../repositories/registry.js';
import { notifyLead, leadAlertsEnabled } from '../services/notify.service.js';

const router = Router();

/* ------------------------------------------------------------------ */
/* Meta                                                                */
/* ------------------------------------------------------------------ */

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    /* Surfaced so "why did nobody get told about that lead" is one curl away. */
    leadAlerts: leadAlertsEnabled(),
  });
});

router.get('/', (_req, res) => {
  res.json({
    name: 'Neetu Archstone API',
    version: '1.0.0',
    phase: 'Phase 1 — JSON-backed prototype',
    resources: RESOURCES,
    routes: {
      list: 'GET /api/:resource',
      get: 'GET /api/:resource/:id',
      create: 'POST /api/:resource',
      update: 'PUT /api/:resource/:id',
      remove: 'DELETE /api/:resource/:id',
    },
    note: 'Response shapes match the frontend mock adapter exactly. Set VITE_API_MODE=http in the web app to use this API.',
  });
});

/* ------------------------------------------------------------------ */
/* Public lead capture — validated and rate limited                    */
/* ------------------------------------------------------------------ */

const phone = z.string().regex(/^[+]?[\d\s-]{10,15}$/, 'Invalid phone number');

/**
 * Consent and first-touch attribution, carried by every captured lead.
 *
 * Spread into both schemas rather than nested, because the stored record is
 * flat and `validate()` reassigns `req.body` to whatever this parses to — a
 * nested object here would silently change the shape on disk.
 *
 * `consentText` is stored alongside the timestamp deliberately: the DPDP Act
 * requires consent to be informed, and proving that means knowing which wording
 * a given person agreed to, not merely that they ticked something once.
 */
const leadMeta = {
  consentAt: z.string().datetime().optional(),
  consentText: z.string().max(400).optional(),
  utmSource: z.string().max(120).optional(),
  utmMedium: z.string().max(120).optional(),
  utmCampaign: z.string().max(120).optional(),
  referrer: z.string().max(500).optional(),
  landingPage: z.string().max(500).optional(),
};

const enquirySchema = z.object({
  name: z.string().min(2),
  phone,
  email: z.string().email().optional().or(z.literal('')),
  serviceInterest: z.string().min(1),
  city: z.string().optional(),
  budget: z.string().optional(),
  /**
   * Optional, and deliberately so.
   *
   * This was `min(10)`, which suited the contact page — the only surface that
   * existed when it was written — and made every short capture unpostable. The
   * contact page still enforces its own minimum client-side, where the rule
   * belongs: it is a quality bar for one form, not a property of an enquiry.
   */
  message: z.string().max(4000).optional(),
  source: z.string().default('contact-form'),
  stage: z.string().default('new'),
  ...leadMeta,
});

const estimateSchema = z.object({
  name: z.string().min(2),
  phone,
  email: z.string().email().optional().or(z.literal('')),
  propertyType: z.string(),
  /**
   * Built-up area of one floor.
   *
   * Was `plotArea: z.number().positive()`, required, long after the estimator
   * had renamed the field — so in `VITE_API_MODE=http` every estimator lead was
   * rejected outright with a 400 on a missing key the client had no way to send.
   * Mock mode has no validation, which is why it survived: the surface where it
   * was tested was the one surface that could not see it.
   */
  areaPerFloor: z.number().positive(),
  areaUnit: z.string(),
  floors: z.number().int().min(1).max(5),
  packageType: z.string(),
  qualityTier: z.string(),
  location: z.string(),
  enhancements: z.array(z.string()).default([]),
  /**
   * The exact specification, materialKey → brandKey, so an estimator can
   * rebuild the quotation line by line rather than guess at what a tier meant
   * on the day. Flat, matching what the material picker actually sends; the
   * nested `record(record(string))` here previously would have stripped it.
   */
  materials: z.record(z.string()).optional(),
  materialsCost: z.number().nonnegative().optional(),
  builtUpArea: z.number().positive(),
  totalMin: z.number().nonnegative(),
  totalMax: z.number().nonnegative(),
  timelineWeeks: z.number().int().positive(),
  stage: z.string().default('new'),
  ...leadMeta,
});

/*
 * Alerts fire after the record is written and are never awaited.
 *
 * The visitor's confirmation must not wait on a webhook, and a webhook that is
 * down must not turn a stored lead into a failed submission. `notifyLead`
 * swallows its own errors for the same reason.
 */
router.post(
  '/enquiries',
  rateLimit(10, 60_000),
  validate(enquirySchema),
  asyncHandler(async (req, res) => {
    const lead = req.body as z.infer<typeof enquirySchema>;
    req.params['resource'] = 'enquiries';
    await resourceController.create(req, res);
    void notifyLead({
      kind: 'enquiry',
      name: lead.name,
      phone: lead.phone,
      email: lead.email || undefined,
      source: lead.source,
      detail: `Interested in: ${lead.serviceInterest}${lead.budget ? ` · Budget ${lead.budget}` : ''}`,
    });
  }),
);

router.post(
  '/estimates',
  rateLimit(20, 60_000),
  validate(estimateSchema),
  asyncHandler(async (req, res) => {
    const lead = req.body as z.infer<typeof estimateSchema>;
    req.params['resource'] = 'estimates';
    await resourceController.create(req, res);
    void notifyLead({
      kind: 'estimate',
      name: lead.name,
      phone: lead.phone,
      email: lead.email || undefined,
      source: 'estimator',
      detail:
        `${lead.propertyType} · ${lead.floors} floor(s) · ${lead.builtUpArea} sq ft · ${lead.location}\n` +
        `Estimate: ₹${lead.totalMin.toLocaleString('en-IN')} – ₹${lead.totalMax.toLocaleString('en-IN')}`,
    });
  }),
);

/* ------------------------------------------------------------------ */
/* Generic resource CRUD                                               */
/*                                                                     */
/* One route table serves all 27 resources, exactly as one config-driven*/
/* engine serves all admin modules on the frontend. Phase 2 adds auth   */
/* middleware here — `requireAuth` on writes, `requirePermission` per   */
/* resource — without touching controllers or services.                */
/* ------------------------------------------------------------------ */

router.get('/:resource', asyncHandler(resourceController.list));
router.get('/:resource/:id', asyncHandler(resourceController.get));
router.post('/:resource', rateLimit(60, 60_000), asyncHandler(resourceController.create));
router.put('/:resource/:id', asyncHandler(resourceController.update));
router.patch('/:resource/:id', asyncHandler(resourceController.update));
router.delete('/:resource/:id', asyncHandler(resourceController.remove));

export default router;
