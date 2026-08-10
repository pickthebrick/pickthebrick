"use server";

import { requestPasswordReset, confirmPasswordReset } from "@/lib/passwordReset";

export type PasswordResetResult = { success: true } | { error: string };

export async function requestPasswordResetAction(email: string): Promise<PasswordResetResult> {
  if (!email.trim()) return { error: "Enter your email address." };
  await requestPasswordReset(email);
  return { success: true };
}

export async function confirmPasswordResetAction(token: string, newPassword: string): Promise<PasswordResetResult> {
  if (newPassword.length < 6) return { error: "Password must be at least 6 characters." };
  return confirmPasswordReset(token, newPassword);
}
