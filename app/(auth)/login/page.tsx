"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

import { AuthForm } from "@/components/chat/auth-form";
import { SubmitButton } from "@/components/chat/submit-button";
import { toast } from "@/components/chat/toast";
import { type LoginActionState, login } from "../actions";

export default function Page() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  const [state, formAction] = useActionState<LoginActionState, FormData>(
    login,
    { status: "idle" }
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: router is a stable ref
  useEffect(() => {
    if (state.status === "failed") {
      toast({ type: "error", description: "Invalid credentials!" });
    } else if (state.status === "invalid_data") {
      toast({ type: "error", description: "Failed validating your submission!" });
    } else if (state.status === "success") {
      setIsSuccessful(true);
      router.push("/");
      router.refresh();
    }
  }, [state.status]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get("email") as string);
    formAction(formData);
  };

  const handleGuestLogin = async () => {
    setIsGuest(true);
    try {
      const res = await fetch("/api/auth/guest?redirectUrl=/");
      if (res.ok || res.redirected) {
        router.push("/");
        router.refresh();
      } else {
        toast({ type: "error", description: "Could not start guest session." });
        setIsGuest(false);
      }
    } catch {
      toast({ type: "error", description: "Could not start guest session." });
      setIsGuest(false);
    }
  };

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back to Lio 1.0</h1>
      <p className="text-sm text-muted-foreground">
        Sign in to your account to continue chatting
      </p>
      <AuthForm action={handleSubmit} defaultEmail={email}>
        <SubmitButton isSuccessful={isSuccessful}>Sign in</SubmitButton>
        <p className="text-center text-[13px] text-muted-foreground">
          {"No account? "}
          <Link
            className="text-foreground underline-offset-4 hover:underline"
            href="/register"
          >
            Sign up
          </Link>
        </p>
      </AuthForm>
      <div className="relative flex items-center gap-2">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <button
        type="button"
        onClick={handleGuestLogin}
        disabled={isGuest}
        className="w-full rounded-md border border-border bg-transparent px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isGuest ? "Starting guest session..." : "Continue as Guest"}
      </button>
    </>
  );
}
