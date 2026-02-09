# Stripe Setup – Requirements & Client Message

## Stripe Requirements for This System

The app uses Stripe for:
- **Payment Intents** – quote payments / escrow (create, capture)
- **Customers** – linked to users via `stripeCustomerId`
- **Webhooks** – to receive payment events (required when using your own Stripe account; optional for testing)

### Where Stripe is integrated in the app

| Location | What it does |
|----------|----------------|
| **Dashboard → Available Jobs → Accept Quote** | Today this uses the simple “accept quote” API and creates a payment **without** charging the card. Real Stripe flow is below. |
| **Backend:** `GET /api/stripe/config` | Returns the Stripe publishable key for the frontend. |
| **Backend:** `POST /api/payments/create-intent` | Creates a Stripe Payment Intent (escrow) for a quote. Body: `{ "quoteId": "..." }`. Returns `clientSecret` and `paymentIntentId`. |
| **Backend:** `POST /api/payments/confirm` | After the client has paid (card authorized), call with `{ "paymentIntentId", "quoteId" }` to accept the quote and create the payment record with Stripe linked. |
| **Backend:** `POST /api/payments/:id/release` | When the client releases payment (job complete), the server **captures** the Stripe Payment Intent so money is taken. Only payments created via the create-intent → confirm flow have a linked Stripe charge. |

So Stripe is used when: **(1)** client pays via the create-intent + confirm flow, and **(2)** client later releases payment (capture). The dashboard “Accept Quote” button currently does **not** run the Stripe payment step; it only accepts the quote and creates a non-Stripe payment record.

### How to test Stripe

1. **Confirm keys and server**  
   Set `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` (test keys). Restart the server. Open the app and log in as a **client** who owns a job that has at least one quote.

2. **Create a Payment Intent (API)**  
   Get a quote ID from the dashboard (e.g. from the job’s quotes). Then:
   ```bash
   # Replace QUOTE_ID and your auth cookie/session as needed
   curl -X POST https://your-app-url/api/payments/create-intent \
     -H "Content-Type: application/json" \
     -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
     -d '{"quoteId":"QUOTE_ID"}'
   ```
   You should get back `clientSecret` and `paymentIntentId`.

3. **Authorize the payment (Stripe test card)**  
   Use Stripe’s test flow to “pay” with the Payment Intent:
   - **Option A:** In Stripe Dashboard → **Developers → Payment Intents** → open the Payment Intent → “Confirm payment” and use test card `4242 4242 4242 4242`.
   - **Option B:** Use Stripe CLI: `stripe payment_intents confirm pi_xxx --payment-method=pm_card_visa` (or create a PaymentMethod first).

4. **Confirm and accept the quote (API)**  
   After the Payment Intent status is `requires_capture`, call confirm so the app accepts the quote and links the payment:
   ```bash
   curl -X POST https://your-app-url/api/payments/confirm \
     -H "Content-Type: application/json" \
     -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
     -d '{"paymentIntentId":"pi_xxx","quoteId":"QUOTE_ID"}'
   ```

5. **Release (capture) from the dashboard**  
   As the same client, go to **Dashboard** → find the job with the payment you just created → use **Release payment** / **Mark Complete & Pay**. That triggers `POST /api/payments/:id/release`, which captures the Stripe Payment Intent. You should see the payment in Stripe Dashboard → **Payments**.

**Stripe test cards:** Use [Stripe test card numbers](https://docs.stripe.com/testing#cards) (e.g. `4242 4242 4242 4242` for success). Your app uses ZAR; test mode works without a real bank.

**Optional:** To test entirely in the UI, the “Accept Quote” flow would need to be updated to: open a payment step → call create-intent → show Stripe Elements (or Checkout) → on success call confirm. Right now you can test Stripe via the API and Dashboard release as above.

### What you need from Stripe (beyond keys)

| Item | Where / How | Required when |
|------|----------------|----------------|
| **API keys** | Dashboard → **Developers → API keys**: Publishable (`pk_...`) and Secret (`sk_...`) | Always |
| **Webhook signing secret** | Dashboard → **Developers → Webhooks** → Add endpoint → URL = `https://your-domain.com/api/stripe/webhook` → copy **Signing secret** (`whsec_...`) | Using your own account (not Replit); recommended for production |
| **Business / payout** | Dashboard → **Settings → Payouts** → Add bank account | When you want to receive real payouts (go live) |
| **Tell us about your business** | Dashboard setup checklist | Before going live (Stripe may prompt) |

**Webhook setup (your own account) – follow the steps below.**

1. In Stripe Dashboard: **Developers → Webhooks → Add endpoint**.
2. **Endpoint URL:** `https://<your-app-domain>/api/stripe/webhook` (no path after `webhook`).
3. Select events to listen to (e.g. `payment_intent.succeeded`, `payment_intent.payment_failed`), or “Select all events” for simplicity.
4. After creating, open the webhook and reveal **Signing secret**. Set it as `STRIPE_WEBHOOK_SECRET` in your environment.

**If your screen says "Create an event destination" (3 steps):**  
- **Step 1 – Select events:** Keep **Your account** selected. Under Events use **Suggested** (then Continue) or **All events**, or under **Selected events** search for `payment_intent` and add e.g. `payment_intent.succeeded`, `payment_intent.payment_failed`. Click **Continue**.  
- **Step 2 – Choose destination type:** Choose **Webhook** / Webhook endpoint. **Continue**.  
- **Step 3 – Configure your destination:** Enter **Endpoint URL** `https://<your-app-domain>/api/stripe/webhook` (e.g. `https://artisanconnect.co.za/api/stripe/webhook` — no path after `webhook`). Create, then open the destination and **Reveal** the **Signing secret** (`whsec_...`). Set `STRIPE_WEBHOOK_SECRET=whsec_...` in your app environment.

You do **not** need to create products in the Product catalog for this app; payments are driven by quotes (custom amounts).

### What the client needs to provide

1. **Stripe account**  
   - Sign up at [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register).  
   - No business bank account is required just to **register** or get API keys.

2. **API keys**  
   - **Publishable key** (starts with `pk_`) – safe to use in the frontend.  
   - **Secret key** (starts with `sk_`) – must stay on the server only.  
   - In Stripe Dashboard: **Developers → API keys**.  
   - Use **Test** keys first, then **Live** when going live.

3. **Bank account (for receiving money)**  
   - **Not** required to create the Stripe account or to integrate payments.  
   - **Required** when you want to receive payouts.  
   - You can add this later under **Settings → Payouts** in the Stripe Dashboard.  
   - A **business bank account** is not mandatory; many individuals/sole proprietors use a regular checking/savings account, depending on country and Stripe’s rules.  
   - Stripe’s docs or support can confirm what’s allowed in South Africa.

4. **If hosted on Replit**  
   - Add the Stripe integration in the Replit project (Connectors).  
   - Connect your Stripe account and choose **development** or **production**; keys are then provided to the app automatically.

5. **If hosted elsewhere (your own Stripe account)**  
   - Set environment variables:  
     - `STRIPE_SECRET_KEY` – Secret key from Dashboard (e.g. `sk_test_...` or `sk_live_...`)  
     - `STRIPE_PUBLISHABLE_KEY` – Publishable key (e.g. `pk_test_...` or `pk_live_...`)  
     - `STRIPE_WEBHOOK_SECRET` – (optional but recommended) Signing secret from Developers → Webhooks after adding endpoint URL `https://your-domain.com/api/stripe/webhook`  
   - Ensure `DATABASE_URL` is set (Stripe-related migrations use it).

---

## Short Message to Client (Rafeeq) – Setting Up Stripe

You can copy, adapt, and send this:

---

**Hi Rafeeq,**

**Quick answer:** You **don’t need a business bank account** to register with Stripe or to get the integration working. You only need a bank account when you want to **receive payouts** from Stripe, and you can add that later.

**To set up Stripe for the app:**

1. **Create a Stripe account**  
   - Go to [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register) and sign up.  
   - Use your business email and the details you’ll use for the platform.

2. **Get your API keys**  
   - In the Stripe Dashboard, open **Developers → API keys**.  
   - You’ll see **Publishable key** and **Secret key**.  
   - Start with **Test** keys for testing; when you’re ready to go live, switch to **Live** keys and add your bank account under **Settings → Payouts**.

3. **Share the keys with the dev team**  
   - Send the **Secret key** (and, if we ask for it, the **Publishable key**) through a secure channel we agree on (e.g. password manager, secure form).  
   - Never post these in chat or email in plain text.

4. **Add your bank account when you’re ready for real payouts**  
   - In Stripe: **Settings → Payouts → Add bank account**.  
   - A normal business or even a dedicated personal/sole‑prop account is often fine; Stripe’s dashboard will show what’s supported for your country.

If you tell me whether you’re hosting on Replit or somewhere else, I can give you the exact steps (e.g. “add Stripe in Replit Connectors” vs “paste these into your hosting provider’s env vars”).

**Ali**

---
