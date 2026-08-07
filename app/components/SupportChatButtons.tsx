// Floating WhatsApp + AI chat buttons for clients who get stuck partway
// through Design or Build. WhatsApp opens a real click-to-chat link already
// (no backend needed for that); the AI button opens the existing /ask-ai
// page. Swap the WhatsApp number for the real support line, and point the AI
// button at a dedicated widget/endpoint, once the WhatsApp Business API and
// a scoped AI-chat backend are wired up.
const SUPPORT_WHATSAPP_NUMBER = "971523142272";

export default function SupportChatButtons() {
  return (
    <div className="support-chat-buttons">
      <a
        href={`https://wa.me/${SUPPORT_WHATSAPP_NUMBER}`}
        target="_blank"
        rel="noopener noreferrer"
        className="support-chat-btn whatsapp"
        title="Chat with us on WhatsApp"
        aria-label="Chat with us on WhatsApp"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12c0 1.86.5 3.6 1.38 5.1L2 22l5.05-1.33A9.94 9.94 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2Zm0 18.1a8.1 8.1 0 0 1-4.13-1.13l-.3-.18-3 .79.8-2.93-.19-.3A8.1 8.1 0 1 1 20.1 12 8.1 8.1 0 0 1 12 20.1Zm4.44-6.06c-.24-.12-1.44-.71-1.66-.79s-.39-.12-.55.12-.63.79-.78.95-.29.18-.53.06a6.6 6.6 0 0 1-1.95-1.2 7.3 7.3 0 0 1-1.35-1.68c-.14-.24 0-.37.11-.49.11-.11.24-.29.36-.43a1.6 1.6 0 0 0 .24-.4.44.44 0 0 0 0-.42c-.06-.12-.55-1.33-.76-1.82s-.4-.41-.55-.42h-.47a.9.9 0 0 0-.65.3 2.75 2.75 0 0 0-.86 2.05 4.78 4.78 0 0 0 1 2.53 10.9 10.9 0 0 0 4.18 3.7c.58.25 1.04.4 1.4.51a3.36 3.36 0 0 0 1.54.1 2.52 2.52 0 0 0 1.65-1.16 2 2 0 0 0 .14-1.16c-.06-.1-.22-.16-.46-.28Z" />
        </svg>
      </a>
      <a
        href="/ask-ai"
        className="support-chat-btn ai"
        title="Ask our AI assistant"
        aria-label="Ask our AI assistant"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path
            d="M12 3v3M12 18v3M4.2 7.8l2.1 1.2M17.7 15l2.1 1.2M3 12h3M18 12h3M4.2 16.2l2.1-1.2M17.7 9l2.1-1.2"
            strokeLinecap="round"
          />
          <circle cx="12" cy="12" r="4" />
        </svg>
      </a>
    </div>
  );
}
