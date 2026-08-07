import { Router } from 'express';
import { z } from 'zod';
import { resourceController } from '../controllers/resource.controller.js';
import { asyncHandler, rateLimit, validate } from '../middleware/index.js';
import { RESOURCES } from '../repositories/registry.js';

const router = Router();

/* ------------------------------------------------------------------ */
/* Meta                                                                */
/* ------------------------------------------------------------------ */

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
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

const enquirySchema = z.object({
  name: z.string().min(2),
  phone,
  email: z.string().email().optional().or(z.literal('')),
  serviceInterest: z.string().min(1),
  city: z.string().optional(),
  budget: z.string().optional(),
  message: z.string().min(10),
  source: z.string().default('contact-form'),
  stage: z.string().default('new'),
});

const estimateSchema = z.object({
  name: z.string().min(2),
  phone,
  email: z.string().email().optional().or(z.literal('')),
  propertyType: z.string(),
  plotArea: z.number().positive(),
  areaUnit: z.string(),
  floors: z.number().int().min(1).max(5),
  packageType: z.string(),
  qualityTier: z.string(),
  location: z.string(),
  enhancements: z.array(z.string()).default([]),
  /**
   * The estimator's material specification.
   *
   * These three were missing from this schema while the client had been sending
   * them since the material picker shipped. Zod strips unknown keys and
   * `validate()` reassigns `req.body` to the parsed result, so the entire
   * specification was being discarded on arrival — silently, and only once
   * VITE_API_MODE=http made this route live at all.
   */
  materialMode: z.enum(['recommended', 'custom']).optional(),
  materials: z.record(z.record(z.string())).optional(),
  specAdjustment: z.number().optional(),
  builtUpArea: z.number().positive(),
  totalMin: z.number().nonnegative(),
  totalMax: z.number().nonnegative(),
  timelineWeeks: z.number().int().positive(),
  stage: z.string().default('new'),
});

router.post(
  '/enquiries',
  rateLimit(10, 60_000),
  validate(enquirySchema),
  asyncHandler(async (req, res) => {
    req.params['resource'] = 'enquiries';
    await resourceController.create(req, res);
  }),
);

router.post(
  '/estimates',
  rateLimit(20, 60_000),
  validate(estimateSchema),
  asyncHandler(async (req, res) => {
    req.params['resource'] = 'estimates';
    await resourceController.create(req, res);
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
