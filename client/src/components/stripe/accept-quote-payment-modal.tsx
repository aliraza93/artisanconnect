import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { api, type Quote, type Job } from "@/lib/api";

const appearance = {
  theme: "stripe" as const,
  variables: {
    colorPrimary: "#2563eb",
    borderRadius: "8px",
  },
};

function formatCurrency(amount: string): string {
  const n = parseFloat(amount);
  if (isNaN(n)) return amount;
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
  }).format(n);
}

interface PaymentFormInnerProps {
  clientSecret: string;
  paymentIntentId: string;
  quoteId: string;
  userEmail?: string;
  processing: boolean;
  onSuccess: () => void;
  onCancel: () => void;
  setProcessing: (v: boolean) => void;
  setError: (v: string | null) => void;
}

function PaymentFormInner({
  clientSecret,
  paymentIntentId,
  quoteId,
  userEmail,
  processing,
  onSuccess,
  onCancel,
  setProcessing,
  setError,
}: PaymentFormInnerProps) {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const returnUrl = `${window.location.origin}/dashboard`;
    const { error } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: returnUrl,
        receipt_email: userEmail || undefined,
      },
      redirect: "if_required",
    });

    if (error) {
      setError(error.message || "Payment failed");
      setProcessing(false);
      return;
    }

    try {
      await api.confirmPayment(paymentIntentId, quoteId);
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to confirm payment");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!stripe || processing}>
          {processing ? "Processing…" : "Pay and accept quote"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export interface AcceptQuotePaymentModalProps {
  quote: Quote;
  job?: Job;
  userEmail?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AcceptQuotePaymentModal({
  quote,
  job,
  userEmail,
  onSuccess,
  onCancel,
}: AcceptQuotePaymentModalProps) {
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const config = await api.getStripeConfig();
        if (cancelled) return;
        if (!config.publishableKey) {
          setError("Stripe is not configured");
          setLoading(false);
          return;
        }
        setPublishableKey(config.publishableKey);
        setStripePromise(loadStripe(config.publishableKey));

        const { clientSecret: secret, paymentIntentId: piId } = await api.createPaymentIntent(quote.id);
        if (cancelled) return;
        setClientSecret(secret);
        setPaymentIntentId(piId);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to start payment");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [quote.id]);

  const open = true;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pay and accept quote</DialogTitle>
          <DialogDescription>
            Secure payment. Funds are held in escrow until the job is complete.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-slate-50 p-4 text-sm">
            {job && (
              <p className="font-medium text-slate-900">{job.title}</p>
            )}
            <p className="mt-1 text-slate-600">
              {quote.artisanName || "Artisan"} · {formatCurrency(quote.amount)} total
            </p>
            <p className="mt-1 text-slate-500">20% platform fee included in total</p>
          </div>

          {loading && (
            <div className="py-8 text-center text-slate-500">Preparing payment form...</div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {!loading && clientSecret && paymentIntentId && stripePromise && !error && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance,
              }}
            >
              <PaymentFormInner
                clientSecret={clientSecret}
                paymentIntentId={paymentIntentId}
                quoteId={quote.id}
                userEmail={userEmail}
                processing={processing}
                onSuccess={onSuccess}
                onCancel={onCancel}
                setProcessing={setProcessing}
                setError={setError}
              />
            </Elements>
          )}

          {!loading && error && (
            <DialogFooter>
              <Button variant="outline" onClick={onCancel}>
                Close
              </Button>
            </DialogFooter>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
