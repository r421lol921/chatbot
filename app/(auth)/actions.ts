"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type LoginActionState = {
  status: "idle" | "in_progress" | "success" | "failed" | "invalid_data";
};

export const login = async (
  _: LoginActionState,
  formData: FormData
): Promise<LoginActionState> => {
  try {
    const { email, password } = authFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { status: "failed" };
    }
  } catch (error) {
    if (error instanceof z.ZodError) return { status: "invalid_data" };
    return { status: "failed" };
  }

  // redirect() must be called outside try/catch — it throws internally
  redirect("/");
};

export type RegisterActionState = {
  status:
    | "idle"
    | "in_progress"
    | "success"
    | "failed"
    | "user_exists"
    | "invalid_data";
};

export const register = async (
  _: RegisterActionState,
  formData: FormData
): Promise<RegisterActionState> => {
  try {
    const { email, password } = authFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    const supabase = await createClient();

    // First check if user already exists by attempting sign-in
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (!signInError) {
      // User exists and credentials match — just log them in
      redirect("/");
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
          `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/auth/callback`,
      },
    });

    if (error) {
      if (error.message?.toLowerCase().includes("already")) {
        return { status: "user_exists" };
      }
      return { status: "failed" };
    }

    // If the user has a session immediately (email confirmation disabled), redirect now
    if (data.session) {
      redirect("/");
    }

    // Otherwise email confirmation is required — show success message
    return { status: "success" };
  } catch (error) {
    if (error instanceof z.ZodError) return { status: "invalid_data" };
    // next/navigation redirect throws — re-throw it
    throw error;
  }
};
