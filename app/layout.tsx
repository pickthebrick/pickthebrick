import type { Metadata } from "next";
import { Raleway } from "next/font/google";
import { getSession } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/roles";
import AccountBar from "@/app/components/AccountBar";
import SupportChatButtons from "@/app/components/SupportChatButtons";
import "./globals.css";

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PickTheBrick",
  description: "Office fitout aggregator - Dubai, UAE",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  // Clients land on /build by default (ROLE_HOME) since that's the useful
  // post-login destination, but "my dashboard" for a client means their
  // quotes/design-requests summary, not the shopping tool itself.
  const dashboardHref = session ? (session.role === "client" ? "/my-quotes" : ROLE_HOME[session.role]) : null;
  // Chat help is for clients (and anonymous visitors deciding whether to
  // sign up) - every other role has staff support channels of their own.
  const showSupportChat = !session || session.role === "client";

  return (
    <html lang="en" className={`${raleway.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {dashboardHref && <AccountBar dashboardHref={dashboardHref} />}
        {showSupportChat && <SupportChatButtons />}
        {children}
      </body>
    </html>
  );
}
