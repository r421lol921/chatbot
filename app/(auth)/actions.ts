"use server";

import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { status: "failed" };
    }

    redirect("/");
  } catch (error) {
    // redirect() throws internally — must re-throw it
    if (isRedirectError(error)) throw error;
    if (error instanceof z.ZodError) return { status: "invalid_data" };
    return { status: "failed" };
  }

  return { status: "success" };
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
      if (
        error.message?.toLowerCase().includes("already") ||
        error.message?.toLowerCase().includes("registered")
      ) {
        return { status: "user_exists" };
      }
      return { status: "failed" };
    }

    // user already existed — identities array is empty
    if (data.user && data.user.identities?.length === 0) {
      return { status: "user_exists" };
    }

    // Email confirmation disabled — session is available immediately
    if (data.session) {
      redirect("/");
    }

    // Email confirmation required
    return { status: "success" };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (error instanceof z.ZodError) return { status: "invalid_data" };
    return { status: "failed" };
  }

  return { status: "success" };
};
