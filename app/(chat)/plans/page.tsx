import { CheckIcon } from "lucide-react";
import Link from "next/link";

const basicFeatures = [
  "Lio 1.0 AI model",
  "1 message per 7 hours",
  "Weather, maps & product search",
  "Code & document creation",
  "Chat history",
];

const plusFeatures = [
  "1 message per 5 hours",
  "Everything in Basic",
  "Lio 2.1 Model + Lio 1.0",
  "Priority response quality",
  "More soon!",
];

export default function PlansPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-16">
      {/* Back link */}
      <div className="mb-10 w-full max-w-3xl">
        <Link
          href="/"
          className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          &larr; Back to chat
        </Link>
      </div>

      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Plans
        </h1>
        <p className="mt-3 text-[15px] text-muted-foreground">
          Choose the plan that works for you.
        </p>
      </div>

      {/* Cards */}
      <div className="grid w-full max-w-3xl grid-cols-1 gap-5 md:grid-cols-2">
        {/* PeytO Basic */}
        <div className="flex flex-col rounded-2xl border border-border/60 bg-card p-7 shadow-[var(--shadow-card)]">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Free
          </div>
          <h2 className="text-xl font-bold text-foreground">PeytO Basic</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Get started with Lio for free.
          </p>

          <div className="my-6 border-t border-border/40" />

          <ul className="flex flex-col gap-3 flex-1">
            {basicFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5">
                <div className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-muted">
                  <CheckIcon className="size-2.5 text-muted-foreground" />
                </div>
                <span className="text-[13px] text-foreground">{feature}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <Link
              href="/"
              className="flex h-9 w-full items-center justify-center rounded-xl border border-border/60 bg-background text-[13px] font-medium text-foreground transition-colors hover:bg-muted"
            >
              Start for free
            </Link>
          </div>
        </div>

        {/* PeytO Plus */}
        <div className="relative flex flex-col rounded-2xl border border-border/60 bg-card p-7 shadow-[var(--shadow-float)] overflow-hidden">
          {/* Animated shimmer border accent */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[2px] plus-badge-bg"
            aria-hidden="true"
          />

          <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] plus-badge">
            One-time &bull; $5.00
          </div>
          <h2 className="text-xl font-bold text-foreground">PeytO Plus</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Unlock Lio 2.1 and reduced limits.
          </p>

          <div className="my-6 border-t border-border/40" />

          <ul className="flex flex-col gap-3 flex-1">
            {plusFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5">
                <div className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-muted">
                  <CheckIcon className="size-2.5 text-foreground" />
                </div>
                <span className="text-[13px] font-medium text-foreground">
                  {feature}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-8 rounded-xl border border-border/50 bg-muted/40 p-4">
            <p className="text-[12px] text-center text-muted-foreground mb-2">
              Send <span className="font-bold text-foreground">$5.00</span> to:
            </p>
            <p className="text-center font-mono text-base font-bold plus-badge">
              $itslucidpp
            </p>
            <p className="text-[11px] text-center text-muted-foreground mt-1">
              on CashApp &mdash; one-time, no subscription
            </p>
          </div>

          <p className="mt-3 text-[11px] text-center text-muted-foreground">
            After payment, contact support with your receipt to activate Plus.
          </p>
        </div>
      </div>
    </div>
  );
}
