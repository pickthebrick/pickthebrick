"use server";

import { requestPasswordReset, confirmPasswordReset } from "@/lib/passwordReset";
import type { Role } from "@/app/generated/prisma/enums";

export type PasswordResetResult = { success: true } | { error: string };
export type ConfirmPasswordResetResult = { success: true; role: Role } | { error: string };

export async function requestPasswordResetAction(email: string): Promise<PasswordResetResult> {
  if (!email.trim()) return { error: "Enter your email address." };
  await requestPasswordReset(email);
  return { success: true };
}

export async function confirmPasswordResetAction(token: string, newPassword: string): Promise<ConfirmPasswordResetResult> {
  if (newPassword.length < 6) return { error: "Password must be at least 6 characters." };
  return confirmPasswordReset(token, newPassword);
}
