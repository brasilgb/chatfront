import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "🤖 Chatbot Solar",
  description: "Interface inteligente para atendimento e consultas SigmaMed",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col" suppressHydrationWarning={true}>{children}</body>
    </html>
  );
}
