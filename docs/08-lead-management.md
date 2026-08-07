# Lead management — how enquiries work, and what production needs

Answers the three questions asked during the demo review: how the enquiry form
works, where leads go, and whether an admin panel is needed for them.

---

## 1. What happens today (Phase 1 / demo)

```
Visitor submits          enquiriesService.create()
       │                          │
       ▼                          ▼
  ContactPage ──────────►  ApiAdapter  ──┬── mockAdapter()   ← DEFAULT
  Estimator (PDF gate)                   └── httpAdapter()   ← written, unused
  Downloads gate                                 │
  Footer newsletter                              ▼
                                        Express API → JsonRepository
```

Every form on the site goes through one seam: `createResourceService()` in
[`web/src/services/resource.service.ts`](../web/src/services/resource.service.ts),
which calls an `ApiAdapter`. Which adapter is chosen is a single line in
[`web/src/services/client.ts`](../web/src/services/client.ts):

```ts
const MODE = import.meta.env['VITE_API_MODE'] ?? 'mock';
export const api: ApiAdapter = MODE === 'http' ? httpAdapter(API_URL) : mockAdapter();
```

**There is no `.env` file, so `MODE` is `mock`.** The mock adapter writes to
`localStorage['archstone.admin.overrides']` — in *the visitor's own browser*.

That is exactly right for a demo — you can submit an enquiry on the public site,
open `/admin/enquiries`, and watch it appear with the sidebar badge increment —
and completely wrong for production, where the lead never leaves the visitor's
machine. **This is the single thing that must change before launch.**

### The four lead sources the site produces

| Source | Where | Fields captured |
|---|---|---|
| `contact-form` | Contact page | name, phone, email, service, budget, **preferred callback window**, message |
| `estimator` | PDF download gate on the result screen | name, phone, email + the **entire configuration** and the `totalMin`/`totalMax` range |
| `download` | Gated documents | name, phone, which file |
| `newsletter` | Footer | email |

The estimator lead is by far the richest — it arrives with the plot area, floors,
package, quality tier, locality, material specification and the price range the
visitor was shown. A salesperson opening it knows more than a first phone call
would normally establish.

---

## 2. Going to production

### Storage

About 90% is already written and deliberately unwired:

- `httpAdapter` — complete, and already unwraps the server's `{ data }` envelope.
- The Express API — routes, controller, service, `Repository<T>`, Zod validation,
  rate limiting on the two lead endpoints.
- `PrismaRepository` — a complete implementation, compiled against a structural
  interface so it builds without `@prisma/client` installed.
- `prisma/schema.prisma` — 768 lines, 30+ models, including `Enquiry` with a real
  `assignedToId → User` relation and indexes on `(stage, createdAt)` and `source`.

The switch is three steps:

1. Set `VITE_API_MODE=http` in the web `.env`.
2. Point `getRepository()` in
   [`server/src/repositories/registry.ts`](../server/src/repositories/registry.ts)
   at `PrismaRepository` instead of `JsonRepository` — one line.
3. Provision a managed Postgres (Neon or Supabase free tier is ample at this
   volume), run the migration, deploy the server.

**Three things will bite on that day if not handled first** — two are now fixed:

- ~~`estimateSchema` omitted `materialMode`, `materials` and `specAdjustment`, so
  Zod would have silently stripped the whole material specification off every
  estimate lead.~~ **Fixed.**
- ~~Lead-capture failures were swallowed with `.catch(() => undefined)` while the
  visitor was told "We will call you within one working day."~~ **Fixed.**
- `tsc` does not copy `server/src/data/*.json` into `dist/`, so `npm start` on the
  built server starts with no data and writes to an empty `dist/data`. Irrelevant
  once Prisma is the repository, but it will look like data loss if JSON mode is
  ever deployed.

### Notification — the part that does not exist at all

There is **no email, SMS, WhatsApp or webhook code anywhere in the repository**.
Nothing tells the business a lead arrived. Recommended, in priority order:

1. **WhatsApp to the team** (WhatsApp Business Cloud API). The team already works
   on WhatsApp, and in construction the firm that replies first usually wins the
   site visit. Send name, phone, service and — for estimator leads — the price
   range, with a `wa.me` deep link to reply in one tap. Free tier covers roughly
   1,000 conversations/month.
2. **Email to the office inbox** (Resend or plain SMTP). The durable, searchable
   record, and the fallback when WhatsApp is down. ~3,000/month free.
3. **Auto-reply to the visitor.** Confirms receipt and sets the callback
   expectation. Cheap, and it stops the "did that go through?" re-submission.

All three belong on the server, in the `POST /enquiries` and `POST /estimates`
handlers, *after* the write succeeds — never in the browser, where an API key
would be public.

### Admin authentication — a launch blocker

`/admin` currently has **no authentication of any kind**. No login screen, no
guard, no session; `AdminRoutes.tsx` hard-codes `const user = users[0]`. Anyone
who types the URL gets all 28 modules — Users, Roles, Settings, and every lead —
with hard delete. The server is the same: `POST`/`PUT`/`DELETE /api/:resource/:id`
are unauthenticated, so enabling `http` mode without auth would expose
destructive writes to anyone who can reach the port.

This is fine for a local demo and must not ship. Needs: a login screen, JWT
session, a route guard on the client, and `requireAuth`/`requirePermission`
middleware enforced on the server — the route file already marks where.

---

## 3. Does the site need an admin panel just for contact forms?

**For contact forms alone, no** — email plus a spreadsheet would do. But that is
not the question the business actually has. The panel already exists, already
owns projects, services, blog, gallery, team, pricing and SEO, and leads belong
in the same place as the content they came from. Removing it would mean running
two systems.

What it already does for every lead module, for free, from one config object:
search, filters, pagination, bulk select, create/edit/duplicate/delete, a preview
drawer, and — as of this pass — **live counts that respond to real submissions**.

What it lacks before it is a real sales tool:

| Missing | Why it matters |
|---|---|
| Notes / activity log | "Called, asked to ring back Tuesday" has nowhere to live |
| Follow-up date + reminder | Leads go cold silently |
| Real assignment | `assignedTo` is a free-text box, not a user picker |
| CSV export | The client will want their data in Excel |
| Bulk stage change | Ten "new" leads take ten edits |
| Stage-change history | No way to see how long a lead sat in a stage |
| Sorting | `sortable` is declared on columns but never wired to the query |

If the client would rather rent than build, sending leads into **Zoho CRM** or
**HubSpot** (both free at this volume) gets all of the above immediately, and the
panel stays as the content CMS. That is a legitimate choice and probably the
faster path to a working sales process.

---

## 4. Recommended contact mix

The site currently offers phone, WhatsApp, email, the enquiry form, the estimator
and gated downloads. That is the right set — the gaps were consistency, not
coverage:

- **Call and WhatsApp** are the primary channels for a Jaipur homeowner and are
  correctly the most prominent (floating rail, navbar, hero, footer).
- **The estimator is the strongest lead magnet** because it gives something real
  before asking for anything. Keep it ungated.
- **The enquiry form** is for people who want to write it down, and now captures
  a preferred callback window.
- **"Book a consultation" and "site visit"** appear across the site. The contact
  form now asks *when* to call; a real calendar (Cal.com embed) is the Phase 2
  version.
- **Live chat** — not recommended. It only works if someone is genuinely there to
  answer; an unattended widget is worse than none. WhatsApp already fills this
  role and the team is already in it.

### Suggested workflow

```
new ──► contacted ──► qualified ──► proposal ──► won
 │          │             │             │
 └──────────┴─────────────┴─────────────┴──► lost (with a reason)
```

- **new → contacted** within 1 working hour during business hours. This is the
  single highest-leverage number in the whole funnel.
- **contacted → qualified** after the site visit or a serious call: plot
  confirmed, budget band confirmed, timeline confirmed.
- **qualified → proposal** when a BOQ has gone out.
- Estimator leads should skip ahead — they arrive pre-qualified with an area and
  a budget range already attached.

---

## 5. Why our estimator does not copy archubicbuildcon.com

Their calculator is a three-step wizard — Select Materials → Project Details →
Get Estimate — that ends on "Thank you! Our team will share your detailed cost
estimate within 24 hours."

**It never shows a cost.** Their client bundle contains no arithmetic at all: no
`reduce`, no `parseFloat`, no rate table. The `₹NN/sqft` labels next to each
material are inert strings that are never parsed or summed. The submit handler
POSTs the form and discards the response. Their own homepage promises "Instant
Cost Breakup — within seconds".

So the flow to copy is the *shape* (short, obviously-finite, one clear question
per screen), not the substance. Ours is now three steps to a real, itemised
number with a PDF — shorter than theirs in perceived effort, and it actually
answers the question the visitor came to ask.

| | Archubic | Neetu Archstone |
|---|---|---|
| Steps before the number | 3 | 3 |
| Does it show a number? | **No** — 24-hour promise | **Yes**, instantly |
| Output | A checkmark | Range, per-sqft, head-wise split, programme, payment schedule, branded PDF |
| Material detail | 13 categories, discarded on submit | 14 categories, priced as a delta from the package spec, optional |
| Lead data | name, phone, area, city | full configuration + price range |
