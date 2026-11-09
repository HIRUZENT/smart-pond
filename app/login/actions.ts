"use server";

// Kompatibilitas dengan form lama dan tombol logout di protected layout.
import { redirect } from "next/navigation";
import { createSession, destroySession, landingPageForRole } from "@/src/lib/auth";
import { authenticateCredentials } from "@/src/lib/login-service";

export type LoginState = { error: string | null };

export async function loginAction(_state: LoginState, formData: FormData): Promise<LoginState> {
  const result = await authenticateCredentials({
    loginId: formData.get("loginId"),
    password: formData.get("password"),
  });

  if (!result.ok) return { error: result.error };
  await createSession(result.user.id);
  redirect(landingPageForRole(result.user.role));
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
