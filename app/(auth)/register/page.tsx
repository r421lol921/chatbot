"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { AuthForm } from "@/components/chat/auth-form";
import { SubmitButton } from "@/components/chat/submit-button";
import { toast } from "@/components/chat/toast";
import { type RegisterActionState, register } from "../actions";

export default function Page() {
  const [email, setEmail] = useState("");
  const [isSuccessful, setIsSuccessful] = useState(false);

  const [state, formAction] = useActionState<RegisterActionState, FormData>(
    register,
    { status: "idle" }
  );

  useEffect(() => {
    if (state.status === "user_exists") {
      toast({ type: "error", description: "An account with this email already exists. Try signing in." });
    } else if (state.status === "failed") {
      toast({ type: "error", description: "Failed to create account. Please try again." });
    } else if (state.status === "invalid_data") {
      toast({ type: "error", description: "Please enter a valid email and a password of at least 6 characters." });
    } else if (state.status === "success") {
      setIsSuccessful(true);
      toast({ type: "success", description: "Check your email to confirm your account, then sign in." });
    }
  }, [state.status]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get("email") as string);
    formAction(formData);
  };

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
      <p className="text-sm text-muted-foreground">Get started for free — no credit card needed</p>

      {isSuccessful ? (
        <div className="rounded-md border border-border bg-muted/40 p-4 text-center text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Check your email!</p>
          <p className="mt-1">We sent a confirmation link to <span className="font-medium text-foreground">{email}</span>. Click it to activate your account, then{" "}
            <Link href="/login" className="text-foreground underline-offset-4 hover:underline">sign in</Link>.
          </p>
        </div>
      ) : (
        <AuthForm action={handleSubmit} defaultEmail={email}>
          <SubmitButton isSuccessful={false}>Sign up</SubmitButton>
          <p className="text-center text-[13px] text-muted-foreground">
            {"Already have an account? "}
            <Link
              className="text-foreground underline-offset-4 hover:underline"
              href="/login"
            >
              Sign in
            </Link>
          </p>
        </AuthForm>
      )}
    </>
  );
}
