"use client";

// Light-touch contact capture, shared by Build's confirm step and Design's
// submit step - just one field (phone/WhatsApp preferred, email as a
// fallback), no password, no full sign-up form. Purely presentational: the
// parent owns the method/value state and what happens on submit, so it can
// be dropped into either flow's own confirm UI without duplicating markup.
export type ContactMethod = "phone" | "email";

export default function ContactCaptureForm({
  method,
  onMethodChange,
  value,
  onValueChange,
  autoFocus,
}: {
  method: ContactMethod;
  onMethodChange: (method: ContactMethod) => void;
  value: string;
  onValueChange: (value: string) => void;
  autoFocus?: boolean;
}) {
  return (
    <div className="contact-capture">
      <div className="contact-capture-toggle">
        <button type="button" className={method === "phone" ? "selected" : ""} onClick={() => onMethodChange("phone")}>
          WhatsApp
        </button>
        <button type="button" className={method === "email" ? "selected" : ""} onClick={() => onMethodChange("email")}>
          Email
        </button>
      </div>
      <input
        type={method === "phone" ? "tel" : "email"}
        inputMode={method === "phone" ? "tel" : "email"}
        placeholder={method === "phone" ? "e.g. 050 123 4567" : "e.g. you@company.com"}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        autoFocus={autoFocus}
      />
    </div>
  );
}
