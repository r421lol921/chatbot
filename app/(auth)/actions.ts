"use server";

import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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

    const result = await auth.api.signInEmail({
      body: { email, password },
      headers: await headers(),
    });

    if (!result || result.user === null) {
      return { status: "failed" };
    }

    redirect("/");
  } catch (error) {
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

    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: email.split("@")[0],
      },
      headers: await headers(),
    });

    if (!result || result.user === null) {
      return { status: "failed" };
    }

    redirect("/");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (error instanceof z.ZodError) return { status: "invalid_data" };
    const msg = error instanceof Error ? error.message.toLowerCase() : "";
    if (msg.includes("already") || msg.includes("exists")) {
      return { status: "user_exists" };
    }
    return { status: "failed" };
  }

  return { status: "success" };
};
