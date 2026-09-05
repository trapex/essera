---
name: testing-checkout-storefront
description: How to run and end-to-end test the essera storefront checkout/payment flow locally against the essera-backend Stripe checkout API, without making real Stripe calls.
---

# Testing the essera storefront checkout flow locally

The storefront (`/checkout`, `/checkout/success`, `/checkout/cancel`) talks to the
essera-backend `POST /checkout/payment`, `GET /checkout/payment/:orderId` and
`POST /checkout/stripe/webhook` endpoints. To prove the flow end-to-end you need the backend,
a database, and a Stripe stand-in. None of this needs real Stripe credentials.

## Devin Secrets Needed
- None for the guest checkout path (what is described here).
- `SUPABASE_URL` + a Supabase bearer token if you want to exercise the *authenticated* checkout
  branch — otherwise only the guest path is covered.
- A Google Maps API key if you need the address autocomplete on the delivery form; without it the
  address field still works, you just type the address manually.
- A Stripe **test** secret key only if you deliberately want to hit real Stripe. Do not do this by
  default.

## Stack to bring up

1. **Postgres** (throwaway, in Docker) and the backend from `essera-backend`:
   apply migrations with `npx prisma migrate deploy` (needs `DATABASE_URL` exported),
   seed at least one ACTIVE product with a variant, a size and stock > 1, then run the built
   `dist/main.js` on `:3001` with `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
   `STOREFRONT_URL=http://localhost:3000`, `DATABASE_URL`, `SUPABASE_URL`.
   See the `testing-checkout` skill in `essera-backend` for the Postgres/Stripe-stub details
   (in particular the `require.cache` trick needed to redirect the Stripe SDK — patching
   `module.default` silently does nothing).

2. **Fake Stripe** on some local port. Beyond accepting `POST /v1/checkout/sessions`, make it
   return a `url` you control that points at *itself* (e.g. `http://localhost:12111/c/pay/<id>`)
   and serve a small stand-in "hosted checkout" page there with **Pay** and **Cancel** links built
   from the `success_url` / `cancel_url` the backend sent. Without this the backend returns a real
   `checkout.stripe.com` URL and the browser redirect cannot be observed locally.
   Important: the Pay link must only navigate to `success_url` — it must NOT mark the order paid.
   Only a signed webhook should do that, which is exactly what makes the
   "PENDING success page must not clear the cart" assertion testable.

3. **A logging reverse proxy** in front of the backend (e.g. `:3005` → `:3001`) that appends every
   `/checkout*` request (method, url, raw body) to a log file, and point the storefront at it with
   `NEXT_PUBLIC_API_URL=http://localhost:3005` in `.env.local`. This gives byte-exact proof of
   what the browser sent — the only reliable way to assert "no prices/totals in the payload" and
   "exactly one session created on a double-click". Give the proxy an optional
   `PROXY_DELAY_MS` for `POST /checkout/payment` so the CTA's disabled/`aria-busy` loading state
   stays on screen long enough to inspect and record.

4. **Storefront**: `npx next dev -p 3000` in `essera`.

## Gotchas

- **Case-sensitive filesystem**: `src/components/modals/CartModal/CartModal.tsx` imports
  `./cartModal.module.css` while the tracked file is `CartModal.module.css`. On Linux this makes
  *every* page 500 with `Module not found: Can't resolve './cartModal.module.css'`. If you hit
  this, a temporary untracked symlink unblocks testing, but the real fix is to correct the import
  (or rename the file). Check for other similar mismatches before blaming your setup.
- Background helpers (fake Stripe, proxy) die with their parent shell. Start them with
  `setsid nohup ... &` or in a long-lived session, and re-verify with `curl` after any `pkill`.
- Reseeding recreates products with **new ids** — always read the current ids from
  `GET /products` instead of hardcoding them in the plan.
- The cart is Zustand `persist` under `localStorage["cart-v1"]`; assert on it directly
  (`{"state":{"items":[...]}}`) rather than only on the header badge.
- The success page polls every 2s for 30s. Budget for the full timeout when asserting the
  "payment is being processed" state, and send the webhook *while* the page is still polling to
  prove it flips without a manual reload.
- To force a 409 insufficient-stock error, lower `productSize.quantity` in the DB below the cart
  quantity (the model is `productSize` with fields `size`/`quantity`, not `size`/`name`).
- To force a transport-level failure, kill the proxy so `fetch` rejects, then restart it.
- When scanning rendered HTML for leaked internals, `fetchpriority` on Next.js `<link rel=preload>`
  is a false positive for the substring `fetch`.
