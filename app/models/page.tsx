"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { SparklesIcon } from "lucide-react";

export default function ModelsPage() {
  const [showEmailModal, setShowEmailModal] = useState(false);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      setShowEmailModal(true);
      e.preventDefault();
      e.returnValue = "";
      return "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const models = [
    {
      name: "Lio 1.0",
      uses: "144K",
      description: "Our original AI model, reliable and efficient",
      features: [
        "Fast response times",
        "Optimized for chat",
        "Great for general tasks",
        "Weather & maps support",
      ],
      delay: 0.1,
    },
    {
      name: "Lio 2.1",
      uses: "23K",
      description: "Latest generation with enhanced capabilities",
      features: [
        "Advanced reasoning",
        "Better context understanding",
        "Improved accuracy",
        "Priority support",
      ],
      delay: 0.2,
    },
  ];

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-16">
      {/* Back link */}
      <div className="mb-10 w-full max-w-4xl">
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
          AI Models
        </h1>
        <p className="mt-3 text-[15px] text-muted-foreground">
          Explore the Lio models powering your conversations.
        </p>
      </div>

      {/* Models Grid */}
      <div className="grid w-full max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
        {models.map((model, index) => (
          <motion.div
            key={model.name}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col rounded-2xl border border-border/60 bg-card p-7 shadow-[var(--shadow-card)]"
            initial={{ opacity: 0, y: 10 }}
            transition={{ delay: model.delay, duration: 0.4 }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {model.name}
                </h2>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {model.description}
                </p>
              </div>
              <SparklesIcon className="size-5 text-foreground/50 mt-1 ml-2" />
            </div>

            {/* Usage Stats */}
            <div className="mt-4 rounded-lg bg-muted/40 p-3 border border-border/40">
              <div className="text-[12px] text-muted-foreground">
                Current Uses
              </div>
              <div className="text-lg font-bold text-foreground mt-1">
                {model.uses}
              </div>
            </div>

            <div className="my-6 border-t border-border/40" />

            {/* Features */}
            <ul className="flex flex-col gap-2.5 flex-1">
              {model.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2.5 text-[13px] text-foreground"
                >
                  <div className="mt-1.5 size-1.5 rounded-full bg-foreground/60 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            {/* Action Button */}
            <div className="mt-8">
              <Link
                href="/"
                className="flex h-9 w-full items-center justify-center rounded-xl border border-border/60 bg-foreground text-background text-[13px] font-medium transition-all hover:bg-foreground/90"
              >
                Try {model.name}
              </Link>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Info Section */}
      <div className="mt-12 w-full max-w-4xl">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border/60 bg-card p-6 shadow-[var(--shadow-card)]"
          initial={{ opacity: 0, y: 10 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <h3 className="text-sm font-bold text-foreground mb-3">
            How to Choose?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-[13px] text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Lio 1.0</p>
              <p>
                Perfect for quick answers, general questions, and when you want
                fast responses.
              </p>
            </div>
            <div className="text-[13px] text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Lio 2.1</p>
              <p>
                Best for complex tasks, detailed analysis, and when you need
                more advanced reasoning.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Back to Plans Link */}
      <div className="mt-8 text-center">
        <p className="text-[13px] text-muted-foreground mb-2">
          Want to unlock more features?
        </p>
        <Link
          href="/plans"
          className="text-[13px] font-medium text-foreground hover:text-muted-foreground transition-colors"
        >
          View Plans &rarr;
        </Link>
      </div>
    </div>
  );
}
