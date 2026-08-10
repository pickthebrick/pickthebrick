"use client";

import { useState } from "react";
import Link from "next/link";
import { updateProfile, changeEmail, setOrChangePassword } from "@/app/actions/profile";
import PhoneVerifyStep from "@/app/components/PhoneVerifyStep";
import { Role } from "@/app/generated/prisma/enums";
import "./profile.css";

const ROLE_LABELS: Record<Role, string> = {
  client: "Client",
  captain: "Captain",
  contractor: "Contractor",
  designer: "Designer",
  marketing: "Marketing",
  admin: "Admin",
  super_admin: "Super Admin",
};

export default function ProfileClient({
  email,
  fullName,
  company,
  phone,
  whatsappNumber,
  whatsappVerifiedAt,
  hasPassword,
  hasGoogle,
  role,
  dashboardHref,
}: {
  email: string;
  fullName: string | null;
  company: string | null;
  phone: string | null;
  whatsappNumber: string | null;
  whatsappVerifiedAt: Date | null;
  hasPassword: boolean;
  hasGoogle: boolean;
  role: Role;
  dashboardHref: string;
}) {
  const [nameDraft, setNameDraft] = useState(fullName ?? "");
  const [companyDraft, setCompanyDraft] = useState(company ?? "");
  const [nameBusy, setNameBusy] = useState(false);
  const [nameMsg, setNameMsg] = useState<string | null>(null);

  const [emailDraft, setEmailDraft] = useState(email);
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailMsg, setEmailMsg] = useState<string | null>(null);
  const [emailErr, setEmailErr] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);

  const [verifiedAt, setVerifiedAt] = useState(whatsappVerifiedAt);
  const [showPhoneVerify, setShowPhoneVerify] = useState(false);

  async function handleNameSave(e: React.FormEvent) {
    e.preventDefault();
    setNameBusy(true);
    setNameMsg(null);
    try {
      await updateProfile({ fullName: nameDraft, company: companyDraft });
      setNameMsg("Saved.");
    } finally {
      setNameBusy(false);
    }
  }

  async function handleEmailSave(e: React.FormEvent) {
    e.preventDefault();
    setEmailBusy(true);
    setEmailMsg(null);
    setEmailErr(null);
    try {
      const result = await changeEmail(emailDraft);
      if ("error" in result) {
        setEmailErr(result.error);
        return;
      }
      setEmailMsg("Email updated.");
    } finally {
      setEmailBusy(false);
    }
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    setPwErr(null);
    setPwMsg(null);
    if (newPassword !== confirmPassword) {
      setPwErr("Passwords don't match.");
      return;
    }
    setPwBusy(true);
    try {
      const result = await setOrChangePassword({ currentPassword: currentPassword || undefined, newPassword });
      if ("error" in result) {
        setPwErr(result.error);
        return;
      }
      setPwMsg(hasPassword ? "Password changed." : "Password set.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } finally {
      setPwBusy(false);
    }
  }

  function handlePhoneVerified() {
    setShowPhoneVerify(false);
    setVerifiedAt(new Date());
  }

  return (
    <div className="profile-page">
      <header className="profile-header">
        <Link href="/" className="brand-mark">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="PickTheBrick" />
        </Link>
        <Link href={dashboardHref} className="profile-back-link">
          ← Back to dashboard
        </Link>
      </header>

      <main className="profile-main">
        <div className="profile-intro">
          <h1>Your profile</h1>
          <p>
            {ROLE_LABELS[role]} account
          </p>
        </div>

        <section className="profile-card">
          <h2>Name &amp; company</h2>
          <form onSubmit={handleNameSave} className="profile-form">
            <label>
              Full name
              <input type="text" value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} placeholder="Full name" />
            </label>
            <label>
              Company (optional)
              <input type="text" value={companyDraft} onChange={(e) => setCompanyDraft(e.target.value)} placeholder="Company name" />
            </label>
            <div className="profile-form-actions">
              {nameMsg && <span className="profile-msg">{nameMsg}</span>}
              <button type="submit" className="profile-btn-primary" disabled={nameBusy}>
                {nameBusy ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </section>

        <section className="profile-card">
          <h2>Email</h2>
          <form onSubmit={handleEmailSave} className="profile-form">
            <label>
              Email address
              <input type="email" required value={emailDraft} onChange={(e) => setEmailDraft(e.target.value)} />
            </label>
            <div className="profile-form-actions">
              {emailErr && <span className="profile-err">{emailErr}</span>}
              {emailMsg && <span className="profile-msg">{emailMsg}</span>}
              <button type="submit" className="profile-btn-primary" disabled={emailBusy}>
                {emailBusy ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </section>

        <section className="profile-card">
          <h2>WhatsApp number</h2>
          {verifiedAt ? (
            <div className="profile-phone-row">
              <span className="profile-verified-badge">Verified</span>
              <span>{whatsappNumber}</span>
              <button type="button" className="profile-btn-secondary" onClick={() => setShowPhoneVerify(true)}>
                Change number
              </button>
            </div>
          ) : (
            <div className="profile-phone-row">
              <span className="profile-muted">Not verified yet</span>
              <button type="button" className="profile-btn-primary" onClick={() => setShowPhoneVerify(true)}>
                Verify a WhatsApp number
              </button>
            </div>
          )}
          {phone && phone !== whatsappNumber && <p className="profile-hint">Contact number on file: {phone}</p>}
        </section>

        <section className="profile-card">
          <h2>Password</h2>
          {hasGoogle && !hasPassword && (
            <p className="profile-hint">Your account signs in with Google. Set a password to also sign in with email.</p>
          )}
          <form onSubmit={handlePasswordSave} className="profile-form">
            {hasPassword && (
              <label>
                Current password
                <input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </label>
            )}
            <label>
              {hasPassword ? "New password" : "Set a password"}
              <input
                type="password"
                required
                minLength={6}
                placeholder="Min. 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </label>
            <label>
              Confirm password
              <input
                type="password"
                required
                minLength={6}
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </label>
            <div className="profile-form-actions">
              {pwErr && <span className="profile-err">{pwErr}</span>}
              {pwMsg && <span className="profile-msg">{pwMsg}</span>}
              <button type="submit" className="profile-btn-primary" disabled={pwBusy}>
                {pwBusy ? "Saving..." : hasPassword ? "Change password" : "Set password"}
              </button>
            </div>
          </form>
        </section>
      </main>

      {showPhoneVerify && (
        <PhoneVerifyStep
          onSuccess={handlePhoneVerified}
          onCancel={() => setShowPhoneVerify(false)}
          initialPhone={whatsappNumber ?? phone ?? undefined}
        />
      )}
    </div>
  );
}
