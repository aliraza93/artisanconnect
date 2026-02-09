# Stripe Setup – Requirements & Client Message

## Stripe Requirements for This System

The app uses Stripe for:
- **Payment Intents** – quote payments / escrow (create, capture)
- **Customers** – linked to users via `stripeCustomerId`
- **Webhooks** – to receive payment events (required when using your own Stripe account; optional for testing)

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
